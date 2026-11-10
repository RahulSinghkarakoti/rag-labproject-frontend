"use client";

import { Brain, MessageSquare, History, Sparkles, User, Bot, FileText, Layers } from "lucide-react";
import { cn } from "@/lib/utils";

interface MemoryFormatterProps {
  data: any;
  variant: "input" | "output";
}

export function MemoryFormatter({ data, variant }: MemoryFormatterProps) {
  if (!data) {
    return (
      <div className="text-[11px] text-muted-foreground italic font-mono p-3 bg-card border border-border cyber-chamfer-sm">
        // No memory data recorded for this step
      </div>
    );
  }

  // VARIANT: INPUT
  if (variant === "input") {
    const threadId =
      typeof data === "object" && data !== null && data.thread_id ? String(data.thread_id) : null;
    const memoryTurns =
      typeof data === "object" && data !== null
        ? data.memory_turns ?? data.limit ?? null
        : null;

    return (
      <div className="space-y-3 font-mono">
        <div className="p-3 bg-card border border-border cyber-chamfer-sm space-y-2">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
            <span className="flex items-center gap-1.5 text-accent font-bold">
              <Brain className="h-3.5 w-3.5" />
              Conversation Context Request
            </span>
            {memoryTurns !== null && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground bg-secondary/40 px-1.5 py-0.5 border border-border">
                <History className="h-3 w-3" />
                Max {memoryTurns} Turns Window
              </span>
            )}
          </div>

          <div className="text-xs text-foreground space-y-1 font-sans">
            {threadId ? (
              <p className="font-mono text-[11px] text-muted-foreground">
                Target Thread ID: <span className="text-accent">{threadId}</span>
              </p>
            ) : (
              <p className="text-muted-foreground text-xs">
                Querying recent dialogue history and progressive summary for context assembly.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // VARIANT: OUTPUT
  // Normalize both new dictionary format and legacy tuple array format:
  // Legacy: [recent_turns, summary_text, is_summarized]
  // New: { recent_turns: [...], turn_count: X, summary: "...", is_summarized: bool }
  let recentTurns: Array<{ role?: string; content?: string }> = [];
  let summaryText: string | null = null;
  let isSummarized = false;
  let turnCount = 0;

  if (Array.isArray(data)) {
    recentTurns = Array.isArray(data[0]) ? data[0] : [];
    summaryText = typeof data[1] === "string" ? data[1] : null;
    isSummarized = Boolean(data[2]);
    turnCount = recentTurns.length;
  } else if (typeof data === "object" && data !== null) {
    recentTurns = Array.isArray(data.recent_turns) ? data.recent_turns : [];
    summaryText = typeof data.summary === "string" ? data.summary : null;
    isSummarized = Boolean(data.is_summarized);
    turnCount = typeof data.turn_count === "number" ? data.turn_count : recentTurns.length;
  }

  const hasTurns = recentTurns.length > 0;
  const hasSummary = Boolean(summaryText && summaryText.trim().length > 0);

  return (
    <div className="space-y-4 font-mono">
      {/* Top Status & Metrics Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 bg-card border border-border cyber-chamfer-sm text-xs">
        <div className="flex items-center gap-2">
          <Brain className="h-4 w-4 text-accent" />
          <span className="font-bold text-foreground">Memory Context</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Compaction status badge */}
          {isSummarized ? (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5">
              <Sparkles className="h-3 w-3" />
              Context Compacted
            </span>
          ) : (
            <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-muted-foreground bg-secondary/40 border border-border px-2 py-0.5">
              <History className="h-3 w-3" />
              Verbatim Window
            </span>
          )}

          {/* Turn count badge */}
          <span className="flex items-center gap-1 text-[10px] uppercase font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5">
            <Layers className="h-3 w-3" />
            {turnCount} Prior Turns
          </span>
        </div>
      </div>

      {/* Progressive Conversation Summary (if present) */}
      {hasSummary && (
        <div className="p-3 bg-card/80 border border-border cyber-chamfer-sm space-y-2">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold">
            <span className="flex items-center gap-1.5 text-accent">
              <FileText className="h-3.5 w-3.5" />
              Progressive Conversation Summary
            </span>
            <span className="text-[10px] text-muted-foreground">
              Compacted Context
            </span>
          </div>

          <div className="p-2.5 bg-background/60 border-l-2 border-accent text-xs font-sans text-foreground/90 whitespace-pre-wrap leading-relaxed select-text">
            {summaryText}
          </div>
        </div>
      )}

      {/* Recent Turns Window */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-[10px] uppercase text-muted-foreground px-1">
          <span className="font-bold">
            Recent Dialogue Turns ({recentTurns.length})
          </span>
          <span className="text-[10px]">
            Chronological Order
          </span>
        </div>

        {hasTurns ? (
          <div className="space-y-2">
            {recentTurns.map((turn, idx) => {
              const role = (turn.role || "human").toLowerCase();
              const isHuman = role === "human" || role === "user";
              const isAssistant = role === "assistant" || role === "ai";

              return (
                <div
                  key={idx}
                  className={cn(
                    "p-3 border cyber-chamfer-sm space-y-1.5 transition-colors",
                    isHuman
                      ? "bg-card border-border hover:border-accent/40"
                      : "bg-secondary/20 border-border hover:border-primary/40"
                  )}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "flex items-center gap-1 px-1.5 py-0.5 font-bold uppercase border text-[9px]",
                          isHuman
                            ? "bg-accent/10 text-accent border-accent/20"
                            : isAssistant
                            ? "bg-primary/10 text-primary border-primary/20"
                            : "bg-secondary text-muted-foreground border-border"
                        )}
                      >
                        {isHuman ? (
                          <User className="h-2.5 w-2.5" />
                        ) : isAssistant ? (
                          <Bot className="h-2.5 w-2.5" />
                        ) : (
                          <MessageSquare className="h-2.5 w-2.5" />
                        )}
                        {role}
                      </span>
                      <span className="text-muted-foreground">Turn #{idx + 1}</span>
                    </div>
                  </div>

                  <p className="text-xs text-foreground font-sans leading-relaxed whitespace-pre-wrap select-text">
                    {turn.content || "// Empty message"}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4 bg-card border border-border cyber-chamfer-sm text-center text-xs text-muted-foreground italic font-mono">
            // No prior conversation dialogue in this thread (first message)
          </div>
        )}
      </div>
    </div>
  );
}
