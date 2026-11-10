"use client";

import { useState } from "react";
import { Filter, FileText, ChevronDown, ChevronUp, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface RerankingFormatterProps {
  data: any;
  variant: "input" | "output";
  selectedItemIndex?: number;
}

export function RerankingFormatter({ data, variant, selectedItemIndex }: RerankingFormatterProps) {
  const [expandedDocs, setExpandedDocs] = useState<Record<number, boolean>>({});

  if (!data) {
    return <div className="text-[11px] text-muted-foreground italic font-mono">// No reranking data</div>;
  }

  if (variant === "input") {
    const docCount =
      typeof data === "object" && data !== null
        ? data.document_count ?? data.candidates_count ?? (Array.isArray(data.documents) ? data.documents.length : null)
        : null;
    const queries =
      typeof data === "object" && data !== null
        ? data.queries || (data.query ? [data.query] : [])
        : [];

    return (
      <div className="space-y-2 font-mono">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
          <span className="flex items-center gap-1.5 text-accent font-bold">
            <Filter className="h-3.5 w-3.5" />
            Input Candidates for Reranking
          </span>
          {docCount !== null && (
            <span className="px-2 py-0.5 bg-secondary text-accent font-bold text-[10px]">
              {docCount} Candidates Evaluated
            </span>
          )}
        </div>
        {queries.length > 0 && (
          <div className="p-2.5 bg-card border border-border cyber-chamfer-sm text-xs space-y-1">
            <span className="text-[10px] text-muted-foreground uppercase block font-bold">Reranking Targets:</span>
            {queries.map((q: string, i: number) => (
              <p key={i} className="text-foreground font-sans text-xs">• {q}</p>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Variant: output (Reranked candidate documents)
  let documents: any[] = [];
  if (Array.isArray(data)) {
    documents = data;
  } else if (typeof data === "object" && data !== null) {
    if (Array.isArray(data.reranked_documents)) documents = data.reranked_documents;
    else if (Array.isArray(data.documents)) documents = data.documents;
    else if (Array.isArray(data.result)) documents = data.result;
    else documents = [data];
  }

  const toggleDoc = (index: number) => {
    setExpandedDocs((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <div className="space-y-2.5 font-mono">
      <div className="flex items-center justify-between text-[10px] text-muted-foreground uppercase">
        <span className="flex items-center gap-1 text-accent font-bold">
          <Award className="h-3.5 w-3.5" />
          Reranked Top Candidates ({documents.length})
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="p-3 bg-card border border-border text-[11px] text-muted-foreground">
          // No reranked documents returned.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc, idx) => {
            const isSelected = selectedItemIndex === idx;
            const isExpanded = isSelected || !!expandedDocs[idx];
            const content =
              typeof doc === "string"
                ? doc
                : doc.content || doc.page_content || doc.text || JSON.stringify(doc);
            const docName =
              doc.name ||
              doc.title ||
              doc.metadata?.document_name ||
              `Ranked Candidate #${idx + 1}`;
            const rerankScore =
              doc.rerank_score ?? doc.score ?? doc.relevance_score ?? doc.metadata?.rerank_score;

            return (
              <div
                key={idx}
                className={cn(
                  "bg-card border cyber-chamfer-sm overflow-hidden text-xs transition-all",
                  isSelected
                    ? "border-accent ring-1 ring-accent shadow-sm"
                    : "border-border hover:border-accent/30"
                )}
              >
                <div
                  onClick={() => toggleDoc(idx)}
                  className="p-2.5 flex items-center justify-between cursor-pointer select-none bg-muted/40 border-b border-border/60 hover:bg-muted"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="px-1.5 py-0.5 bg-accent text-accent-foreground font-bold text-[10px]">
                      #{idx + 1}
                    </span>
                    <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="font-bold text-foreground truncate max-w-60 sm:max-w-md">
                      {docName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {rerankScore !== undefined && rerankScore !== null && (
                      <span className="px-1.5 py-0.5 bg-accent/10 border border-accent/40 text-accent font-bold text-[10px]">
                        rerank: {typeof rerankScore === "number" ? rerankScore.toFixed(4) : rerankScore}
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground uppercase flex items-center gap-0.5">
                      {isExpanded ? (
                        <>
                          Less <ChevronUp className="h-3 w-3" />
                        </>
                      ) : (
                        <>
                          More <ChevronDown className="h-3 w-3" />
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-3">
                  <p
                    className={cn(
                      "font-sans text-xs text-foreground/90 leading-relaxed whitespace-pre-wrap select-text",
                      !isExpanded && "line-clamp-3"
                    )}
                  >
                    {content}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
