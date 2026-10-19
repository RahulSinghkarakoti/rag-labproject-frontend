"use client";

import { useState } from "react";
import {
  ChevronDown,
  Database,
  Plus,
  Trash2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useKnowledgeBaseStore } from "@/lib/store";
import { CreateKnowledgeBaseDialog } from "./create-knowledge-base-dialog";

interface KnowledgeBaseSelectorProps {
  projectId: string;
}

export function KnowledgeBaseSelector({ projectId }: KnowledgeBaseSelectorProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const knowledgeBases = useKnowledgeBaseStore((state) => state.knowledgeBases);
  const selectedKbId = useKnowledgeBaseStore((state) => state.selectedKnowledgeBaseId);
  const selectKnowledgeBase = useKnowledgeBaseStore((state) => state.selectKnowledgeBase);
  const deleteKnowledgeBase = useKnowledgeBaseStore((state) => state.deleteKnowledgeBase);

  const activeKb = knowledgeBases.find((kb) => kb.id === selectedKbId);

  const handleDelete = async (e: React.MouseEvent, kbId: string) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this knowledge base and its documents?")) {
      await deleteKnowledgeBase(projectId, kbId);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between gap-2 font-mono">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center justify-between cyber-chamfer-sm border border-[#2a2a3a] bg-[#12121a] px-2.5 py-1.5 text-left text-xs transition-none hover:border-accent"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-5 shrink-0 items-center justify-center cyber-chamfer-sm bg-accent text-[#0a0a0f]">
                  <Database className="size-3" />
                </div>
                <div className="min-w-0 truncate">
                  <p className="truncate font-bold uppercase text-foreground">
                    {activeKb ? activeKb.name : "SELECT_KB"}
                  </p>
                  {activeKb && (
                    <p className="text-[9px] uppercase text-muted-foreground truncate">
                      {activeKb.chunking_config?.strategy || "recursive"} · {activeKb.document_count || 0} DOCS
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-accent ml-1" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-64 font-mono">
            <DropdownMenuLabel className="text-[10px] font-bold text-accent uppercase tracking-widest">
              KNOWLEDGE_BASES [{knowledgeBases.length}]
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-[#2a2a3a]" />

            {knowledgeBases.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground uppercase">
                NO_KB_CONFIGURED
              </div>
            ) : (
              knowledgeBases.map((kb) => (
                <DropdownMenuItem
                  key={kb.id}
                  onClick={() => selectKnowledgeBase(kb.id)}
                  className="flex items-center justify-between cursor-pointer py-2 font-mono"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className={`truncate text-xs font-bold uppercase ${kb.id === selectedKbId ? "text-accent" : "text-foreground"}`}>
                      {kb.name}
                    </p>
                    <p className="text-[9px] text-muted-foreground truncate uppercase">
                      {kb.chunking_config?.strategy ?? "recursive"} ({kb.document_count ?? 0} DOCS)
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${kb.name}`}
                    className="p-1 text-muted-foreground hover:text-destructive transition-none"
                    onClick={(e) => handleDelete(e, kb.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator className="bg-[#2a2a3a]" />
            <DropdownMenuItem
              onClick={() => setIsCreateOpen(true)}
              className="cursor-pointer text-xs font-bold text-accent uppercase flex items-center gap-1.5"
            >
              <Plus className="size-3.5" /> NEW_KNOWLEDGE_BASE
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="icon-xs"
          variant="outline"
          title="Create New Knowledge Base"
          onClick={() => setIsCreateOpen(true)}
          className="shrink-0 h-8 w-8"
        >
          <Plus className="size-3.5" />
        </Button>
      </div>

      <CreateKnowledgeBaseDialog
        projectId={projectId}
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
      />
    </>
  );
}
