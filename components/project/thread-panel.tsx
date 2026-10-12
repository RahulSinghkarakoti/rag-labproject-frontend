"use client";

import { useState } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useThreadStore } from "@/lib/thread-store";
import { useKnowledgeBaseStore } from "@/lib/store";

export function ThreadPanel({ projectId, canCreate = true }: { projectId: string; canCreate?: boolean }) {
  const [title, setTitle] = useState("");
  const threads = useThreadStore((state) => state.threads);
  const selectedThreadId = useThreadStore((state) => state.selectedThreadId);
  const status = useThreadStore((state) => state.status);
  const error = useThreadStore((state) => state.error);
  const createThread = useThreadStore((state) => state.createThread);
  const deleteThread = useThreadStore((state) => state.deleteThread);
  const selectThread = useThreadStore((state) => state.selectThread);
  const selectKnowledgeBase = useKnowledgeBaseStore((state) => state.selectKnowledgeBase);

  const addThread = async () => {
    try {
      const kbId = useKnowledgeBaseStore.getState().selectedKnowledgeBaseId;
      if (!kbId) return;
      await createThread(projectId, [kbId], title.trim() || undefined);
      setTitle("");
    } catch {
      // The store exposes the API error in the panel.
    }
  };

  return (
    <aside className="flex min-h-0  shrink-0 flex-col border-r bg-muted/10">
      <div className="border-b p-3">
        <p className="text-sm font-semibold">Threads</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Separate conversations and RAG settings</p>
        <div className="mt-3 flex gap-2">
          <Input value={title} onChange={(event) => setTitle(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") void addThread(); }} placeholder="Thread name" className="h-8 text-xs" />
          <Button size="icon" className="size-8 shrink-0" onClick={() => void addThread()} disabled={!canCreate || status === "saving"} aria-label="Create thread">
            <Plus className="size-4" />
          </Button>
        </div>
      </div>
      {!canCreate ? <p className="border-b px-3 py-2 text-[11px] text-muted-foreground">Select a KB with an ingested document to create a thread.</p> : null}
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
        {threads.map((thread) => (
          <div key={thread.id} className={`group flex items-center gap-1 rounded-md ${selectedThreadId === thread.id ? "bg-accent" : "hover:bg-muted"}`}>
              <button type="button" onClick={() => { selectThread(thread.id); const kbId = thread.metadata?.knowledge_base_ids?.[0]; if (kbId) selectKnowledgeBase(kbId); }} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-sm">
              <MessageSquare className="size-3.5 shrink-0 text-muted-foreground" />
              <span className="truncate">{thread.title || "New thread"}</span>
            </button>
            <Button variant="ghost" size="icon-xs" className="mr-1 opacity-0 group-hover:opacity-100" onClick={() => void deleteThread(thread.id)} aria-label={`Delete ${thread.title || "thread"}`}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        {!threads.length && status !== "loading" ? <p className="px-2 py-4 text-xs text-muted-foreground">Create a thread to start chatting.</p> : null}
        {error ? <p className="px-2 py-2 text-xs text-destructive">{error}</p> : null}
      </div>
    </aside>
  );
}
