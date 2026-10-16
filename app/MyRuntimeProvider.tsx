"use client";

import {
  AssistantRuntimeProvider,
  AuiConfig,
  ExportedMessageRepository,
  Tools,
  type ChatModelAdapter,
  type ThreadMessageLike,
  useLocalRuntime,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";
import type { ThreadMessage } from "@/lib/thread-api";
import { useThreadStore } from "@/lib/thread-store";
import toolkit from "./toolkit";

type MyRuntimeProviderProps = {
  children: ReactNode;
  threadId: string | null;
};

function toThreadMessage(message: ThreadMessage): ThreadMessageLike {
  const content = message.content ?? "";

  if (message.role === "assistant") {
    return { id: message.id, role: "assistant", content };
  }

  if (message.role === "human") {
    return { id: message.id, role: "user", content };
  }

  return {
    id: message.id,
    role: message.role === "tool" ? "assistant" : "system",
    content,
  };
}

function toBranchableHistory(messages: ThreadMessage[]) {
  let previousAssistantId: string | null = null;
  const items = messages.map((message) => {
    const parentId = message.parent_message_id ?? previousAssistantId;
    if (message.role === "assistant" || message.role === "tool") {
      previousAssistantId = message.id;
    }
    return { message: toThreadMessage(message), parentId };
  });

  return ExportedMessageRepository.fromBranchableArray(items, {
    headId: messages.at(-1)?.id ?? null,
  });
}

function RuntimeLoading({ error, onRetry }: { error: string | null; onRetry: () => void }) {
  return (
    <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
      {error ? (
        <div className="space-y-2 text-center">
          <p>Unable to load conversation history.</p>
          <button type="button" className="text-primary underline" onClick={onRetry}>
            Retry
          </button>
        </div>
      ) : (
        "Loading conversation history…"
      )}
    </div>
  );
}

export function MyRuntimeProvider({
  children,
  threadId,
}: MyRuntimeProviderProps) {
  const threadMessages = useThreadStore((state) => (threadId ? state.messages[threadId] : undefined));
  const messagesStatus = useThreadStore((state) => state.messagesStatus);
  const error = useThreadStore((state) => state.messagesError);
  const fetchMessages = useThreadStore((state) => state.fetchMessages);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!threadId) {
      return;
    }

    void fetchMessages(threadId).catch(() => undefined);
  }, [retry, threadId]);

  if (threadId && (messagesStatus === "loading" || !threadMessages)) {
    return <RuntimeLoading error={error} onRetry={() => setRetry((value) => value + 1)} />;
  }

  const messages = (threadMessages ?? [])
    .slice()
    .sort((a, b) => a.sequence - b.sequence)
  return <RuntimeInner threadId={threadId} messages={messages}>{children}</RuntimeInner>;
}

function RuntimeInner({
  children,
  threadId,
  messages,
}: MyRuntimeProviderProps & { messages: ThreadMessage[] }) {
  const sendMessage = useThreadStore((state) => state.sendMessage);
  const editMessage = useThreadStore((state) => state.editMessage);
  const retryMessage = useThreadStore((state) => state.retryMessage);
  const clearPendingMessageAction = useThreadStore((state) => state.clearPendingMessageAction);

  const chatModel = useMemo<ChatModelAdapter>(() => ({
    async *run({ messages: threadMessages, abortSignal }) {
      const lastUserMessage = [...threadMessages].reverse().find((message) => message.role === "user");
      const content = typeof lastUserMessage?.content === "string"
        ? lastUserMessage.content
        : lastUserMessage?.content
          ?.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n") ?? "";
      if (!threadId) throw new Error("No thread selected");
      const pendingAction = useThreadStore.getState().pendingMessageAction;
      clearPendingMessageAction();
      let response: Response;
      if (pendingAction?.type === "edit") {
        await editMessage(threadId, pendingAction.messageId, content);
        response = await retryMessage(threadId, pendingAction.messageId, abortSignal);
      } else if (pendingAction?.type === "retry") {
        response = await retryMessage(threadId, pendingAction.messageId, abortSignal);
      } else {
        response = await sendMessage(threadId, content, abortSignal);
      }
      if (!response.body) throw new Error("Message response has no body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamedContent = "";
      let completed = false;
      let runId: unknown;
      let userMessageId: unknown;

      const consumeFrame = (frame: string) => {
        const lines = frame.split(/\r?\n/).filter((line) => !line.startsWith(":"));
        const event = lines.find((line) => line.startsWith("event:"))?.slice(6).trim();
        const data = lines
          .filter((line) => line.startsWith("data:"))
          .map((line) => line.slice(5).trimStart())
          .join("\n");
        if (!data || data === "[DONE]") return { event, payload: null };
        return { event, payload: JSON.parse(data) as Record<string, unknown> };
      };

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() ?? "";
        if (done && buffer.trim()) {
          frames.push(buffer);
          buffer = "";
        }

        for (const frame of frames) {
          const { event, payload } = consumeFrame(frame);
          if (!payload) continue;
          if (completed) continue;
          if (event === "started") {
            runId = payload.run_id;
            userMessageId = payload.message_id;
            continue;
          }
          if (event === "error" || payload.type === "error") {
            const error = payload.error;
            throw new Error(
              typeof error === "object" && error !== null && "message" in error
                ? String(error.message)
                : String(error ?? "Message request failed"),
            );
          }
          if (event === "token" || payload.type === "token") {
            streamedContent += String(payload.content ?? "");
            yield {
              content: [{ type: "text", text: streamedContent }],
              metadata: {
                custom: { run_id: runId, user_message_id: userMessageId },
              },
            };
          }
          if (event === "complete" || payload.type === "complete") {
            completed = true;
            const finalContent = String(payload.response ?? streamedContent);
            streamedContent = finalContent;
            yield {
              content: [{ type: "text", text: finalContent }],
              metadata: {
                custom: {
                  output_message_id: payload.output_message_id,
                  run_id: payload.run_id ?? runId,
                  user_message_id: userMessageId,
                },
              },
            };
          }
        }
        if (done) break;
      }

      if (!completed) throw new Error("Message stream ended before completion");
    },
  }), [clearPendingMessageAction, editMessage, retryMessage, sendMessage, threadId]);

  const history = useMemo(() => toBranchableHistory(messages), [messages]);
  const runtime = useLocalRuntime(chatModel, {
    adapters: {
      history: {
        load: async () => history,
        append: async () => {},
      },
    },
  });
  const config = AuiConfig({
    tools: Tools({ toolkit }),
  });

  return (
    <AssistantRuntimeProvider config={config} runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
