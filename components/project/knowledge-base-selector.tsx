"use client";

import { useState } from "react";
import {
  ChevronDown,
  Database,
  Plus,
  Trash2,
  Layers,
  Sparkles,
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
      <div className="flex items-center justify-between gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex min-w-0 flex-1 items-center justify-between rounded-lg border bg-background/80 px-2.5 py-1.5 text-left text-xs font-medium shadow-xs hover:bg-accent transition-colors"
            >
              <div className="flex min-w-0 items-center gap-2">
                <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                  <Database className="size-3" />
                </div>
                <div className="min-w-0 truncate">
                  <p className="truncate font-medium text-foreground">
                    {activeKb ? activeKb.name : "Select Knowledge Base"}
                  </p>
                  {activeKb && (
                    <p className="text-[10px] text-muted-foreground truncate">
                      {activeKb.chunking_config?.strategy || "recursive"} · {activeKb.document_count || 0} docs
                    </p>
                  )}
                </div>
              </div>
              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground ml-1" />
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="start" className="w-64">
            <DropdownMenuLabel className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
              Knowledge Bases ({knowledgeBases.length})
            </DropdownMenuLabel>
            <DropdownMenuSeparator />

            {knowledgeBases.length === 0 ? (
              <div className="p-3 text-center text-xs text-muted-foreground">
                No knowledge bases created yet.
              </div>
            ) : (
              knowledgeBases.map((kb) => (
                <DropdownMenuItem
                  key={kb.id}
                  onClick={() => selectKnowledgeBase(kb.id)}
                  className="flex items-center justify-between cursor-pointer py-2"
                >
                  <div className="min-w-0 flex-1 mr-2">
                    <p className={`truncate text-xs ${kb.id === selectedKbId ? "font-semibold text-primary" : ""}`}>
                      {kb.name}
                    </p>
                    <p className="text-[10px] text-muted-foreground truncate">
                      {kb.chunking_config?.strategy ?? "recursive"} ({kb.document_count ?? 0} docs)
                    </p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Delete ${kb.name}`}
                    className="p-1 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                    onClick={(e) => handleDelete(e, kb.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </DropdownMenuItem>
              ))
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setIsCreateOpen(true)}
              className="cursor-pointer text-xs font-medium text-primary flex items-center gap-1.5"
            >
              <Plus className="size-3.5" /> New Knowledge Base
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          size="icon-xs"
          variant="outline"
          title="Create New Knowledge Base"
          onClick={() => setIsCreateOpen(true)}
          className="shrink-0"
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
