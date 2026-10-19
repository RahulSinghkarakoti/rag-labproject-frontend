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
      // API error reflected in store
    }
  };

  return (
    <aside className="flex min-h-0 shrink-0 flex-col border-r border-[#2a2a3a] bg-[#0a0a0f] font-mono">
      <div className="border-b border-[#2a2a3a] p-3 bg-[#12121a]">
        <p className="text-xs font-bold uppercase tracking-wider text-accent">&gt; THREAD_CHANNELS</p>
        <p className="mt-0.5 text-[10px] text-muted-foreground uppercase">Isolated context sessions</p>
        <Button className="mt-3 h-8 w-full text-xs font-bold uppercase tracking-wider" onClick={() => setIsCreateOpen(true)} disabled={!canCreate || status === "saving"}>
          <Plus className="size-3.5" /> NEW_THREAD
        </Button>
      </div>
      {!canCreate ? <p className="border-b border-[#2a2a3a] px-3 py-2 text-[10px] text-amber-400 uppercase">Ingest docs to at least 1 KB to initialize threads.</p> : null}
      <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto p-2">
        {threads.map((thread) => (
          <div key={thread.id} className={`group flex items-center gap-1 cyber-chamfer-sm border transition-none ${selectedThreadId === thread.id ? "border-accent bg-[#12121a] text-accent" : "border-[#2a2a3a] bg-[#0a0a0f] text-foreground hover:border-accent/50"}`}>
            <button type="button" onClick={() => { selectThread(thread.id); const kbId = thread.metadata?.knowledge_base_ids?.[0]; if (kbId) selectKnowledgeBase(kbId); }} className="flex min-w-0 flex-1 items-center gap-2 px-2.5 py-2 text-left text-xs font-bold uppercase">
              <MessageSquare className="size-3.5 shrink-0 text-accent" />
              <span className="truncate">{thread.title || "NEW_THREAD"}</span>
            </button>
            <Button variant="ghost" size="icon-xs" className="mr-1 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" onClick={() => void deleteThread(thread.id)} aria-label={`Delete ${thread.title || "thread"}`}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        {!threads.length && status !== "loading" ? <p className="px-2 py-4 text-[10px] uppercase text-muted-foreground">&gt; NO_ACTIVE_THREADS</p> : null}
        {error ? <p className="px-2 py-2 text-[10px] text-destructive uppercase">{error}</p> : null}
      </div>
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="uppercase tracking-wider text-accent text-base">&gt; INITIALIZE_THREAD</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">Specify thread label and select target knowledge bases.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2 font-mono">
            <div className="space-y-1.5">
              <label htmlFor="thread-name" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Thread Title</label>
              <Input id="thread-name" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. CORE_QUERY_SESSION" autoFocus />
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Select Knowledge Bases</p>
              <div className="max-h-52 space-y-2 overflow-y-auto cyber-chamfer-sm border border-[#2a2a3a] bg-[#0a0a0f] p-3">
                {availableKnowledgeBases.map((kb) => (
                  <label key={kb.id} className="flex cursor-pointer items-center gap-2 text-xs font-bold uppercase text-foreground">
                    <input
                      type="checkbox"
                      className="accent-accent"
                      checked={selectedKbIds.includes(kb.id)}
                      onChange={() => setSelectedKbIds((ids) => ids.includes(kb.id) ? ids.filter((id) => id !== kb.id) : [...ids, kb.id])}
                    />
                    <span className="truncate">{kb.name}</span>
                    <span className="ml-auto text-[10px] text-muted-foreground">{kb.document_count} DOCS</span>
                  </label>
                ))}
                {!availableKnowledgeBases.length ? <p className="text-[10px] text-muted-foreground uppercase">NO_AVAILABLE_KNOWLEDGE_BASES</p> : null}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>CANCEL</Button>
            <Button onClick={() => void addThread()} disabled={!title.trim() || selectedKbIds.length === 0 || status === "saving"}>INITIALIZE</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
