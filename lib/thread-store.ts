import { create } from "zustand";
import { getThreadConfig, threadApi, type Thread, type ThreadMessage, type RunDetails, type RunStep } from "@/lib/thread-api";
import { defaultThreadConfig, useThreadConfigStore, type ThreadConfig } from "@/lib/config-store";
import { threadConfigSchema } from "@/lib/schemas/thread-config";

type ThreadStore = {
  threads: Thread[];
  messages: Record<string, ThreadMessage[]>;
  messagesStatus: "idle" | "loading" | "error";
  messagesError: string | null;
  messageIdMap: Record<string, string>;
  registerMessageIdMapping: (clientMsgId: string, backendMsgId: string) => void;
  resolveBackendMessageId: (id: string, threadId?: string) => string;
  selectedThreadId: string | null;
  status: "idle" | "loading" | "saving" | "deleting" | "error";
  error: string | null;
  liveRuns: Record<string, RunDetails>;
  activeLiveRunId: string | null;
  initLiveRun: (runId: string, threadId: string, inputMessageId?: string | null, clientMsgId?: string | null) => void;
  updateLiveRunStep: (runId: string, step: RunStep) => void;
  completeLiveRun: (runId: string, outputMessageId?: string | null, response?: string | null) => void;
  cancelLiveRun: (runId: string, outputMessageId?: string | null) => void;
  failLiveRun: (runId: string, error?: any) => void;
  getLiveRun: (messageId?: string | null, runId?: string | null) => RunDetails | null;
  fetchThreads: (projectId: string) => Promise<void>;
  fetchMessages: (threadId: string) => Promise<void>;
  fetchRunSteps: (messageId: string) => Promise<RunDetails>;
  fetchRunDetails: (runId: string) => Promise<RunDetails>;
  sendMessage: (threadId: string, content: string, signal?: AbortSignal) => Promise<Response>;
  editMessage: (threadId: string, messageId: string, content: string, signal?: AbortSignal) => Promise<Response>;
  retryMessage: (threadId: string, messageId: string, signal?: AbortSignal) => Promise<Response>;
  pendingMessageAction: { type: "edit" | "retry"; messageId: string } | null;
  setPendingMessageAction: (action: { type: "edit" | "retry"; messageId: string }) => void;
  clearPendingMessageAction: () => void;
  createThread: (projectId: string, knowledgeBaseIds: string[], title?: string) => Promise<Thread>;
  renameThread: (threadId: string, title: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  selectThread: (threadId: string | null) => void;
  saveThreadConfig: (threadId: string, config: ThreadConfig) => Promise<void>;
  refreshThreadConfig: (threadId: string) => Promise<void>;
  latestPipelineVersions: Record<string, number>;
  refreshGenerations: Record<string, number>;
  clearError: () => void;
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(id: string | null | undefined): boolean {
  return typeof id === "string" && UUID_REGEX.test(id);
}

const message = (error: unknown) => (error instanceof Error ? error.message : "Request failed");
const configTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingSaves = new Map<string, () => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    for (const save of pendingSaves.values()) {
      save();
    }
  });
}

export const useThreadStore = create<ThreadStore>((set, get) => ({
  threads: [],
  messages: {},
  messagesStatus: "idle",
  messagesError: null,
  messageIdMap: {},
  selectedThreadId: null,
  status: "idle",
  error: null,
  latestPipelineVersions: {},
  refreshGenerations: {},
  pendingMessageAction: null,
  liveRuns: {},
  activeLiveRunId: null,

  initLiveRun: (runId, threadId, inputMessageId, clientMsgId) =>
    set((state) => {
      const existing = state.liveRuns[runId];
      const newRun: RunDetails = existing || {
        id: runId,
        thread_id: threadId,
        input_message_id: inputMessageId ?? null,
        output_message_id: null,
        run_type: "chat",
        status: "running",
        started_at: new Date().toISOString(),
        completed_at: null,
        error: null,
        steps: [],
      };
      return {
        liveRuns: { ...state.liveRuns, [runId]: newRun },
        activeLiveRunId: runId,
      };
    }),

  updateLiveRunStep: (runId, step) =>
    set((state) => {
      const run = state.liveRuns[runId];
      if (!run) {
        const newRun: RunDetails = {
          id: runId,
          thread_id: "",
          input_message_id: null,
          output_message_id: null,
          run_type: "chat",
          status: "running",
          started_at: step.started_at ?? new Date().toISOString(),
          completed_at: null,
          error: null,
          steps: [step],
        };
        return {
          liveRuns: { ...state.liveRuns, [runId]: newRun },
          activeLiveRunId: runId,
        };
      }

      const steps = [...run.steps];
      const idx = steps.findIndex(
        (s) => s.id === step.id || (s.sequence === step.sequence && s.step_type === step.step_type)
      );
      if (idx >= 0) {
        steps[idx] = { ...steps[idx], ...step };
      } else {
        steps.push(step);
      }
      steps.sort((a, b) => a.sequence - b.sequence);

      return {
        liveRuns: {
          ...state.liveRuns,
          [runId]: {
            ...run,
            steps,
          },
        },
      };
    }),

  completeLiveRun: (runId, outputMessageId) =>
    set((state) => {
      const run = state.liveRuns[runId];
      if (!run) return state;

      const steps = run.steps.map((s) =>
        s.status === "running"
          ? { ...s, status: "completed", completed_at: s.completed_at ?? new Date().toISOString() }
          : s
      );

      return {
        liveRuns: {
          ...state.liveRuns,
          [runId]: {
            ...run,
            status: "completed",
            completed_at: new Date().toISOString(),
            output_message_id: outputMessageId ?? run.output_message_id,
            steps,
          },
        },
        activeLiveRunId: state.activeLiveRunId === runId ? null : state.activeLiveRunId,
      };
    }),

  cancelLiveRun: (runId, outputMessageId) =>
    set((state) => {
      const run = state.liveRuns[runId];
      if (!run) return state;

      const steps = run.steps.map((s) =>
        s.status === "running"
          ? { ...s, status: "cancelled", completed_at: s.completed_at ?? new Date().toISOString() }
          : s
      );

      return {
        liveRuns: {
          ...state.liveRuns,
          [runId]: {
            ...run,
            status: "cancelled",
            completed_at: new Date().toISOString(),
            output_message_id: outputMessageId ?? run.output_message_id,
            steps,
          },
        },
        activeLiveRunId: state.activeLiveRunId === runId ? null : state.activeLiveRunId,
      };
    }),

  failLiveRun: (runId, error) =>
    set((state) => {
      const run = state.liveRuns[runId];
      if (!run) return state;

      return {
        liveRuns: {
          ...state.liveRuns,
          [runId]: {
            ...run,
            status: "failed",
            completed_at: new Date().toISOString(),
            error: error ?? { message: "Run failed" },
          },
        },
        activeLiveRunId: state.activeLiveRunId === runId ? null : state.activeLiveRunId,
      };
    }),

  getLiveRun: (messageId, runId) => {
    const { liveRuns, activeLiveRunId, messageIdMap } = get();
    if (runId && liveRuns[runId]) {
      return liveRuns[runId];
    }
    if (messageId) {
      const match = Object.values(liveRuns).find(
        (r) => r.input_message_id === messageId || r.output_message_id === messageId
      );
      if (match) return match;

      const mappedId = messageIdMap[messageId];
      if (mappedId) {
        const mappedMatch = Object.values(liveRuns).find(
          (r) => r.input_message_id === mappedId || r.output_message_id === mappedId
        );
        if (mappedMatch) return mappedMatch;
      }
    }
    if (!messageId && !runId && activeLiveRunId && liveRuns[activeLiveRunId]) {
      return liveRuns[activeLiveRunId];
    }
    return null;
  },

  registerMessageIdMapping: (clientMsgId, backendMsgId) =>
    set((state) => ({
      messageIdMap: { ...state.messageIdMap, [clientMsgId]: backendMsgId },
    })),

  resolveBackendMessageId: (id, threadId) => {
    if (isUuid(id)) return id;
    const mapped = get().messageIdMap[id];
    if (isUuid(mapped)) return mapped;
    if (threadId) {
      const threadMsgs = get().messages[threadId] ?? [];
      const humanMsgs = threadMsgs.filter((m) => m.role === "human");
      if (humanMsgs.length > 0) {
        const last = humanMsgs[humanMsgs.length - 1];
        if (isUuid(last.id)) return last.id;
      }
    }
    return id;
  },

  fetchThreads: async (projectId) => {
    set({ status: "loading", error: null });
    try {
      const threads = (await threadApi.list(projectId)) ?? [];
      const selected = get().selectedThreadId;
      set({ threads, selectedThreadId: threads.some((item) => item.id === selected) ? selected : threads[0]?.id ?? null, status: "idle" });
      for (const thread of threads) {
        const config = getThreadConfig(thread.metadata);
        if (config) useThreadConfigStore.getState().setConfig(thread.id, config);
      }
    } catch (error) {
      set({ status: "error", error: message(error) });
    }
  },

  fetchMessages: async (threadId) => {
    const hasCachedMessages = Boolean(get().messages[threadId]);
    if (!hasCachedMessages) {
      set({ messagesStatus: "loading", messagesError: null });
    }
    try {
      const messages = (await threadApi.messages(threadId)) ?? [];
      set((state) => ({
        messages: { ...state.messages, [threadId]: messages },
        messagesStatus: "idle",
        messagesError: null,
      }));
    } catch (error) {
      set({ messagesStatus: "error", messagesError: message(error) });
      throw error;
    }
  },

  fetchRunSteps: (messageId) => {
    if (!isUuid(messageId)) {
      return Promise.reject(new Error("Valid message UUID required to fetch execution steps."));
    }
    return threadApi.runSteps(messageId);
  },

  fetchRunDetails: (runId) => {
    if (!isUuid(runId)) {
      return Promise.reject(new Error("Valid run UUID required to fetch execution steps."));
    }
    return threadApi.runDetails(runId);
  },

  sendMessage: (threadId, content, signal) =>
    threadApi.sendMessage(threadId, { content, signal }),
  editMessage: (threadId, messageId, content, signal) => {
    const resolvedId = get().resolveBackendMessageId(messageId, threadId);
    return threadApi.editMessage(threadId, resolvedId, content, signal);
  },
  retryMessage: (threadId, messageId, signal) => {
    const resolvedId = get().resolveBackendMessageId(messageId, threadId);
    return threadApi.retryMessage(threadId, resolvedId, signal);
  },
  setPendingMessageAction: (pendingMessageAction) => set({ pendingMessageAction }),
  clearPendingMessageAction: () => set({ pendingMessageAction: null }),

  createThread: async (projectId, knowledgeBaseIds, title = "New thread") => {
    set({ status: "saving", error: null });
    const config = defaultThreadConfig;
    try {
      const thread = await threadApi.create(projectId, { title, knowledge_base_ids: knowledgeBaseIds, config });
      useThreadConfigStore.getState().setConfig(thread.id, thread.metadata?.config ?? config);
      set((state) => ({ threads: [thread, ...state.threads], selectedThreadId: thread.id, status: "idle" }));
      return thread;
    } catch (error) {
      set({ status: "error", error: message(error) });
      throw error;
    }
  },

  renameThread: async (threadId, title) => {
    try {
      const thread = await threadApi.update(threadId, { title });
      set((state) => ({ threads: state.threads.map((item) => item.id === threadId ? { ...item, ...thread, title } : item) }));
    } catch (error) {
      set({ status: "error", error: message(error) });
      throw error;
    }
  },

  deleteThread: async (threadId) => {
    set({ status: "deleting", error: null });
    try {
      await threadApi.remove(threadId);
      set((state) => {
        const threads = state.threads.filter((item) => item.id !== threadId);
        return { threads, selectedThreadId: state.selectedThreadId === threadId ? threads[0]?.id ?? null : state.selectedThreadId, status: "idle" };
      });
    } catch (error) {
      set({ status: "error", error: message(error) });
      throw error;
    }
  },

  selectThread: (selectedThreadId) => set({ selectedThreadId }),
  saveThreadConfig: async (threadId, config) => {
    set((state) => ({
      refreshGenerations: {
        ...state.refreshGenerations,
        [threadId]: (state.refreshGenerations[threadId] ?? 0) + 1,
      },
    }));
    const previousTimer = configTimers.get(threadId);
    if (previousTimer) clearTimeout(previousTimer);
    
    const saveFn = async () => {
      try {
        set({ status: "saving", error: null });
        const updated = await threadApi.update(threadId, { config });
        set((state) => ({
          threads: state.threads.map((thread) => thread.id === threadId ? updated : thread),
          status: "idle",
        }));
        await get().refreshThreadConfig(threadId);
      } catch (error) {
        console.error("Failed to save thread config:", error);
        set({ status: "error", error: message(error) });
      } finally {
        configTimers.delete(threadId);
        pendingSaves.delete(threadId);
      }
    };
    
    pendingSaves.set(threadId, saveFn);
    configTimers.set(threadId, setTimeout(saveFn, 500));
  },
  refreshThreadConfig: async (threadId) => {
    const generation = (get().refreshGenerations[threadId] ?? 0) + 1;
    set((state) => ({
      refreshGenerations: {
        ...state.refreshGenerations,
        [threadId]: generation,
      },
    }));
    try {
      const latest = await threadApi.latestPipeline(threadId);
      const parsed = threadConfigSchema.safeParse(latest.config);
      console.log("Latest thread configuration:", latest);
      console.log("Parsed thread configuration:", parsed);
      if (!parsed.success) {
        console.error(
          "Invalid thread configuration:",
          parsed.error.issues
        );

        throw new Error("Latest thread configuration is invalid");
      }
      if (get().refreshGenerations[threadId] !== generation) return;
      useThreadConfigStore.getState().setConfig(threadId, parsed.data);
      set((state) => ({
        latestPipelineVersions: {
          ...state.latestPipelineVersions,
          [threadId]: latest.version,
        },
      }));
    } catch (error) {
      set({ error: message(error) });
      throw error;
    }
  },
  clearError: () => set({ error: null, messagesError: null }),
}));
