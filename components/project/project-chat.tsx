"use client";

import { useState } from "react";
import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { Database, PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useThreadStore } from "@/lib/thread-store";
import type { KnowledgeBase } from "@/lib/store";
import { KbDetailsDialog } from "@/components/project/kb-details-dialog";

export function ProjectChat({ 
  enabled = true,
  leftPanelOpen = true,
  rightPanelOpen = true,
  canCreateThread = false,
  isCreatingThread = false,
  onQuickCreateThread,
  onToggleLeftPanel,
  onToggleRightPanel,
}: { 
  enabled?: boolean;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
  canCreateThread?: boolean;
  isCreatingThread?: boolean;
  onQuickCreateThread?: () => void;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
}) {
  const activeThread = useThreadStore((s) => s.threads.find((t) => t.id === s.selectedThreadId));
  const [inspectKb, setInspectKb] = useState<KnowledgeBase | null>(null);

  return (
    <section className="min-w-0 flex-1 flex flex-col bg-[#0a0a0f] relative font-mono text-foreground h-full">
      <div className="flex h-12 items-center justify-between border-b border-[#2a2a3a] px-4 bg-[#12121a] shrink-0">
        <div className="flex items-center gap-3">
          {onToggleLeftPanel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-[#1c1c2e] rounded-none transition-none"
              onClick={onToggleLeftPanel}
              title={leftPanelOpen ? "Hide Sidebar" : "Show Sidebar"}
            >
              {leftPanelOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeft className="h-4 w-4" />}
            </Button>
          )}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-accent">&gt; QUERY_TERMINAL</p>
            <p className="text-[10px] text-muted-foreground uppercase hidden sm:block">Grounded RAG retrieval channel</p>
          </div>
          {activeThread?.knowledge_bases?.map((kb) => (
            <button
              key={kb.id}
              type="button"
              onClick={() => setInspectKb(kb)}
              className="hidden lg:inline-flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono border border-[#2a2a3a] bg-[#0a0a0f] hover:border-accent text-muted-foreground hover:text-accent transition-colors cyber-chamfer-sm"
              title={`Inspect specifications for ${kb.name}`}
            >
              <Database className="size-2.5 text-accent" />
              <span className="truncate max-w-[120px] text-foreground font-bold">{kb.name}</span>
              <span className="text-[9px] text-accent font-semibold">[SPECS]</span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {onToggleRightPanel && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-[#1c1c2e] rounded-none transition-none"
              onClick={onToggleRightPanel}
              title={rightPanelOpen ? "Hide Settings" : "Show Settings"}
            >
              {rightPanelOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
      <div className="flex-1 min-h-0 relative bg-[#0a0a0f]">
        {!enabled ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0f]/90 backdrop-blur-[2px] px-8">
            <div className="max-w-md cyber-chamfer border border-amber-500/50 bg-[#12121a] p-5 text-center text-xs text-amber-400 font-mono shadow-none space-y-3">
              <p>
                {canCreateThread
                  ? "> READY_TO_ENGAGE: Documents are indexed and ready for retrieval."
                  : "> CHAT_LOCKED: Ingest at least 1 document into a knowledge base to enable query terminal."}
              </p>
              {canCreateThread && onQuickCreateThread && (
                <Button
                  size="sm"
                  onClick={onQuickCreateThread}
                  disabled={isCreatingThread}
                  className="mt-2 text-xs font-bold uppercase tracking-wider"
                >
                  {isCreatingThread ? "INITIALIZING_SESSION..." : "INITIALIZE_FIRST_THREAD"}
                </Button>
              )}
            </div>
          </div>
        ) : null}
        <Thread />
      </div>

      <KbDetailsDialog
        kb={inspectKb}
        open={Boolean(inspectKb)}
        onOpenChange={(open) => !open && setInspectKb(null)}
      />
    </section>
  );
}
