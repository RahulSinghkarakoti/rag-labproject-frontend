import { create } from "zustand";
import { projectApi } from "@/lib/api/projects";
import type { Project, ProjectInput } from "@/lib/types/project";

export type ProjectStore = {
  projects: Project[];
  currentProject: Project | null;
  selectedProjectId: string | null;
  status: "idle" | "loading" | "saving" | "updating" | "deleting" | "error";
  error: string | null;
  fetchProjects: () => Promise<void>;
  fetchProject: (id: string) => Promise<Project>;
  setCurrentProject: (project: Project | null) => void;
  createProject: (input: ProjectInput) => Promise<Project>;
  updateProject: (input: ProjectInput, project_id: string) => Promise<Project>;
  deleteProject: (project_id: string) => Promise<void>;
  selectProject: (id: string | null) => void;
  clearError: () => void;
};

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  currentProject: null,
  selectedProjectId: null,
  status: "idle",
  error: null,

  fetchProjects: async () => {
    set({ status: "loading", error: null });
    try {
      const projects = await projectApi.list();
      set({ projects: projects ?? [], status: "idle" });
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  fetchProject: async (id: string) => {
    set({ status: "loading", error: null });
    try {
      const project = await projectApi.get(id);
      set({ currentProject: project, status: "idle" });
      return project;
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Request failed" });
      throw error;
    }
  },

  setCurrentProject: (currentProject) => set({ currentProject }),

  createProject: async (input) => {
    set({ status: "saving", error: null });
    try {
      const project = await projectApi.create(input);
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
      const project = await projectApi.update(project_id, input);
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
      await projectApi.delete(project_id);
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
