import { create } from "zustand";
import { knowledgeBaseApi } from "@/lib/api/knowledge-bases";
import type { KnowledgeBase, CreateKnowledgeBaseInput } from "@/lib/types/knowledge-base";

export type KnowledgeBaseStore = {
  knowledgeBases: KnowledgeBase[];
  selectedKnowledgeBaseId: string | null;
  status: "idle" | "loading" | "saving" | "deleting" | "error";
  error: string | null;
  fetchKnowledgeBases: (projectId: string) => Promise<KnowledgeBase[]>;
  createKnowledgeBase: (projectId: string, input: CreateKnowledgeBaseInput) => Promise<KnowledgeBase>;
  deleteKnowledgeBase: (projectId: string, kbId: string) => Promise<void>;
  selectKnowledgeBase: (id: string | null) => void;
  clearError: () => void;
};

export const useKnowledgeBaseStore = create<KnowledgeBaseStore>((set, get) => ({
  knowledgeBases: [],
  selectedKnowledgeBaseId: null,
  status: "idle",
  error: null,

  fetchKnowledgeBases: async (projectId: string) => {
    set({ status: "loading", error: null });
    try {
      const data = await knowledgeBaseApi.list(projectId);
      const kbs = data ?? [];
      const currentSelected = get().selectedKnowledgeBaseId;
      const validSelected = kbs.some((k) => k.id === currentSelected)
        ? currentSelected
        : kbs[0]?.id ?? null;
      set({ knowledgeBases: kbs, selectedKnowledgeBaseId: validSelected, status: "idle" });
      return kbs;
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  createKnowledgeBase: async (projectId: string, input: CreateKnowledgeBaseInput) => {
    set({ status: "saving", error: null });
    try {
      const newKb = await knowledgeBaseApi.create(projectId, input);
      set((state) => ({
        knowledgeBases: [newKb, ...state.knowledgeBases],
        selectedKnowledgeBaseId: newKb.id,
        status: "idle",
      }));
      return newKb;
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  deleteKnowledgeBase: async (projectId: string, kbId: string) => {
    set({ status: "deleting", error: null });
    try {
      await knowledgeBaseApi.delete(projectId, kbId);
      set((state) => {
        const remaining = state.knowledgeBases.filter((k) => k.id !== kbId);
        const nextSelected =
          state.selectedKnowledgeBaseId === kbId ? remaining[0]?.id ?? null : state.selectedKnowledgeBaseId;
        return {
          knowledgeBases: remaining,
          selectedKnowledgeBaseId: nextSelected,
          status: "idle",
        };
      });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  selectKnowledgeBase: (id) => set({ selectedKnowledgeBaseId: id }),
  clearError: () => set({ error: null }),
}));
