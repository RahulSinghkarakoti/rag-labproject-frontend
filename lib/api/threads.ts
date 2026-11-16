import { api, ensureValidAccessToken, refreshSession } from "./client";
import type { ThreadConfig } from "@/lib/config-store";
import { threadConfigSchema } from "@/lib/schemas/thread-config";
import type {
  Thread,
  ThreadMetadata,
  PipelineVersion,
  ThreadMessage,
  SendThreadMessageInput,
  CreateThreadInput,
} from "@/lib/types/thread";
import type { RunStep, RunDetails } from "@/lib/types/run";

export async function streamThreadMessage(path: string, content?: string, signal?: AbortSignal) {
  let token = await ensureValidAccessToken();
  const baseUrl = (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, "");
  const cleanPath = path.replace(/^\/api(?:\/v1)?(?=\/|$)/, "") || "/";
  const url = `${baseUrl}${cleanPath.startsWith("/") ? "" : "/"}${cleanPath}`;

  const sendRequest = (authToken?: string) =>
    fetch(url, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      },
      ...(content === undefined ? {} : { body: JSON.stringify({ content }) }),
      signal,
    });

  let response = await sendRequest(token);

  // If 401 Unauthorized, refresh the session and retry once
  if (response.status === 401) {
    try {
      await refreshSession();
      token = await ensureValidAccessToken();
    } catch {
      // Proceed with retry attempt
    }
    response = await sendRequest(token);
  }

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

export const threadApi = {
  list: (projectId: string) => api.get<Thread[]>(`/projects/${projectId}/threads`),
  messages: (threadId: string) => api.get<ThreadMessage[]>(`/threads/${threadId}/messages`),
  sendMessage: (threadId: string, { content, signal }: SendThreadMessageInput) =>
    streamThreadMessage(`/threads/${threadId}/messages`, content, signal),
  editMessage: (threadId: string, messageId: string, content: string, signal?: AbortSignal) =>
    streamThreadMessage(`/threads/${threadId}/messages/${messageId}/edit`, content, signal),
  retryMessage: (threadId: string, messageId: string, signal?: AbortSignal) =>
    streamThreadMessage(`/threads/${threadId}/messages/${messageId}/retry`, undefined, signal),
  latestPipeline: (threadId: string) =>
    api.get<PipelineVersion>(`/threads/${threadId}/pipeline/latest`),
  create: (projectId: string, input: CreateThreadInput) =>
    api.post<Thread, CreateThreadInput>(`/projects/${projectId}/threads`, {
      ...input,
      config: threadConfigSchema.parse(input.config),
    }),
  update: (threadId: string, input: Partial<CreateThreadInput>) =>
    api.patch<Thread, Partial<CreateThreadInput>>(`/threads/${threadId}`, {
      ...input,
      ...(input.config ? { config: threadConfigSchema.parse(input.config) } : {}),
    }),
  remove: (threadId: string) => api.delete(`/threads/${threadId}`),
  runSteps: (messageId: string) =>
    api.get<RunDetails>(`/messages/${messageId}/run-steps`),
  runDetails: (runId: string) =>
    api.get<RunDetails>(`/runs/${runId}`),
  cancelRun: (runId: string) =>
    api.post(`/runs/${runId}/cancel`),
};
