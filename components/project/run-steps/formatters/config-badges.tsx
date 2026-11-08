"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfigBadgesProps {
  config: Record<string, any> | null | undefined;
  className?: string;
}

const FRIENDLY_LABELS: Record<string, string> = {
  mode: "Transformation Mode",
  query_count: "Query Count",
  include_original: "Include Original",
  strategy: "Retrieval Strategy",
  alpha: "Hybrid Alpha",
  top_k: "Top K",
  fetch_k: "Fetch K",
  similarity_threshold: "Similarity Threshold",
  mmr_lambda: "MMR Lambda",
  sparse_model: "Sparse Index",
  dense_model: "Dense Embedding",
  enabled: "Reranker Active",
  model: "Reranker Model",
  top_n: "Top N Candidates",
  batch_size: "Batch Size",
  score_threshold: "Score Threshold",
  provider: "LLM Provider",
  llm_model: "Model Name",
  temperature: "Temperature",
  max_tokens: "Max Tokens",
  citation_enforced: "Citation Enforced",
};

export function ConfigBadges({ config, className }: ConfigBadgesProps) {
  if (!config || typeof config !== "object" || Object.keys(config).length === 0) {
    return (
      <div className="text-[11px] text-muted-foreground uppercase font-mono italic">
        // No explicit config provided for this stage.
      </div>
    );
  }

  // Flatten nested objects if any
  const flattened: [string, any][] = [];
  function extract(obj: Record<string, any>, prefix = "") {
    for (const [key, val] of Object.entries(obj)) {
      if (val !== null && typeof val === "object" && !Array.isArray(val)) {
        extract(val, `${prefix}${key}.`);
      } else {
        flattened.push([`${prefix}${key}`, val]);
      }
    }
  }
  extract(config);

  return (
    <div className={cn("flex flex-wrap gap-2 font-mono", className)}>
      {flattened.map(([key, value]) => {
        const cleanKey = key.split(".").pop() || key;
        const label = FRIENDLY_LABELS[cleanKey] || cleanKey.replace(/_/g, " ");
        let displayVal = String(value);

        if (typeof value === "boolean") {
          displayVal = value ? "ENABLED" : "DISABLED";
        } else if (value === null || value === undefined) {
          displayVal = "DEFAULT";
        }

        return (
          <div
            key={key}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#12121a] border border-[#2a2a3a] cyber-chamfer-sm text-[11px]"
            title={`${label}: ${displayVal}`}
          >
            <SlidersHorizontal className="h-3 w-3 text-accent shrink-0" />
            <span className="text-muted-foreground uppercase text-[10px]">{label}:</span>
            <span
              className={cn(
                "font-bold",
                typeof value === "boolean"
                  ? value
                    ? "text-accent"
                    : "text-muted-foreground"
                  : "text-foreground"
              )}
            >
              {displayVal}
            </span>
          </div>
        );
      })}
    </div>
  );
}
