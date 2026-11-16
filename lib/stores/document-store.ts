import { create } from "zustand";
import { documentApi } from "@/lib/api/documents";
import type { DocumentItem } from "@/lib/types/document";

export type DocumentStore = {
  documents: DocumentItem[];
  status: "idle" | "loading" | "uploading" | "deleting" | "error";
  error: string | null;
  fetchDocuments: (projectId: string, kbId: string) => Promise<DocumentItem[]>;
  uploadDocuments: (projectId: string, kbId: string, files: File[]) => Promise<DocumentItem[]>;
  deleteDocument: (projectId: string, kbId: string, docId: string) => Promise<void>;
  applySSEStatusUpdate: (
    documentId: string,
    update: Pick<DocumentItem, "status" | "embedded_count" | "total_chunks" | "error">,
  ) => void;
  clearDocuments: () => void;
  clearError: () => void;
};

export const useDocumentStore = create<DocumentStore>((set) => ({
  documents: [],
  status: "idle",
  error: null,

  fetchDocuments: async (projectId: string, kbId: string) => {
    set({ status: "loading", error: null });
    try {
      const data = await documentApi.list(projectId, kbId);
      const docs = Array.isArray(data) ? data : [];
      set({
        documents: docs,
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
      const result = await documentApi.upload(projectId, kbId, files);
      const uploadedDocs = result?.documents ?? [];
      set((state) => {
        const existingMap = new Map(state.documents.map((d) => [d.id, d]));
        for (const doc of uploadedDocs) {
          existingMap.set(doc.id, doc);
        }
        const updatedDocs = Array.from(existingMap.values());
        return {
          documents: updatedDocs,
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
      await documentApi.delete(projectId, kbId, docId);
      set((state) => ({
        documents: state.documents.filter((d) => d.id !== docId),
        status: "idle",
      }));
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Delete failed" });
      throw error;
    }
  },

  applySSEStatusUpdate: (documentId: string, update) => {
    set((state) => {
      const order = [
        "uploaded",
        "queued",
        "processing",
        "loading",
        "loaded",
        "chunking",
        "chunked",
        "embedding",
        "embedded",
        "storing",
        "stored",
        "completed",
        "failed",
      ];
      const current = state.documents.find((doc) => doc.id === documentId);
      if (!current) return state;
      const currentRank = order.indexOf(current.status.toLowerCase());
      const nextRank = order.indexOf(update.status.toLowerCase());
      if (
        current.status.toLowerCase() === "completed" ||
        current.status.toLowerCase() === "failed" ||
        nextRank < currentRank
      )
        return state;
      const mergedUpdate = {
        ...update,
        embedded_count:
          update.embedded_count === undefined
            ? current.embedded_count
            : Math.max(current.embedded_count ?? 0, update.embedded_count),
      };
      const documents = state.documents.map((doc) =>
        doc.id === documentId ? { ...doc, ...mergedUpdate } : doc,
      );
      return {
        documents,
      };
    });
  },

  clearDocuments: () => set({ documents: [] }),
  clearError: () => set({ error: null }),
}));
