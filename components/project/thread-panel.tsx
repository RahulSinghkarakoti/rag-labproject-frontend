"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useThreadStore } from "@/lib/thread-store";
import { useKnowledgeBaseStore } from "@/lib/store";

export function ThreadPanel({ projectId, canCreate = true }: { projectId: string; canCreate?: boolean }) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [selectedKbIds, setSelectedKbIds] = useState<string[]>([]);
  const threads = useThreadStore((state) => state.threads);
  const selectedThreadId = useThreadStore((state) => state.selectedThreadId);
  const status = useThreadStore((state) => state.status);
  const error = useThreadStore((state) => state.error);
  const createThread = useThreadStore((state) => state.createThread);
  const deleteThread = useThreadStore((state) => state.deleteThread);
  const selectThread = useThreadStore((state) => state.selectThread);
  const selectKnowledgeBase = useKnowledgeBaseStore((state) => state.selectKnowledgeBase);
  const knowledgeBases = useKnowledgeBaseStore((state) => state.knowledgeBases);
  const selectedKbId = useKnowledgeBaseStore((state) => state.selectedKnowledgeBaseId);

  const availableKnowledgeBases = knowledgeBases.filter((kb) => kb.document_count > 0);

  useEffect(() => {
    if (isCreateOpen) {
      setSelectedKbIds(selectedKbId && availableKnowledgeBases.some((kb) => kb.id === selectedKbId) ? [selectedKbId] : []);
    }
  }, [isCreateOpen, selectedKbId, knowledgeBases]);

  const addThread = async () => {
    try {
      if (!title.trim() || selectedKbIds.length === 0) return;
      await createThread(projectId, selectedKbIds, title.trim());
      setTitle("");
      setSelectedKbIds([]);
      setIsCreateOpen(false);
    } catch {
      // The store exposes the API error in the panel.
    }
  };

  return (
    <aside className="flex min-h-0  shrink-0 flex-col border-r bg-muted/10">
      <div className="border-b p-3">
        <p className="text-sm font-semibold">Threads</p>
        <p className="mt-0.5 text-xs text-muted-foreground">Separate conversations and RAG settings</p>
        <Button className="mt-3 h-8 w-full text-xs" onClick={() => setIsCreateOpen(true)} disabled={!canCreate || status === "saving"}>
          <Plus className="size-4" /> New thread
        </Button>
      </div>
      {!canCreate ? <p className="border-b px-3 py-2 text-[11px] text-muted-foreground">Add an ingested document to at least one KB to create a thread.</p> : null}
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
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create thread</DialogTitle>
            <DialogDescription>Give this conversation a name and choose one or more knowledge bases.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="thread-name" className="text-sm font-medium">Name</label>
              <Input id="thread-name" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Thread name" autoFocus />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Knowledge bases</p>
              <div className="max-h-52 space-y-2 overflow-y-auto rounded-md border p-3">
                {availableKnowledgeBases.map((kb) => (
                  <label key={kb.id} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={selectedKbIds.includes(kb.id)}
                      onChange={() => setSelectedKbIds((ids) => ids.includes(kb.id) ? ids.filter((id) => id !== kb.id) : [...ids, kb.id])}
                    />
                    <span className="truncate">{kb.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground">{kb.document_count} docs</span>
                  </label>
                ))}
                {!availableKnowledgeBases.length ? <p className="text-xs text-muted-foreground">No knowledge bases with documents are available.</p> : null}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={() => void addThread()} disabled={!title.trim() || selectedKbIds.length === 0 || status === "saving"}>Create thread</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
