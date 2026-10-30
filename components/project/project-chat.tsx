"use client";

import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { PanelLeftClose, PanelLeft, PanelRightClose, PanelRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProjectChat({ 
  enabled = true,
  leftPanelOpen = true,
  rightPanelOpen = true,
  onToggleLeftPanel,
  onToggleRightPanel,
}: { 
  enabled?: boolean;
  leftPanelOpen?: boolean;
  rightPanelOpen?: boolean;
  onToggleLeftPanel?: () => void;
  onToggleRightPanel?: () => void;
}) {
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
            <div className="max-w-md cyber-chamfer border border-amber-500/50 bg-[#12121a] p-4 text-center text-xs text-amber-400 font-mono shadow-none">
              &gt; CHAT_LOCKED: Ingest at least 1 document or select an active thread to enable query terminal.
            </div>
          </div>
        ) : null}
        <Thread />
      </div>
    </section>
  );
}
