import { create } from "zustand";
import { getThreadConfig, threadApi, type Thread, type ThreadMessage } from "@/lib/thread-api";
import { defaultThreadConfig, useThreadConfigStore, type ThreadConfig } from "@/lib/config-store";
import { threadConfigSchema } from "@/lib/schemas/thread-config";

type ThreadStore = {
  threads: Thread[];
  messages: Record<string, ThreadMessage[]>;
  messagesStatus: "idle" | "loading" | "error";
  messagesError: string | null;
  selectedThreadId: string | null;
  status: "idle" | "loading" | "saving" | "deleting" | "error";
  error: string | null;
  fetchThreads: (projectId: string) => Promise<void>;
  fetchMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string, signal?: AbortSignal) => Promise<Response>;
  editMessage: (threadId: string, messageId: string, content: string) => Promise<unknown>;
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

const message = (error: unknown) => (error instanceof Error ? error.message : "Request failed");
const configTimers = new Map<string, ReturnType<typeof setTimeout>>();

export const useThreadStore = create<ThreadStore>((set, get) => ({
  threads: [],
  messages: {},
  messagesStatus: "idle",
  messagesError: null,
  selectedThreadId: null,
  status: "idle",
  error: null,
  latestPipelineVersions: {},
  refreshGenerations: {},
  pendingMessageAction: null,

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
    set({ messagesStatus: "loading", messagesError: null });
    try {
      const messages = (await threadApi.messages(threadId)) ?? [];
      set((state) => ({
        messages: { ...state.messages, [threadId]: messages },
        messagesStatus: "idle",
      }));
    } catch (error) {
      set({ messagesStatus: "error", messagesError: message(error) });
      throw error;
    }
  },

  sendMessage: (threadId, content, signal) =>
    threadApi.sendMessage(threadId, { content, signal }),
  editMessage: (threadId, messageId, content) =>(
    threadApi.editMessage(threadId, messageId, content)),
  retryMessage: (threadId, messageId, signal) =>
    threadApi.retryMessage(threadId, messageId, signal),
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
    configTimers.set(threadId, setTimeout(async () => {
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
      }
    }, 500));
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
