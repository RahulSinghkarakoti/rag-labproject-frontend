import { threadApi, getThreadConfig } from "@/lib/api/threads";
import { defaultThreadConfig, useThreadConfigStore } from "@/lib/config-store";
import type { ThreadSlice, ThreadSliceCreator } from "./types";
import { errorMessage } from "./utils";

export const createThreadSlice: ThreadSliceCreator<ThreadSlice> = (set, get) => ({
  threads: [],
  selectedThreadId: null,
  status: "idle",
  error: null,

  fetchThreads: async (projectId) => {
    set({ status: "loading", error: null });
    try {
      const threads = (await threadApi.list(projectId)) ?? [];
      const selected = get().selectedThreadId;
      set({
        threads,
        selectedThreadId: threads.some((item) => item.id === selected)
          ? selected
          : threads[0]?.id ?? null,
        status: "idle",
      });
      for (const thread of threads) {
        const config = getThreadConfig(thread.metadata);
        if (config) useThreadConfigStore.getState().setConfig(thread.id, config);
      }
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
    }
  },

  createThread: async (projectId, knowledgeBaseIds, title = "New thread") => {
    set({ status: "saving", error: null });
    const config = defaultThreadConfig;
    try {
      const thread = await threadApi.create(projectId, {
        title,
        knowledge_base_ids: knowledgeBaseIds,
        config,
      });
      useThreadConfigStore.getState().setConfig(thread.id, thread.metadata?.config ?? config);
      set((state) => ({
        threads: [thread, ...state.threads],
        selectedThreadId: thread.id,
        status: "idle",
      }));
      return thread;
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
      throw error;
    }
  },

  renameThread: async (threadId, title) => {
    try {
      const thread = await threadApi.update(threadId, { title });
      set((state) => ({
        threads: state.threads.map((item) =>
          item.id === threadId ? { ...item, ...thread, title } : item,
        ),
      }));
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
      throw error;
    }
  },

  deleteThread: async (threadId) => {
    set({ status: "deleting", error: null });
    try {
      await threadApi.remove(threadId);
      set((state) => {
        const threads = state.threads.filter((item) => item.id !== threadId);
        return {
          threads,
          selectedThreadId:
            state.selectedThreadId === threadId ? threads[0]?.id ?? null : state.selectedThreadId,
          status: "idle",
        };
      });
    } catch (error) {
      set({ status: "error", error: errorMessage(error) });
      throw error;
    }
  },

  selectThread: (selectedThreadId) => set({ selectedThreadId }),
  clearError: () => set({ error: null, messagesError: null }),
});
