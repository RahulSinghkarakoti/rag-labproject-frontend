import { api } from "@/lib/api";
import type { ThreadConfig } from "@/lib/config-store";
import type { KnowledgeBase } from "@/lib/store";
import { threadConfigSchema } from "@/lib/schemas/thread-config";
import { getSession } from "next-auth/react";

type ThreadMetadata = Partial<ThreadConfig> & {
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

async function streamThreadMessage(path: string, content?: string, signal?: AbortSignal) {
  const session = (await getSession()) as { accessToken?: string } | null;
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}${path}`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(session?.accessToken
          ? { Authorization: `Bearer ${session.accessToken}` }
          : {}),
      },
      ...(content === undefined ? {} : { body: JSON.stringify({ content }) }),
      signal,
    },
  );

  if (!response.ok || !response.body) {
    throw new Error(`Message request failed (${response.status})`);
  }

  return response;
}

export function getThreadConfig(metadata?: ThreadMetadata): ThreadConfig | undefined {
  if (metadata?.config) return metadata.config;
  const parsed = threadConfigSchema.safeParse({
    query_transformation: metadata?.query_transformation,
    retrieval: metadata?.retrieval,
    reranking: metadata?.reranking,
    generation: metadata?.generation,
  });
  return parsed.success ? parsed.data : undefined;
}

export type CreateThreadInput = {
  title: string;
  knowledge_base_ids: string[];
  config: ThreadConfig ;
};

export const threadApi = {
  list: (projectId: string) => api.get<Thread[]>(`/api/projects/${projectId}/threads`),
  messages: (threadId: string) => api.get<ThreadMessage[]>(`/api/threads/${threadId}/messages`),
  sendMessage: (threadId: string, { content, signal }: SendThreadMessageInput) =>
    streamThreadMessage(`/api/threads/${threadId}/messages`, content, signal),
  editMessage: (threadId: string, messageId: string, content: string) =>
    api.put<unknown, { content: string }>(
      `/api/threads/${threadId}/messages/${messageId}`,
      { content },
    ),
  retryMessage: (threadId: string, messageId: string, signal?: AbortSignal) =>
    streamThreadMessage(`/api/threads/${threadId}/messages/${messageId}/retry`, undefined, signal),
  latestPipeline: (threadId: string) =>
    api.get<PipelineVersion>(`/api/threads/${threadId}/pipeline/latest`),
  create: (projectId: string, input: CreateThreadInput) =>
    api.post<Thread, CreateThreadInput>(`/api/projects/${projectId}/threads`, {
      ...input,
      config: threadConfigSchema.parse(input.config),
    }),
  update: (threadId: string, input: Partial<CreateThreadInput>) =>
    api.patch<Thread, Partial<CreateThreadInput>>(`/api/threads/${threadId}`, {
      ...input,
      ...(input.config ? { config: threadConfigSchema.parse(input.config) } : {}),
    }),
  remove: (threadId: string) => api.delete(`/api/threads/${threadId}`),
};
