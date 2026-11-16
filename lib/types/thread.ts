import type { ThreadConfig } from "@/lib/config-store";
import type { KnowledgeBase } from "@/lib/types/knowledge-base";

export type ThreadMetadata = Partial<ThreadConfig> & {
  config?: ThreadConfig;
  knowledge_base_ids?: string[];
  pipeline_id?: string;
  pipeline_version_id?: string;
};

export type Thread = {
  id: string;
  project_id: string;
  title: string | null;
  status: string;
  metadata?: ThreadMetadata;
  knowledge_bases?: KnowledgeBase[];
  created_at?: string;
  updated_at?: string;
};

export type PipelineVersion = {
  id: string;
  pipeline_id: string;
  version: number;
  config: unknown;
};

export type ThreadMessage = {
  id: string;
  thread_id: string;
  parent_message_id: string | null;
  role: "human" | "assistant" | "system" | "developer" | "tool";
  content: string | null;
  content_json: unknown | null;
  sequence: number;
  status: string;
  metadata: Record<string, unknown>;
};

export type SendThreadMessageInput = {
  content: string;
  signal?: AbortSignal;
};

export type CreateThreadInput = {
  title: string;
  knowledge_base_ids: string[];
  config: ThreadConfig;
};
