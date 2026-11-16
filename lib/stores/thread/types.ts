import type { StateCreator } from "zustand";
import type { Thread, ThreadMessage } from "@/lib/types/thread";
import type { RunDetails, RunStep } from "@/lib/types/run";
import type { ThreadConfig } from "@/lib/config-store";

export type ThreadSlice = {
  threads: Thread[];
  selectedThreadId: string | null;
  status: "idle" | "loading" | "saving" | "deleting" | "error";
  error: string | null;
  fetchThreads: (projectId: string) => Promise<void>;
  createThread: (projectId: string, knowledgeBaseIds: string[], title?: string) => Promise<Thread>;
  renameThread: (threadId: string, title: string) => Promise<void>;
  deleteThread: (threadId: string) => Promise<void>;
  selectThread: (threadId: string | null) => void;
  clearError: () => void;
};

export type MessageSlice = {
  messages: Record<string, ThreadMessage[]>;
  messagesStatus: "idle" | "loading" | "error";
  messagesError: string | null;
  messageIdMap: Record<string, string>;
  registerMessageIdMapping: (clientMsgId: string, backendMsgId: string) => void;
  resolveBackendMessageId: (id: string, threadId?: string) => string;
  fetchMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string, signal?: AbortSignal) => Promise<Response>;
  editMessage: (threadId: string, messageId: string, content: string, signal?: AbortSignal) => Promise<Response>;
  retryMessage: (threadId: string, messageId: string, signal?: AbortSignal) => Promise<Response>;
  pendingMessageAction: { type: "edit" | "retry"; messageId: string } | null;
  setPendingMessageAction: (action: { type: "edit" | "retry"; messageId: string }) => void;
  clearPendingMessageAction: () => void;
};

export type LiveRunSlice = {
  liveRuns: Record<string, RunDetails>;
  activeLiveRunId: string | null;
  initLiveRun: (runId: string, threadId: string, inputMessageId?: string | null, clientMsgId?: string | null) => void;
  updateLiveRunStep: (runId: string, step: RunStep) => void;
  completeLiveRun: (runId: string, outputMessageId?: string | null, response?: string | null) => void;
  cancelLiveRun: (runId: string, outputMessageId?: string | null) => void;
  failLiveRun: (runId: string, error?: any) => void;
  getLiveRun: (messageId?: string | null, runId?: string | null) => RunDetails | null;
  fetchRunSteps: (messageId: string) => Promise<RunDetails>;
  fetchRunDetails: (runId: string) => Promise<RunDetails>;
};

export type ConfigSyncSlice = {
  saveThreadConfig: (threadId: string, config: ThreadConfig) => Promise<void>;
  refreshThreadConfig: (threadId: string) => Promise<void>;
  latestPipelineVersions: Record<string, number>;
  refreshGenerations: Record<string, number>;
};

export type ThreadStore = ThreadSlice & MessageSlice & LiveRunSlice & ConfigSyncSlice;

export type ThreadSliceCreator<T> = StateCreator<ThreadStore, [], [], T>;
