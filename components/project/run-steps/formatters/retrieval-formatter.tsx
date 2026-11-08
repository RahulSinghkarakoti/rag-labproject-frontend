"use client";

import { useState } from "react";
import { Database, FileText, ChevronDown, ChevronUp, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

interface RetrievalFormatterProps {
  data: any;
  variant: "input" | "output";
}

export function RetrievalFormatter({ data, variant }: RetrievalFormatterProps) {
  const [expandedDocs, setExpandedDocs] = useState<Record<number, boolean>>({});

  if (!data) {
    return <div className="text-[11px] text-muted-foreground italic font-mono">// No retrieval data</div>;
  }

  if (variant === "input") {
    let queries: string[] = [];
    if (Array.isArray(data)) {
      queries = data;
    } else if (typeof data === "object" && data !== null) {
      if (Array.isArray(data.queries)) queries = data.queries;
      else if (typeof data.query === "string") queries = [data.query];
      else queries = [JSON.stringify(data)];
    } else if (typeof data === "string") {
      queries = [data];
    }

    return (
      <div className="space-y-2 font-mono">
        <div className="text-[10px] text-muted-foreground uppercase flex items-center gap-1.5 text-accent font-bold">
          <Database className="h-3.5 w-3.5" />
          Execution Search Queries ({queries.length})
        </div>
        <div className="space-y-1.5">
          {queries.map((q, idx) => (
            <div
              key={idx}
              className="p-2 bg-[#12121a] border border-[#2a2a3a] cyber-chamfer-sm text-xs font-sans text-foreground flex items-center gap-2"
            >
              <span className="px-1.5 py-0.5 bg-[#1c1c2e] text-accent text-[10px] font-mono font-bold">
                Q{idx + 1}
              </span>
              <span className="select-text">{q}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Variant: output (Retrieved document chunks)
  let documents: any[] = [];
  if (Array.isArray(data)) {
    documents = data;
  } else if (typeof data === "object" && data !== null) {
    if (Array.isArray(data.retrieved_documents)) documents = data.retrieved_documents;
    else if (Array.isArray(data.documents)) documents = data.documents;
    else if (Array.isArray(data.chunks)) documents = data.chunks;
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
          <Database className="h-3.5 w-3.5" />
          Retrieved Chunks ({documents.length})
        </span>
      </div>

      {documents.length === 0 ? (
        <div className="p-3 bg-[#12121a] border border-[#2a2a3a] text-[11px] text-muted-foreground">
          // No chunks matched the similarity criteria.
        </div>
      ) : (
        <div className="space-y-2">
          {documents.map((doc, idx) => {
            const isExpanded = !!expandedDocs[idx];
            const content =
              typeof doc === "string"
                ? doc
                : doc.content || doc.page_content || doc.text || JSON.stringify(doc);
            const docName =
              doc.name ||
              doc.title ||
              doc.metadata?.document_name ||
              doc.metadata?.source ||
              `Chunk #${idx + 1}`;
            const score = doc.score ?? doc.similarity_score ?? doc.metadata?.score;

            return (
              <div
                key={idx}
                className="bg-[#12121a] border border-[#2a2a3a] cyber-chamfer-sm overflow-hidden text-xs transition-colors hover:border-accent/30"
              >
                <div
                  onClick={() => toggleDoc(idx)}
                  className="p-2.5 flex items-center justify-between cursor-pointer select-none bg-[#161622] border-b border-[#2a2a3a]/60 hover:bg-[#1c1c2e]"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-3.5 w-3.5 text-accent shrink-0" />
                    <span className="font-bold text-foreground truncate max-w-[280px] sm:max-w-md">
                      {docName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {score !== undefined && score !== null && (
                      <span className="px-1.5 py-0.5 bg-accent/10 border border-accent/30 text-accent font-bold text-[10px]">
                        score: {typeof score === "number" ? score.toFixed(4) : score}
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
