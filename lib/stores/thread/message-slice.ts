import { threadApi } from "@/lib/api/threads";
import type { MessageSlice, ThreadSliceCreator } from "./types";
import { isUuid, errorMessage } from "./utils";

export const createMessageSlice: ThreadSliceCreator<MessageSlice> = (set, get) => ({
  messages: {},
  messagesStatus: "idle",
  messagesError: null,
  messageIdMap: {},
  pendingMessageAction: null,

  registerMessageIdMapping: (clientMsgId, backendMsgId) =>
    set((state) => ({
      messageIdMap: { ...state.messageIdMap, [clientMsgId]: backendMsgId },
    })),

  resolveBackendMessageId: (id, threadId) => {
    if (isUuid(id)) return id;
    const mapped = get().messageIdMap[id];
    if (isUuid(mapped)) return mapped;
    if (threadId) {
      const threadMsgs = get().messages[threadId] ?? [];
      const humanMsgs = threadMsgs.filter((m) => m.role === "human");
      if (humanMsgs.length > 0) {
        const last = humanMsgs[humanMsgs.length - 1];
        if (isUuid(last.id)) return last.id;
      }
    }
    return id;
  },

  fetchMessages: async (threadId) => {
    const hasCachedMessages = Boolean(get().messages[threadId]);
    if (!hasCachedMessages) {
      set({ messagesStatus: "loading", messagesError: null });
    }
    try {
      const messages = (await threadApi.messages(threadId)) ?? [];
      set((state) => ({
        messages: { ...state.messages, [threadId]: messages },
        messagesStatus: "idle",
        messagesError: null,
      }));
    } catch (error) {
      set({ messagesStatus: "error", messagesError: errorMessage(error) });
      throw error;
    }
  },

  sendMessage: (threadId, content, signal) =>
    threadApi.sendMessage(threadId, { content, signal }),

  editMessage: (threadId, messageId, content, signal) => {
    const resolvedId = get().resolveBackendMessageId(messageId, threadId);
    return threadApi.editMessage(threadId, resolvedId, content, signal);
  },

  retryMessage: (threadId, messageId, signal) => {
    const resolvedId = get().resolveBackendMessageId(messageId, threadId);
    return threadApi.retryMessage(threadId, resolvedId, signal);
  },

  setPendingMessageAction: (pendingMessageAction) => set({ pendingMessageAction }),
  clearPendingMessageAction: () => set({ pendingMessageAction: null }),
});
