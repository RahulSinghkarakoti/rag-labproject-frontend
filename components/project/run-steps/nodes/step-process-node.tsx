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
        "w-[260px] p-3.5 bg-card border cyber-chamfer-sm transition-all duration-150 font-mono text-xs cursor-pointer select-none",
        isSelected
          ? "border-accent ring-1 ring-accent shadow-sm"
          : step.status === "running"
          ? "border-yellow-400 ring-1 ring-yellow-400/50 shadow-md shadow-yellow-500/10 animate-pulse bg-yellow-500/5"
          : "border-border hover:border-accent/50 hover:bg-secondary/40"
      )}
    >
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-accent !border-2 !border-background !rounded-none"
      />

      {/* Header Bar */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="px-1.5 py-0.5 bg-accent text-accent-foreground font-bold text-[10px]">
            #{step.sequence}
          </span>
          <Icon className="h-4 w-4 text-accent shrink-0" />
          <span className="font-bold text-foreground uppercase truncate text-[11px]">
            {data.title}
          </span>
        </div>
      </div>

      {/* Status & Latency row */}
      <div className="flex items-center justify-between text-[10px] mb-2.5">
        <span
          className={cn(
            "uppercase font-bold flex items-center gap-1",
            step.status === "completed"
              ? "text-green-500"
              : step.status === "failed"
              ? "text-destructive"
              : step.status === "cancelled"
              ? "text-amber-500"
              : "text-yellow-500"
          )}
        >
          {step.status === "running" && <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />}
          {step.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
          {step.status === "failed" && <XCircle className="h-3 w-3" />}
          {step.status === "cancelled" && <Ban className="h-3 w-3" />}
          {step.status}
        </span>

        {data.duration && (
          <span className="flex items-center gap-1 text-muted-foreground font-mono">
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
