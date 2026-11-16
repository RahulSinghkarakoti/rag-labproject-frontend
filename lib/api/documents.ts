import { api } from "./client";
import type { DocumentItem } from "@/lib/types/document";

export type UploadDocumentsResponse = {
  project_id: string;
  knowledge_base_id: string;
  documents: DocumentItem[];
  total: number;
};

export const documentApi = {
  list: (projectId: string, kbId: string) =>
    api.get<DocumentItem[]>(
      `/projects/${projectId}/knowledge-bases/${kbId}/documents`,
    ),
  upload: (projectId: string, kbId: string, files: File[]) => {
    const formData = new FormData();
    for (const file of files) {
      formData.append("files", file);
    }
    return api.upload<UploadDocumentsResponse>(
      `/projects/${projectId}/knowledge-bases/${kbId}/upload-files`,
      formData,
    );
  },
  delete: (projectId: string, kbId: string, docId: string) =>
    api.delete<void>(
      `/projects/${projectId}/knowledge-bases/${kbId}/documents/${docId}`,
    ),
};
