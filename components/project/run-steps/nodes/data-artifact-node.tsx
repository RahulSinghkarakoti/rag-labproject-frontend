"use client";

import { memo } from "react";
import { Handle, Position, type NodeProps } from "@xyflow/react";
import { ArrowDownRight, ArrowUpRight, Box, FileText, Sparkles, Database, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DataArtifactNodeData } from "../types";

export const DataArtifactNode = memo(function DataArtifactNode({
  data,
  selected,
}: NodeProps & { data: DataArtifactNodeData }) {
  const isInput = data.variant === "input";
  const isSelected = selected || data.isSelected;

  return (
    <div
      className={cn(
        "w-[220px] p-2.5 bg-[#0e0e16] border cyber-chamfer-sm transition-all duration-150 font-mono text-xs cursor-pointer select-none",
        isSelected
          ? isInput
            ? "border-cyan-400 shadow-[0_0_14px_rgba(0,212,255,0.4)] ring-1 ring-cyan-400"
            : "border-accent shadow-[0_0_14px_rgba(0,255,136,0.4)] ring-1 ring-accent"
          : isInput
          ? "border-cyan-500/30 hover:border-cyan-400 hover:bg-[#131320]"
          : "border-accent/30 hover:border-accent hover:bg-[#131320]"
      )}
    >
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className={cn(
          "!w-2.5 !h-2.5 !border-2 !border-[#0a0a0f] !rounded-none",
          isInput ? "!bg-cyan-400" : "!bg-accent"
        )}
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className={cn(
          "!w-2.5 !h-2.5 !border-2 !border-[#0a0a0f] !rounded-none",
          isInput ? "!bg-cyan-400" : "!bg-accent"
        )}
      />

      {/* Node Tag Bar */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-[#2a2a3a]/80">
        <span
          className={cn(
            "text-[9px] uppercase font-bold tracking-wider flex items-center gap-1",
            isInput ? "text-cyan-400" : "text-accent"
          )}
        >
          {isInput ? (
            <>
              <ArrowDownRight className="h-3 w-3" />
              IN_DATA
            </>
          ) : (
            <>
              <ArrowUpRight className="h-3 w-3" />
              OUT_DATA
            </>
          )}
        </span>

        {data.badgeCount !== undefined && data.badgeCount > 0 && (
          <span
            className={cn(
              "px-1.5 py-0.2 text-[9px] font-bold",
              isInput
                ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/30"
                : "bg-accent/10 text-accent border border-accent/30"
            )}
          >
            {data.badgeCount} items
          </span>
        )}
      </div>

      {/* Main Label */}
      <div className="font-bold text-foreground text-[11px] truncate mb-1">
        {data.label}
      </div>

      {/* Preview Snippet */}
      {data.previewText && (
        <div className="text-[10px] text-muted-foreground font-sans line-clamp-2 leading-relaxed bg-[#12121a] p-1.5 border border-[#2a2a3a]/60">
          {data.previewText}
        </div>
      )}

      {data.subLabel && !data.previewText && (
        <div className="text-[9px] text-muted-foreground uppercase truncate">
          {data.subLabel}
        </div>
      )}

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className={cn(
          "!w-2.5 !h-2.5 !border-2 !border-[#0a0a0f] !rounded-none",
          isInput ? "!bg-cyan-400" : "!bg-accent"
        )}
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className={cn(
          "!w-2.5 !h-2.5 !border-2 !border-[#0a0a0f] !rounded-none",
          isInput ? "!bg-cyan-400" : "!bg-accent"
        )}
      />
    </div>
  );
});
