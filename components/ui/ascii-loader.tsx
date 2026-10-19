"use client";

import { useEffect, useState } from "react";

const ASCII_SPINNERS = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
const ASCII_BARS = [
  "[▓░░░░░░░░░]",
  "[▓▓░░░░░░░░]",
  "[▓▓▓░░░░░░░]",
  "[▓▓▓▓░░░░░░]",
  "[▓▓▓▓▓░░░░░]",
  "[▓▓▓▓▓▓░░░░]",
  "[▓▓▓▓▓▓▓░░░]",
  "[▓▓▓▓▓▓▓▓░░]",
  "[▓▓▓▓▓▓▓▓▓░]",
  "[▓▓▓▓▓▓▓▓▓▓]",
];

const DOT_FRAMES = [
  "⠋ [ ● ○ ○ ○ ]",
  "⠙ [ ○ ● ○ ○ ]",
  "⠹ [ ○ ○ ● ○ ]",
  "⠸ [ ○ ○ ○ ● ]",
  "⠼ [ ○ ○ ● ○ ]",
  "⠴ [ ○ ● ○ ○ ]",
];

/**
 * 1. Assistant Reply Loader
 * Rendered when waiting for the assistant to reply in an active chat.
 */
export function AssistantReplyLoader({
  label = "PROCESSING_RESPONSE",
}: {
  label?: string;
}) {
  const [frame, setFrame] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed((now - startTime) / 1000);
      setFrame((f) => (f + 1) % ASCII_SPINNERS.length);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const bar = ASCII_BARS[frame % ASCII_BARS.length];
  const spinner = ASCII_SPINNERS[frame % ASCII_SPINNERS.length];

  return (
    <div className="inline-flex items-center gap-2 font-mono text-xs text-accent bg-[#12121a] border border-[#2a2a3a] px-3 py-1.5 cyber-chamfer-sm select-none my-1">
      <span className="font-bold text-accent">{spinner}</span>
      <span className="tracking-wider uppercase font-bold text-foreground">{label}</span>
      <span className="text-accent/80 font-bold">{bar}</span>
      <span className="text-muted-foreground text-[10px] tabular-nums font-mono border-l border-[#2a2a3a] pl-2 font-bold">
        {elapsed.toFixed(1)}s
      </span>
    </div>
  );
}

/**
 * 2. Thread Message Loader
 * Rendered centered when switching to another thread while messages are being fetched.
 */
export function ThreadMessageLoader({
  label = "FETCHING_CONVERSATION_HISTORY",
}: {
  label?: string;
}) {
  const [frame, setFrame] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      setElapsed((now - startTime) / 1000);
      setFrame((f) => (f + 1) % DOT_FRAMES.length);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  const dots = DOT_FRAMES[frame % DOT_FRAMES.length];

  return (
    <div className="flex w-full justify-center items-center my-6">
      <div className="inline-flex items-center gap-3 font-mono text-xs text-accent bg-[#12121a] border border-[#2a2a3a] px-4 py-2 cyber-chamfer-sm select-none shadow-xl">
        <span className="font-bold text-accent tracking-widest text-sm">{dots}</span>
        <span className="tracking-wider uppercase font-bold text-foreground text-[11px]">{label}</span>
        <span className="text-muted-foreground text-[11px] tabular-nums font-mono border-l border-[#2a2a3a] pl-3 font-bold">
          {elapsed.toFixed(1)}s
        </span>
      </div>
    </div>
  );
}

/**
 * Backward-compatible generic wrapper
 */
export function AsciiLoader({
  label,
  centered = false,
}: {
  label?: string;
  centered?: boolean;
}) {
  if (centered) {
    return <ThreadMessageLoader label={label} />;
  }
  return <AssistantReplyLoader label={label} />;
}
