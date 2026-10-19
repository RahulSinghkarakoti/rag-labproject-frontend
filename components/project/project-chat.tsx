"use client";

import { Thread } from "@/components/assistant-ui/elements/thread.aui";
import { ThemeAccentSelector } from "@/components/theme-accent-selector";

export function ProjectChat({ enabled = true }: { enabled?: boolean }) {
  return (
    <section className="min-w-0 flex-1 bg-[#0a0a0f] relative font-mono text-foreground">
      <div className="flex h-12 items-center justify-between border-b border-[#2a2a3a] px-6 bg-[#12121a]">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-accent">&gt; QUERY_TERMINAL</p>
          <p className="text-[10px] text-muted-foreground uppercase">Grounded RAG retrieval channel</p>
        </div>
        <ThemeAccentSelector />
      </div>
      <div className="h-[calc(100%-3rem)] min-h-0 relative bg-[#0a0a0f]">
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
