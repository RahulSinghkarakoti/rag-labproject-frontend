"use client";

import { Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface GenericDataViewProps {
  data: any;
  selectedItemIndex?: number;
}

export function GenericDataView({ data, selectedItemIndex }: GenericDataViewProps) {
  if (data === null || data === undefined) {
    return <div className="text-[11px] text-muted-foreground italic font-mono">// Empty payload</div>;
  }

  if (typeof data === "string" || typeof data === "number" || typeof data === "boolean") {
    return (
      <div className="p-3 bg-card border border-border cyber-chamfer-sm text-xs font-mono text-foreground select-text">
        {String(data)}
      </div>
    );
  }

  if (Array.isArray(data)) {
    return (
      <div className="space-y-2 font-mono">
        <span className="text-[10px] text-muted-foreground uppercase block font-bold">
          List ({data.length} items)
        </span>
        <div className="space-y-1.5">
          {data.map((item, idx) => {
            const isSelected = selectedItemIndex === idx;
            return (
              <div
                key={idx}
                className={cn(
                  "p-2.5 bg-card border cyber-chamfer-sm text-xs font-mono flex items-start gap-2 transition-all",
                  isSelected
                    ? "border-accent ring-1 ring-accent shadow-sm"
                    : "border-border"
                )}
              >
                <span
                  className={cn(
                    "px-1.5 py-0.5 text-[10px] shrink-0 font-bold",
                    isSelected ? "bg-accent text-accent-foreground" : "bg-secondary text-accent"
                  )}
                >
                  #{idx + 1}
                </span>
                <div className="flex-1 overflow-x-auto select-text">
                  {typeof item === "object" ? JSON.stringify(item, null, 2) : String(item)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Object
  const entries = Object.entries(data);
  return (
    <div className="space-y-2 font-mono">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {entries.map(([key, val]) => (
          <div
            key={key}
            className="p-2.5 bg-card border border-border cyber-chamfer-sm text-xs flex flex-col gap-1"
          >
            <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              {key.replace(/_/g, " ")}:
            </span>
            <div className="text-foreground select-text break-words">
              {typeof val === "object" ? (
                <pre className="text-[10px] overflow-x-auto text-accent/90">{JSON.stringify(val, null, 2)}</pre>
              ) : (
                String(val)
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
