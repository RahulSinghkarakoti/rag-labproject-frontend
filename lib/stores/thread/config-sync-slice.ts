import { threadApi } from "@/lib/api/threads";
import { threadConfigSchema } from "@/lib/schemas/thread-config";
import { useThreadConfigStore } from "@/lib/config-store";
import type { ConfigSyncSlice, ThreadSliceCreator } from "./types";
import { errorMessage } from "./utils";

const configTimers = new Map<string, ReturnType<typeof setTimeout>>();
const pendingSaves = new Map<string, () => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeunload", () => {
    for (const save of pendingSaves.values()) {
      save();
    }
  });
}

export const createConfigSyncSlice: ThreadSliceCreator<ConfigSyncSlice> = (set, get) => ({
  latestPipelineVersions: {},
  refreshGenerations: {},

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
          threads: state.threads.map((thread) => (thread.id === threadId ? updated : thread)),
          status: "idle",
        }));
        await get().refreshThreadConfig(threadId);
      } catch (error) {
        console.error("Failed to save thread config:", error);
        set({ status: "error", error: errorMessage(error) });
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
      const rawConfig = latest.config && typeof latest.config === "object" ? latest.config : {};
      const parsed = threadConfigSchema.safeParse(rawConfig);
      console.log("Latest thread configuration:", latest);
      console.log("Parsed thread configuration:", parsed);
      if (!parsed.success) {
        console.error("Invalid thread configuration:", parsed.error.issues);
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
      set({ error: errorMessage(error) });
      throw error;
    }
  },
});
