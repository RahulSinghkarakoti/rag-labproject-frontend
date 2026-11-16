"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import {
  Sparkles,
  Database,
  Filter,
  Cpu,
  Layers,
  Code2,
  Clock,
  CheckCircle2,
  XCircle,
  Ban,
  SlidersHorizontal,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { StepProcessNodeData } from "../types";

const STEP_ICONS: Record<string, any> = {
  query_transformation: Sparkles,
  transformation: Sparkles,
  retrieval: Database,
  reranking: Filter,
  generation: Cpu,
  context: Layers,
};

export const StepProcessNode = memo(function StepProcessNode({
  data,
  selected,
}: NodeProps & { data: StepProcessNodeData }) {
  const step = data.step;
  const Icon = STEP_ICONS[step.step_type] || Code2;
  const isSelected = selected || data.isSelected;

  return (
    <div
      className={cn(
        "w-[260px] p-3.5 bg-card/95 border-2 cyber-chamfer-sm transition-all duration-150 font-mono text-xs cursor-pointer select-none shadow-md",
        isSelected
          ? "border-accent ring-2 ring-accent/60 shadow-lg shadow-accent/10"
          : step.status === "running"
          ? "border-amber-400 ring-2 ring-amber-400/40 shadow-xl shadow-amber-500/15 animate-pulse bg-amber-500/5"
          : step.status === "completed"
          ? "border-emerald-500/60 hover:border-emerald-500/90 hover:bg-card"
          : step.status === "failed"
          ? "border-destructive ring-1 ring-destructive"
          : "border-border hover:border-accent/60 hover:bg-secondary/40"
      )}
    >
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-accent !border-2 !border-background !rounded-none"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border/80">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="px-1.5 py-0.5 bg-accent text-accent-foreground font-black text-[9px] tracking-wider uppercase">
            STEP #{step.sequence}
          </span>
          <Icon className="h-4 w-4 text-accent shrink-0" />
          <span className="font-bold text-foreground uppercase truncate text-[11px] tracking-wide">
            {data.title}
          </span>
        </div>
      </div>

      {/* Status & Latency row */}
      <div className="flex items-center justify-between text-[10px] mb-2.5">
        <span
          className={cn(
            "uppercase font-bold flex items-center gap-1 px-1.5 py-0.5 border text-[9px]",
            step.status === "completed"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : step.status === "failed"
              ? "bg-destructive/10 text-destructive border-destructive/30"
              : step.status === "cancelled"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : step.status === "running"
              ? "bg-amber-500/20 text-amber-300 border-amber-400 animate-pulse"
              : "bg-secondary text-muted-foreground border-border"
          )}
        >
          {step.status === "running" && <Loader2 className="h-3 w-3 animate-spin text-amber-300" />}
          {step.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
          {step.status === "failed" && <XCircle className="h-3 w-3" />}
          {step.status === "cancelled" && <Ban className="h-3 w-3" />}
          {step.status}
        </span>

        {data.duration && (
          <span className="flex items-center gap-1 text-muted-foreground font-mono bg-secondary/80 px-1.5 py-0.5 border border-border/60 text-[9px]">
            <Clock className="h-3 w-3 text-accent" />
            {data.duration}
          </span>
        )}
      </div>

      {/* Config Summary Pills */}
      {data.configSummary && data.configSummary.length > 0 && (
        <div className="flex flex-wrap gap-1 pt-1.5 border-t border-border/60">
          {data.configSummary.slice(0, 3).map((cfg, idx) => (
            <span
              key={idx}
              className="px-1.5 py-0.5 bg-secondary text-muted-foreground text-[9px] border border-border truncate max-w-[120px]"
              title={`${cfg.key}: ${cfg.value}`}
            >
              <span className="text-accent/90">{cfg.key}:</span> {String(cfg.value)}
            </span>
          ))}
          {data.configSummary.length > 3 && (
            <span className="px-1 py-0.5 text-muted-foreground text-[9px]">
              +{data.configSummary.length - 3}
            </span>
          )}
        </div>
      )}

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-accent !border-2 !border-background !rounded-none"
      />
    </div>
  );
});
