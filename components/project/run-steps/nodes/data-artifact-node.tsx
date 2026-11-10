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
        "w-55 p-2.5 bg-card border cyber-chamfer-sm transition-all duration-150 font-mono text-xs cursor-pointer select-none",
        isSelected
          ? "border-accent ring-1 ring-accent shadow-sm"
          : "border-border hover:border-accent hover:bg-secondary/40"
      )}
    >
      <Handle
        id="left"
        type="target"
        position={Position.Left}
        className="w-2.5! h-2.5! border-2! border-background! rounded-none! bg-accent!"
      />
      <Handle
        id="top"
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !border-2 !border-background !rounded-none !bg-accent"
      />

      {/* Node Tag Bar */}
      <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border/80">
        <span
          className="text-[9px] uppercase font-bold tracking-wider flex items-center gap-1 text-accent"
        >
          {isInput ? (
            <>
              <ArrowDownRight className="h-3 w-3" />
              IN_DATA
            </>
          ) : isArrayItem ? (
            <>
              <ArrowUpRight className="h-3 w-3" />
              ITEM_OUT
            </>
          ) : (
            <>
              <ArrowUpRight className="h-3 w-3" />
              OUT_DATA
            </>
          )}
        </span>

        {isArrayItem && data.totalItems !== undefined ? (
          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-accent/10 text-accent border border-accent/30">
            #{data.itemIndex! + 1} of {data.totalItems}
          </span>
        ) : data.badgeCount !== undefined && data.badgeCount > 0 ? (
          <span className="px-1.5 py-0.2 text-[9px] font-bold bg-accent/10 text-accent border border-accent/30">
            {data.badgeCount} items
          </span>
        ) : null}
      </div>

      {/* Main Label */}
      <div className="font-bold text-foreground text-[11px] truncate mb-0.5">
        {data.label}
      </div>

      {/* SubLabel / Meta */}
      {data.subLabel && (
        <div className="text-[9px] text-accent/80 font-mono mb-1 truncate">
          {data.subLabel}
        </div>
      )}

      {/* Preview Snippet */}
      {data.previewText && (
        <div className="text-[10px] text-muted-foreground font-sans line-clamp-2 leading-relaxed bg-background p-1.5 border border-border/60">
          {data.previewText}
        </div>
      )}

      <Handle
        id="right"
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !border-2 !border-background !rounded-none !bg-accent"
      />
      <Handle
        id="bottom"
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !border-2 !border-background !rounded-none !bg-accent"
      />
    </div>
  );
});
