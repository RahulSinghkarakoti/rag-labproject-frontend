import { create } from "zustand";
import { api } from "@/lib/api";
import {
  defaultThreadConfig,
  useThreadConfigStore,
  type ThreadConfig,
} from "@/lib/config-store";

export { defaultThreadConfig, useThreadConfigStore } from "@/lib/config-store";
export type { ThreadConfig } from "@/lib/config-store";

export type Project = {
  id: string;
  name: string;
  description: string;
};

export type ProjectConfig = ThreadConfig;
export const defaultProjectConfig = defaultThreadConfig;

export type ChunkingConfig = {
  strategy: "recursive" | "markdown" | "semantic" | "character";
  chunk_size: number;
  chunk_overlap: number;
};

export type EmbeddingConfig = {
  model: string;
  dimension?: number;
};

export type IndexingConfig = {
  retriever: "similarity" | "mmr" | "similarity-score-threshold";
  top_k: number;
  similarity_threshold: number;
  reranking: boolean;
  citations: boolean;
};

export type KnowledgeBase = {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  chunking_config: ChunkingConfig;
  embedding_config: EmbeddingConfig;
  indexing_config: IndexingConfig;
  document_count: number;
  created_at?: string;
  updated_at?: string;
};

export type CreateKnowledgeBaseInput = {
  name: string;
  description?: string;
  chunking_config: ChunkingConfig;
  embedding_config: EmbeddingConfig;
  indexing_config: IndexingConfig;
};

export type DocumentItem = {
  id: string;
  knowledge_base_id: string;
  name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  status: string;
  checksum?: string | null;
  chunk_count?: number;
  created_at?: string;
  updated_at?: string;
};

export function isDocumentReady(status?: string | null): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return normalized === "completed" || normalized === "ready";
}

type ProjectInput = Omit<Project, "id">;

type ProjectStore = {
  projects: Project[];
  selectedProjectId: string | null;
  status: "idle" | "loading" | "saving" | "updating" | "deleting" | "error";
  error: string | null;
  fetchProjects: () => Promise<void>;
  createProject: (input: ProjectInput) => Promise<Project>;
  updateProject: (input: ProjectInput, project_id: string) => Promise<Project>;
  deleteProject: (project_id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
  clearError: () => void;
};

type KnowledgeBaseStore = {
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

type DocumentStore = {
  documents: DocumentItem[];
  selectedDocumentIds: string[];
  status: "idle" | "loading" | "uploading" | "deleting" | "error";
  error: string | null;
  fetchDocuments: (projectId: string, kbId: string) => Promise<DocumentItem[]>;
  uploadDocuments: (projectId: string, kbId: string, files: File[]) => Promise<DocumentItem[]>;
  deleteDocument: (projectId: string, kbId: string, docId: string) => Promise<void>;
  applySSEStatusUpdate: (documentId: string, status: string) => void;
  toggleSelectDocument: (docId: string) => void;
  selectAllDocuments: (selectAll: boolean) => void;
  clearDocuments: () => void;
  clearError: () => void;
};

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  selectedProjectId: null,
  status: "idle",
  error: null,

  fetchProjects: async () => {
    set({ status: "loading", error: null });
    try {
      const projects = await api.get<Project[]>("/api/projects");
      set({ projects: projects ?? [], status: "idle" });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  createProject: async (input) => {
    set({ status: "saving", error: null });
    try {
      const project = await api.post<Project, ProjectInput>("/api/projects", input);
      set((state) => ({ projects: [...state.projects, project], status: "idle" }));
      return project;
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  updateProject: async (input, project_id) => {
    set({ status: "updating", error: null });
    try {
      const project = await api.patch<Project, ProjectInput>(`/api/projects/${project_id}`, input);
      set((state) => {
        const projects = state.projects.map((p) => (p.id === project_id ? project : p));
        return { projects, status: "idle" };
      });
      return project;
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  deleteProject: async (project_id) => {
    set({ status: "deleting", error: null });
    try {
      await api.delete(`/api/projects/${project_id}`);
      set((state) => ({
        projects: state.projects.filter((p) => p.id !== project_id),
        status: "idle",
      }));
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  selectProject: (selectedProjectId) => set({ selectedProjectId }),
  clearError: () => set({ error: null }),
}));

export const useProjectConfigStore = useThreadConfigStore;

export const useKnowledgeBaseStore = create<KnowledgeBaseStore>((set, get) => ({
  knowledgeBases: [],
  selectedKnowledgeBaseId: null,
  status: "idle",
  error: null,

  fetchKnowledgeBases: async (projectId: string) => {
    set({ status: "loading", error: null });
    try {
      const data = await api.get<KnowledgeBase[]>(`/api/projects/${projectId}/knowledge-bases`);
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
      const newKb = await api.post<KnowledgeBase, CreateKnowledgeBaseInput>(
        `/api/projects/${projectId}/knowledge-bases`,
        input,
      );
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
      await api.delete(`/api/projects/${projectId}/knowledge-bases/${kbId}`);
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

export const useDocumentStore = create<DocumentStore>((set, get) => ({
  documents: [],
  selectedDocumentIds: [],
  status: "idle",
  error: null,

  fetchDocuments: async (projectId: string, kbId: string) => {
    set({ status: "loading", error: null });
    try {
      const data = await api.get<DocumentItem[]>(
        `/api/projects/${projectId}/knowledge-bases/${kbId}/documents`,
      );
      const docs = Array.isArray(data) ? data : [];
      const readyIds = docs.filter((d) => isDocumentReady(d.status)).map((d) => d.id);
      set({
        documents: docs,
        selectedDocumentIds: readyIds,
        status: "idle",
      });
      return docs;
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  uploadDocuments: async (projectId: string, kbId: string, files: File[]) => {
    set({ status: "uploading", error: null });
    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }
      const result = await api.upload<{
        project_id: string;
        knowledge_base_id: string;
        documents: DocumentItem[];
        total: number;
      }>(`/api/projects/${projectId}/knowledge-bases/${kbId}/upload-files`, formData);

      const uploadedDocs = result?.documents ?? [];
      set((state) => {
        const existingMap = new Map(state.documents.map((d) => [d.id, d]));
        for (const doc of uploadedDocs) {
          existingMap.set(doc.id, doc);
        }
        const updatedDocs = Array.from(existingMap.values());
        const readyIds = updatedDocs.filter((d) => isDocumentReady(d.status)).map((d) => d.id);
        return {
          documents: updatedDocs,
          selectedDocumentIds: readyIds,
          status: "idle",
        };
      });
      return uploadedDocs;
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Upload failed" });
      throw error;
    }
  },

  deleteDocument: async (projectId: string, kbId: string, docId: string) => {
    set({ status: "deleting", error: null });
    try {
      await api.delete(`/api/projects/${projectId}/knowledge-bases/${kbId}/documents/${docId}`);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== docId),
        selectedDocumentIds: state.selectedDocumentIds.filter((id) => id !== docId),
        status: "idle",
      }));
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Delete failed" });
      throw error;
    }
  },

  applySSEStatusUpdate: (documentId: string, status: string) => {
    set((state) => {
      console.log(`SSE update for document ${documentId}: ${status}`);
      const documents = state.documents.map((doc) =>
        doc.id === documentId ? { ...doc, status } : doc,
      );
      const readyIds = documents.filter((doc) => isDocumentReady(doc.status)).map((doc) => doc.id);
      return {
        documents,
        selectedDocumentIds: state.selectedDocumentIds.filter((id) => readyIds.includes(id)),
      };
    });
  },

  toggleSelectDocument: (docId: string) => {
    const doc = get().documents.find((item) => item.id === docId);
    if (!doc || !isDocumentReady(doc.status)) return;

    const { selectedDocumentIds } = get();
    if (selectedDocumentIds.includes(docId)) {
      set({ selectedDocumentIds: selectedDocumentIds.filter((id) => id !== docId) });
    } else {
      set({ selectedDocumentIds: [...selectedDocumentIds, docId] });
    }
  },

  selectAllDocuments: (selectAll: boolean) => {
    if (selectAll) {
      set((state) => ({
        selectedDocumentIds: state.documents
          .filter((doc) => isDocumentReady(doc.status))
          .map((doc) => doc.id),
      }));
    } else {
      set({ selectedDocumentIds: [] });
    }
  },

  clearDocuments: () => set({ documents: [], selectedDocumentIds: [] }),
  clearError: () => set({ error: null }),
}));
