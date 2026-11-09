"use client";

import { MessageSquare, Sparkles, History, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface QueryFormatterProps {
  data: any;
  variant: "input" | "output";
  selectedItemIndex?: number;
}

export function QueryFormatter({ data, variant, selectedItemIndex }: QueryFormatterProps) {
  if (!data) {
    return <div className="text-[11px] text-muted-foreground italic font-mono">// No query data</div>;
  }

  if (variant === "input") {
    const rawQuery =
      typeof data === "string"
        ? data
        : data.query || data.original_query || data.content || JSON.stringify(data);
    const memoryLength =
      typeof data === "object" && data !== null ? data.memory_length ?? data.memory_turns : null;

    return (
      <div className="space-y-3 font-mono">
        <div className="p-3 bg-card border border-border cyber-chamfer-sm space-y-1.5">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
            <span className="flex items-center gap-1.5 text-accent font-bold">
              <MessageSquare className="h-3.5 w-3.5" />
              Incoming User Query
            </span>
            {memoryLength !== null && memoryLength !== undefined && (
              <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <History className="h-3 w-3" />
                {memoryLength} Prior Turns
              </span>
            )}
          </div>
          <p className="text-xs text-foreground font-sans leading-relaxed whitespace-pre-wrap select-text">
            {rawQuery}
          </p>
        </div>
      </div>
    );
  }

  // Variant: output
  let queries: string[] = [];
  if (Array.isArray(data)) {
    queries = data.map((q) => (typeof q === "string" ? q : JSON.stringify(q)));
  } else if (typeof data === "object" && data !== null) {
    if (Array.isArray(data.transformed_queries)) {
      queries = data.transformed_queries;
    } else if (Array.isArray(data.queries)) {
      queries = data.queries;
    } else if (Array.isArray(data.result)) {
      queries = data.result;
    } else if (typeof data.response === "string") {
      queries = [data.response];
    } else {
      queries = [JSON.stringify(data)];
    }
  } else if (typeof data === "string") {
    queries = [data];
  }

  return (
    <div className="space-y-2 font-mono">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
        <span className="flex items-center gap-1 text-accent font-bold">
          <Sparkles className="h-3.5 w-3.5" />
          Transformed Search Variations ({queries.length})
        </span>
      </div>
      <div className="space-y-2">
        {queries.map((q, idx) => {
          const isSelected = selectedItemIndex === idx;
          return (
            <div
              key={idx}
              className={cn(
                "p-2.5 bg-card border cyber-chamfer-sm flex items-start gap-2.5 text-xs text-foreground transition-all",
                isSelected
                  ? "border-accent ring-1 ring-accent shadow-sm"
                  : "border-border hover:border-accent/40"
              )}
            >
              <span
                className={cn(
                  "px-1.5 py-0.5 text-[10px] font-bold shrink-0",
                  isSelected
                    ? "bg-accent text-accent-foreground"
                    : "bg-secondary text-accent"
                )}
              >
                #{idx + 1}
              </span>
              <span className="font-sans leading-relaxed select-text flex-1">{q}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
