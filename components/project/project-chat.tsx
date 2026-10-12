"use client";

import { Thread } from "@/components/assistant-ui/elements/thread.aui";

export function ProjectChat({ enabled = true }: { enabled?: boolean }) {
  return (
    <section className="min-w-0 flex-1 bg-background relative">
      <div className="flex h-12 items-center border-b px-6">
        <div>
          <p className="text-sm font-semibold">Notebook</p>
          <p className="text-xs text-muted-foreground">Ask questions about your sources</p>
        </div>
      </div>
      <div className="h-[calc(100%-3rem)] min-h-0 relative">
        {!enabled ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/80 backdrop-blur-[2px] px-8">
            <div className="max-w-md rounded-xl border border-amber-200 bg-amber-50 p-4 text-center text-sm text-amber-800 shadow-sm">
              Upload a document and wait for it to finish ingestion before chat is enabled.
            </div>
          </div>
        ) : null}
        <Thread />
      </div>
    </section>
  );
}
