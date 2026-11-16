import { api } from "./client";
import type { KnowledgeBase, CreateKnowledgeBaseInput } from "@/lib/types/knowledge-base";

export const knowledgeBaseApi = {
  list: (projectId: string) =>
    api.get<KnowledgeBase[]>(`/projects/${projectId}/knowledge-bases`),
  create: (projectId: string, input: CreateKnowledgeBaseInput) =>
    api.post<KnowledgeBase, CreateKnowledgeBaseInput>(
      `/projects/${projectId}/knowledge-bases`,
      input,
    ),
  delete: (projectId: string, kbId: string) =>
    api.delete<void>(`/projects/${projectId}/knowledge-bases/${kbId}`),
};
