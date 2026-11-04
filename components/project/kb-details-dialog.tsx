"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Binary,
  Database,
  FileText,
  Scissors,
  CheckCircle2,
} from "lucide-react";
import type { KnowledgeBase, DocumentItem } from "@/lib/store";

interface KbDetailsDialogProps {
  kb: KnowledgeBase | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documents?: DocumentItem[];
}

export function KbDetailsDialog({
  kb,
  open,
  onOpenChange,
  documents = [],
}: KbDetailsDialogProps) {
  if (!kb) return null;

  const chunkStrategy = kb.chunking_config?.strategy ?? "recursive";
  const chunkSize = kb.chunking_config?.chunk_size ?? 512;
  const chunkOverlap = kb.chunking_config?.chunk_overlap ?? 50;
  const embedModel = kb.embedding_config?.model ?? "BAAI/bge-large-en-v1.5";
  const docCount = documents.length || kb.document_count || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border border-[#2a2a3a] bg-[#0d0d14] p-6 text-foreground font-mono shadow-2xl cyber-chamfer">
        <DialogHeader className="border-b border-[#2a2a3a] pb-4 pr-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-2">
              <Database className="h-5 w-5 text-accent shrink-0" />
              <DialogTitle className="text-sm font-bold uppercase tracking-wider text-accent truncate">
                &gt; KB_SPECIFICATION: {kb.name}
              </DialogTitle>
            </div>
            <span className="px-2 py-0.5 border border-accent/40 bg-accent/10 text-accent text-[10px] uppercase font-bold shrink-0 cyber-chamfer-sm">
              {docCount} DOCS
            </span>
          </div>
          {kb.description ? (
            <DialogDescription className="text-xs text-muted-foreground font-mono mt-1">
              {kb.description}
            </DialogDescription>
          ) : (
            <DialogDescription className="text-[11px] text-muted-foreground uppercase font-mono mt-1">
              Knowledge base ingestion chunking and embedding configuration.
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Chunking Specification */}
          <div className="cyber-chamfer-sm border border-[#2a2a3a] bg-[#12121a] p-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-accent uppercase">
              <Scissors className="h-3.5 w-3.5" />
              <span>&gt; CHUNKING_PIPELINE</span>
            </div>
            <div className="grid grid-cols-3 gap-2 pt-1 border-t border-[#2a2a3a]/60 text-[10px]">
              <div>
                <span className="text-muted-foreground uppercase">STRATEGY:</span>
                <p className="font-bold text-foreground uppercase mt-0.5">{chunkStrategy}</p>
              </div>
              <div>
                <span className="text-muted-foreground uppercase">CHUNK_SIZE:</span>
                <p className="font-bold text-foreground mt-0.5">{chunkSize} TOKENS</p>
              </div>
              <div>
                <span className="text-muted-foreground uppercase">CHUNK_OVERLAP:</span>
                <p className="font-bold text-foreground mt-0.5">{chunkOverlap} TOKENS</p>
              </div>
            </div>
          </div>

          {/* Embedding Specification */}
          <div className="cyber-chamfer-sm border border-[#2a2a3a] bg-[#12121a] p-3 space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-bold text-accent uppercase">
              <Binary className="h-3.5 w-3.5" />
              <span>&gt; EMBEDDING_SPECIFICATION</span>
            </div>
            <div className="pt-1 border-t border-[#2a2a3a]/60 text-[10px]">
              <span className="text-muted-foreground uppercase">EMBEDDING_MODEL:</span>
              <p className="font-bold text-foreground mt-0.5 break-all">{embedModel}</p>
            </div>
          </div>

          {/* Documents */}
          <div className="cyber-chamfer-sm border border-[#2a2a3a] bg-[#12121a] p-3 space-y-2">
            <div className="flex items-center justify-between text-[11px] font-bold text-accent uppercase">
              <div className="flex items-center gap-2">
                <FileText className="h-3.5 w-3.5" />
                <span>&gt; DOCUMENTS ({documents.length})</span>
              </div>
            </div>
            {documents.length > 0 ? (
              <div className="max-h-40 overflow-y-auto space-y-1.5 pt-1 border-t border-[#2a2a3a]/60">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-2 p-1.5 bg-[#0a0a0f] border border-[#2a2a3a]/60 text-[10px]"
                  >
                    <div className="flex items-center gap-1.5 truncate">
                      <FileText className="size-3 text-accent shrink-0" />
                      <span className="truncate text-foreground font-mono">{doc.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {doc.chunk_count ? (
                        <span className="text-[9px] text-muted-foreground">
                          {doc.embedded_count ?? doc.chunk_count}/{doc.total_chunks ?? doc.chunk_count} chunks
                        </span>
                      ) : null}
                      <span className="text-[9px] text-green-400 font-bold uppercase flex items-center gap-1">
                        <CheckCircle2 className="size-2.5" />
                        {doc.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[10px] uppercase text-muted-foreground pt-1 border-t border-[#2a2a3a]/60">
                NO_DOCUMENTS_UPLOADED
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
