"use client";

import { useState } from "react";
import { Cpu, Copy, Check, MessageSquare, BookOpen } from "lucide-react";

interface GenerationFormatterProps {
  data: any;
  variant: "input" | "output";
}

export function GenerationFormatter({ data, variant }: GenerationFormatterProps) {
  const [copied, setCopied] = useState(false);

  if (!data) {
    return <div className="text-[11px] text-muted-foreground italic font-mono">// No generation data</div>;
  }

  if (variant === "input") {
    const query =
      typeof data === "object" && data !== null
        ? data.query || data.prompt || JSON.stringify(data)
        : String(data);
    const contextLength =
      typeof data === "object" && data !== null
        ? data.context_length ?? (data.context ? data.context.length : null)
        : null;

    return (
      <div className="space-y-3 font-mono">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
          <span className="flex items-center gap-1.5 text-accent font-bold">
            <Cpu className="h-3.5 w-3.5" />
            Generation Prompt Input
          </span>
          {contextLength !== null && (
            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <BookOpen className="h-3 w-3 text-accent" />
              Context: {contextLength.toLocaleString()} chars (~{Math.round(contextLength / 4).toLocaleString()} tokens)
            </span>
          )}
        </div>
        <div className="p-3 bg-card border border-border cyber-chamfer-sm space-y-1">
          <span className="text-[10px] text-muted-foreground uppercase block font-bold">Prompt Focus:</span>
          <p className="text-xs text-foreground font-sans leading-relaxed whitespace-pre-wrap select-text">
            {query}
          </p>
        </div>
      </div>
    );
  }

  // Variant: output (LLM generation text)
  const responseText =
    typeof data === "string"
      ? data
      : data.response || data.answer || data.content || JSON.stringify(data, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(responseText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2 font-mono">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
        <span className="flex items-center gap-1.5 text-accent font-bold">
          <MessageSquare className="h-3.5 w-3.5" />
          Model Answer Output ({responseText.length.toLocaleString()} chars)
        </span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 px-2 py-0.5 bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground text-[10px] transition-colors border border-border"
        >
          {copied ? <Check className="h-3 w-3 text-accent" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy Output"}
        </button>
      </div>

      <div className="p-3.5 bg-card border border-border cyber-chamfer-sm text-xs font-sans text-foreground/95 leading-relaxed whitespace-pre-wrap select-text max-h-[360px] overflow-y-auto">
        {responseText}
      </div>
    </div>
  );
}
