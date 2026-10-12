"use client";

import {
  AssistantRuntimeProvider,
  AuiConfig,
  Tools,
  type ChatModelAdapter,
  type ThreadMessageLike,
  useLocalRuntime,
} from "@assistant-ui/react";
import type { ReactNode } from "react";
import { getSession } from "next-auth/react";
import { useEffect, useMemo, useState } from "react";
import { threadApi, type ThreadMessage } from "@/lib/thread-api";
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
  const [messages, setMessages] = useState<ThreadMessageLike[] | null>(threadId ? null : []);
  const [error, setError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    let active = true;

    if (!threadId) {
      setMessages([]);
      setError(null);
      return () => {
        active = false;
      };
    }

    setMessages(null);
    setError(null);
    void threadApi.messages(threadId)
      .then((history) => {
        if (!active) return;
        setMessages(
          [...history]
            .sort((a, b) => a.sequence - b.sequence)
            .map(toThreadMessage),
        );
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "Request failed");
      });

    return () => {
      active = false;
    };
  }, [retry, threadId]);

  if (messages === null) {
    return <RuntimeLoading error={error} onRetry={() => setRetry((value) => value + 1)} />;
  }

  return <RuntimeInner threadId={threadId} messages={messages}>{children}</RuntimeInner>;
}

function RuntimeInner({
  children,
  threadId,
  messages,
}: MyRuntimeProviderProps & { messages: ThreadMessageLike[] }) {
  const chatModel = useMemo<ChatModelAdapter>(() => ({
    async *run({ messages: threadMessages, abortSignal }) {
      const lastUserMessage = [...threadMessages].reverse().find((message) => message.role === "user");
      const content = typeof lastUserMessage?.content === "string"
        ? lastUserMessage.content
        : lastUserMessage?.content
          ?.filter((part) => part.type === "text")
          .map((part) => part.text)
          .join("\n") ?? "";
      const session = (await getSession()) as { accessToken?: string } | null;
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/threads/${threadId ?? ""}/messages`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(session?.accessToken
              ? { Authorization: `Bearer ${session.accessToken}` }
              : {}),
          },
          body: JSON.stringify({ content }),
          signal: abortSignal,
        },
      );

      if (!response.ok || !response.body) {
        throw new Error(`Message request failed (${response.status})`);
      }

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
  }), [threadId]);

  const runtime = useLocalRuntime(chatModel, { initialMessages: messages });
  const config = AuiConfig({
    tools: Tools({ toolkit }),
  });

  return (
    <AssistantRuntimeProvider config={config} runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}
