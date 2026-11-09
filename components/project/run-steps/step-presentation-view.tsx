"use client";

import { useState } from "react";
import {
  Code2,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  SlidersHorizontal,
  ArrowRight,
  ArrowLeft,
  AlertTriangle,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { RunStep } from "@/lib/thread-api";
import { ConfigBadges } from "./formatters/config-badges";
import { QueryFormatter } from "./formatters/query-formatter";
import { RetrievalFormatter } from "./formatters/retrieval-formatter";
import { RerankingFormatter } from "./formatters/reranking-formatter";
import { GenerationFormatter } from "./formatters/generation-formatter";
import { GenericDataView } from "./formatters/generic-data-view";

interface StepPresentationViewProps {
  step: RunStep;
  focusSection?: "all" | "input" | "output" | "config";
  selectedItemIndex?: number;
  onSelectPrevStep?: () => void;
  onSelectNextStep?: () => void;
  hasPrev?: boolean;
  hasNext?: boolean;
}

export function StepPresentationView({
  step,
  focusSection = "all",
  selectedItemIndex,
  onSelectPrevStep,
  onSelectNextStep,
  hasPrev = false,
  hasNext = false,
}: StepPresentationViewProps) {
  // Mode toggles: false = formatted presentation, true = raw JSON
  const [rawInput, setRawInput] = useState(false);
  const [rawOutput, setRawOutput] = useState(false);
  const [rawConfig, setRawConfig] = useState(false);

  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopy = (text: string, sectionName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionName);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const calculateDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(diff) || diff < 0) return null;
    return `${(diff / 1000).toFixed(2)}s`;
  };

  const duration = calculateDuration(step.started_at, step.completed_at);

  const renderDataView = (data: any, variant: "input" | "output") => {
    const type = step.step_type.toLowerCase();
    const itemIdx = variant === "output" ? selectedItemIndex : undefined;

    if (type.includes("transformation") || type.includes("query")) {
      return <QueryFormatter data={data} variant={variant} selectedItemIndex={itemIdx} />;
    }
    if (type.includes("retrieval")) {
      return <RetrievalFormatter data={data} variant={variant} selectedItemIndex={itemIdx} />;
    }
    if (type.includes("reranking")) {
      return <RerankingFormatter data={data} variant={variant} selectedItemIndex={itemIdx} />;
    }
    if (type.includes("generation")) {
      return <GenerationFormatter data={data} variant={variant} />;
    }

    return <GenericDataView data={data} selectedItemIndex={itemIdx} />;
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Step Status & Quick Nav Bar */}
      <div className="flex items-center justify-between p-3 bg-card border border-border cyber-chamfer-sm text-xs">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase">STAGE:</span>
            <span className="font-bold text-accent uppercase">
              #{step.sequence} {step.step_type.replace(/_/g, " ")}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase">STATUS:</span>
            <span
              className={cn(
                "uppercase font-bold text-[10px] flex items-center gap-1",
                step.status === "completed"
                  ? "text-green-500"
                  : step.status === "failed"
                  ? "text-destructive"
                  : step.status === "cancelled"
                  ? "text-amber-500"
                  : "text-yellow-500"
              )}
            >
              {step.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
              {step.status === "failed" && <XCircle className="h-3 w-3" />}
              {step.status === "cancelled" && <Ban className="h-3 w-3" />}
              {step.status}
            </span>
          </div>

          {duration && (
            <div className="flex items-center gap-1 text-muted-foreground text-[10px]">
              <Clock className="h-3 w-3 text-accent" />
              <span>{duration}</span>
            </div>
          )}
        </div>

        {(onSelectPrevStep || onSelectNextStep) && (
          <div className="flex items-center gap-1">
            <button
              onClick={onSelectPrevStep}
              disabled={!hasPrev}
              className="p-1 px-2 border border-border bg-secondary hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-1 transition-colors"
              title="Previous Step"
            >
              <ArrowLeft className="h-3 w-3" />
              Prev
            </button>
            <button
              onClick={onSelectNextStep}
              disabled={!hasNext}
              className="p-1 px-2 border border-border bg-secondary hover:bg-muted disabled:opacity-30 disabled:pointer-events-none text-muted-foreground hover:text-foreground text-[10px] flex items-center gap-1 transition-colors"
              title="Next Step"
            >
              Next
              <ArrowRight className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>

      {/* INPUT SECTION */}
      {step.input && Object.keys(step.input).length > 0 && (focusSection === "all" || focusSection === "input") && (
        <div
          className={cn(
            "p-3.5 bg-card/90 border cyber-chamfer-sm transition-colors",
            focusSection === "input" ? "border-accent ring-1 ring-accent" : "border-border"
          )}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="font-bold text-accent uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-accent inline-block" />
              // INPUT (WHAT WENT IN)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRawInput(!rawInput)}
                className="px-2 py-0.5 text-[10px] uppercase font-bold border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {rawInput ? <Eye className="h-2.5 w-2.5" /> : <Code2 className="h-2.5 w-2.5" />}
                {rawInput ? "Presentation" : "Raw JSON"}
              </button>
              <button
                onClick={() => handleCopy(JSON.stringify(step.input, null, 2), "input")}
                className="p-1 px-1.5 text-[10px] border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title="Copy Input JSON"
              >
                {copiedSection === "input" ? <Check className="h-2.5 w-2.5 text-accent" /> : <Copy className="h-2.5 w-2.5" />}
              </button>
            </div>
          </div>

          {rawInput ? (
            <pre className="p-2.5 cyber-chamfer-sm bg-background text-foreground font-mono text-[10px] overflow-x-auto border border-border">
              {JSON.stringify(step.input, null, 2)}
            </pre>
          ) : (
            renderDataView(step.input, "input")
          )}
        </div>
      )}

      {/* CONFIG SECTION */}
      {step.config && Object.keys(step.config).length > 0 && (focusSection === "all" || focusSection === "config") && (
        <div
          className={cn(
            "p-3.5 bg-card/90 border cyber-chamfer-sm transition-colors",
            focusSection === "config" ? "border-accent ring-1 ring-accent" : "border-border"
          )}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="font-bold text-accent uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <SlidersHorizontal className="h-3 w-3 text-accent" />
              // CONFIGURATION (PARAMETERS USED)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRawConfig(!rawConfig)}
                className="px-2 py-0.5 text-[10px] uppercase font-bold border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {rawConfig ? <Eye className="h-2.5 w-2.5" /> : <Code2 className="h-2.5 w-2.5" />}
                {rawConfig ? "Presentation" : "Raw JSON"}
              </button>
              <button
                onClick={() => handleCopy(JSON.stringify(step.config, null, 2), "config")}
                className="p-1 px-1.5 text-[10px] border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title="Copy Config JSON"
              >
                {copiedSection === "config" ? <Check className="h-2.5 w-2.5 text-accent" /> : <Copy className="h-2.5 w-2.5" />}
              </button>
            </div>
          </div>

          {rawConfig ? (
            <pre className="p-2.5 cyber-chamfer-sm bg-background text-foreground font-mono text-[10px] overflow-x-auto border border-border">
              {JSON.stringify(step.config, null, 2)}
            </pre>
          ) : (
            <ConfigBadges config={step.config} />
          )}
        </div>
      )}

      {/* OUTPUT SECTION */}
      {step.output && (focusSection === "all" || focusSection === "output") && (
        <div
          className={cn(
            "p-3.5 bg-card/90 border cyber-chamfer-sm transition-colors",
            focusSection === "output" ? "border-accent ring-1 ring-accent" : "border-border"
          )}
        >
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-border">
            <span className="font-bold text-accent uppercase text-[10px] tracking-wider flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-accent inline-block" />
              // OUTPUT (WHAT CAME OUT)
            </span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setRawOutput(!rawOutput)}
                className="px-2 py-0.5 text-[10px] uppercase font-bold border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                {rawOutput ? <Eye className="h-2.5 w-2.5" /> : <Code2 className="h-2.5 w-2.5" />}
                {rawOutput ? "Presentation" : "Raw JSON"}
              </button>
              <button
                onClick={() => handleCopy(JSON.stringify(step.output, null, 2), "output")}
                className="p-1 px-1.5 text-[10px] border border-border bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
                title="Copy Output JSON"
              >
                {copiedSection === "output" ? <Check className="h-2.5 w-2.5 text-accent" /> : <Copy className="h-2.5 w-2.5" />}
              </button>
            </div>
          </div>

          {rawOutput ? (
            <pre className="p-2.5 cyber-chamfer-sm bg-background text-foreground font-mono text-[10px] overflow-x-auto border border-border">
              {JSON.stringify(step.output, null, 2)}
            </pre>
          ) : (
            renderDataView(step.output, "output")
          )}
        </div>
      )}

      {/* ERROR SECTION */}
      {step.error && (
        <div className="p-3.5 bg-destructive/10 border border-destructive/40 cyber-chamfer-sm text-destructive">
          <div className="flex items-center gap-2 pb-2 mb-2 border-b border-destructive/20 font-bold uppercase text-[10px]">
            <AlertTriangle className="h-3.5 w-3.5" />
            // ERROR OCCURRED IN THIS STAGE
          </div>
          <pre className="p-2.5 bg-destructive/15 text-destructive font-mono text-[10px] overflow-x-auto border border-destructive/20">
            {JSON.stringify(step.error, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
