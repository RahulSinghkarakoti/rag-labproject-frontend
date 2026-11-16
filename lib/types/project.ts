import { defaultThreadConfig, type ThreadConfig } from "@/lib/config-store";

export type Project = {
  id: string;
  name: string;
  description: string;
};

export type ProjectConfig = ThreadConfig;
export const defaultProjectConfig = defaultThreadConfig;

export type ProjectInput = Omit<Project, "id">;
