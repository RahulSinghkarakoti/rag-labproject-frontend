import { api } from "./client";
import type { Project, ProjectInput } from "@/lib/types/project";

export const projectApi = {
  list: () => api.get<Project[]>("/projects"),
  get: (id: string) => api.get<Project>(`/projects/${id}`),
  create: (input: ProjectInput) => api.post<Project, ProjectInput>("/projects", input),
  update: (id: string, input: ProjectInput) => api.patch<Project, ProjectInput>(`/projects/${id}`, input),
  delete: (id: string) => api.delete<void>(`/projects/${id}`),
};
