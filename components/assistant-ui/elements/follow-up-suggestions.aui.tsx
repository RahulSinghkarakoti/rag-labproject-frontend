"use client";

import { AuiIf, useAuiState, ThreadPrimitive } from "@assistant-ui/react";
import { useCallback, useEffect, useRef, useState, type FC } from "react";
import { Sparkles } from "lucide-react";

const FollowupSuggestionsRow: FC = () => {
  const suggestions = useAuiState((s) => s.thread.suggestions);
  const scrollRef = useRef<HTMLDivElement>(null);
  const rtlRef = useRef<boolean | null>(null);
  const [fades, setFades] = useState({ left: false, right: false });

  const updateFades = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const maxScroll = el.scrollWidth - el.clientWidth;
    // scrollLeft runs 0..-max in RTL; normalize to hidden width per physical edge.
    const fromStart = Math.abs(el.scrollLeft);
    // getComputedStyle forces a style recalc per scroll event; direction is stable, read it once.
    const rtl = (rtlRef.current ??= getComputedStyle(el).direction === "rtl");
    const [left, right] = rtl
      ? [maxScroll - fromStart, fromStart]
      : [fromStart, maxScroll - fromStart];
    setFades((prev) => {
      const next = { left: left > 1, right: right > 1 };
      return prev.left === next.left && prev.right === next.right ? prev : next;
    });
  }, []);

  useEffect(() => {
    updateFades();
    const el = scrollRef.current;
    if (!el?.firstElementChild) return undefined;
    const observer = new ResizeObserver(updateFades);
    observer.observe(el);
    observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [updateFades]);

  const maskImage = `linear-gradient(to right, ${
    fades.left ? "transparent, black 2rem" : "black"
  }, ${fades.right ? "black calc(100% - 2rem), transparent" : "black"})`;

  return (
    <div
      ref={scrollRef}
      onScroll={updateFades}
      className="aui-thread-followup-suggestions -my-1 w-full [scrollbar-width:none] overflow-x-auto py-1.5 [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden font-mono"
      style={{ maskImage, WebkitMaskImage: maskImage }}
    >
      <div className="mx-auto flex min-h-8 w-max items-center gap-2 px-1">
        <span className="text-[10px] uppercase font-bold text-accent tracking-wider flex items-center gap-1 shrink-0 select-none">
          <Sparkles className="size-3 text-accent fill-accent/20" />
          <span className="hidden sm:inline">SUGGESTED:</span>
        </span>
        {suggestions.map((suggestion, idx) => (
          <ThreadPrimitive.Suggestion
            key={idx}
            className="aui-thread-followup-suggestion cyber-chamfer-sm border border-[#2a2a3a] bg-[#12121a] hover:border-accent hover:bg-[#1a1a28] hover:text-accent px-2.5 py-1 text-xs whitespace-nowrap transition-none flex items-center gap-1.5 cursor-pointer text-foreground/90 font-mono shadow-none"
            prompt={suggestion.prompt}
            send
          >
            <span className="text-accent font-bold text-xs select-none">&gt;</span>
            <span>{suggestion.title ?? suggestion.prompt}</span>
            {suggestion.label && (
              <span className="aui-thread-followup-suggestion-label text-muted-foreground ms-1 text-[10px]">
                {suggestion.label}
              </span>
            )}
          </ThreadPrimitive.Suggestion>
        ))}
      </div>
    </div>
  );
};

export const ThreadFollowupSuggestions: FC = () => (
  <AuiIf
    condition={(s) =>
      !s.thread.isEmpty &&
      !s.thread.isRunning &&
      s.thread.suggestions.length > 0
    }
  >
    <FollowupSuggestionsRow />
  </AuiIf>
);
