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
  const isArrayItem = data.itemIndex !== undefined;

  return (
    <div
      className={cn(
        "w-[195px] p-2.5 bg-card/60 backdrop-blur-xs border border-dashed cyber-chamfer-sm transition-all duration-150 font-mono text-xs cursor-pointer select-none",
        isSelected
          ? "border-accent ring-1 ring-accent/60 shadow-md bg-accent/5"
          : "border-border/80 hover:border-accent/60 hover:bg-card/90"
      )}
    >
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !border-background !rounded-none !bg-muted-foreground"
      />
      {isInput ? (
        <Handle
          id="top"
          type="target"
          position={Position.Top}
          className="!w-2 !h-2 !border-2 !border-background !rounded-none !bg-accent"
        />
      ) : (
        <Handle
          id="top"
          type="source"
          position={Position.Top}
          className="!w-2 !h-2 !border-2 !border-background !rounded-none !bg-accent"
        />
      )}

      {/* Node Tag Bar */}
      <div className="flex items-center justify-between pb-1 mb-1.5 border-b border-border/60">
        <span
          className={cn(
            "text-[8px] uppercase font-bold tracking-widest flex items-center gap-1 px-1 py-0.2 border",
            isInput
              ? "bg-blue-500/10 text-blue-400 border-blue-500/30"
              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          )}
        >
          {isInput ? (
            <>
              <ArrowDownRight className="h-2.5 w-2.5" />
              IN_PAYLOAD
            </>
          ) : isArrayItem ? (
            <>
              <ArrowUpRight className="h-2.5 w-2.5" />
              OUT_ITEM
            </>
          ) : (
            <>
              <ArrowUpRight className="h-2.5 w-2.5" />
              OUT_PAYLOAD
            </>
          )}
        </span>

        {isArrayItem && data.totalItems !== undefined ? (
          <span className="px-1 py-0.2 text-[8px] font-bold bg-secondary text-muted-foreground border border-border">
            #{data.itemIndex! + 1}/{data.totalItems}
          </span>
        ) : data.badgeCount !== undefined && data.badgeCount > 0 ? (
          <span className="px-1 py-0.2 text-[8px] font-bold bg-secondary text-muted-foreground border border-border">
            {data.badgeCount} items
          </span>
        ) : null}
      </div>

      {/* Main Label */}
      <div className="font-semibold text-foreground text-[10.5px] truncate mb-0.5">
        {data.label}
      </div>

      {/* SubLabel / Meta */}
      {data.subLabel && (
        <div className="text-[8.5px] text-muted-foreground font-mono mb-1 truncate">
          {data.subLabel}
        </div>
      )}

      {/* Preview Snippet */}
      {data.previewText && (
        <div className="text-[9.5px] text-muted-foreground/90 font-mono line-clamp-2 leading-relaxed bg-background/80 p-1.5 border border-border/40">
          {data.previewText}
        </div>
      )}

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!w-2 !h-2 !border-2 !border-background !rounded-none !bg-muted-foreground"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!w-2 !h-2 !border-2 !border-background !rounded-none !bg-muted-foreground"
      />
    </div>
  );
});
