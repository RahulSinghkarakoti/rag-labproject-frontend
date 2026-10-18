"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Code2,
  Cpu,
  Database,
  Filter,
  Layers,
  Sparkles,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThreadStore } from "@/lib/thread-store";
import type { RunDetails, RunStep } from "@/lib/thread-api";

export type { RunDetails, RunStep };

interface RunStepsDialogProps {
  messageId?: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEP_ICONS: Record<string, any> = {
  query_transformation: Sparkles,
  transformation: Sparkles,
  retrieval: Database,
  reranking: Filter,
  generation: Cpu,
  context: Layers,
};

const STEP_TITLES: Record<string, string> = {
  query_transformation: "Query Transformation",
  transformation: "Query Transformation",
  retrieval: "Knowledge Retrieval",
  reranking: "Candidate Reranking",
  context: "Context Assembly",
  generation: "LLM Generation",
};

export function RunStepsDialog({
  messageId,
  open,
  onOpenChange,
}: RunStepsDialogProps) {
  const fetchRunSteps = useThreadStore((state) => state.fetchRunSteps);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<RunDetails | null>(null);
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!open || !messageId) {
      setRunDetails(null);
      setError(null);
      return;
    }

    async function fetchSteps() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRunSteps(messageId!);
        setRunDetails(data);
        // Expand all steps by default
        const initialExpanded: Record<string, boolean> = {};
        data.steps?.forEach((step: RunStep) => {
          initialExpanded[step.id] = true;
        });
        setExpandedSteps(initialExpanded);
      } catch (err: any) {
        setError(err.message || "An error occurred while loading step details.");
      } finally {
        setLoading(false);
      }
    }

    fetchSteps();
  }, [open, messageId, fetchRunSteps]);

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const calculateDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(diff) || diff < 0) return null;
    return `${(diff / 1000).toFixed(2)}s`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 gap-4">
        <DialogHeader className="border-b pb-3">
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Pipeline Execution Steps
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Inspect each stage of the RAG pipeline run for this message.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-destructive/20 bg-destructive/5 rounded-lg text-destructive">
            <XCircle className="h-8 w-8 mb-2" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        ) : !runDetails || runDetails.steps.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No execution steps recorded for this message.
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {/* Run Overview Metadata */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-muted/40 border text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-muted-foreground">Run ID:</span>
                <span className="font-semibold">{runDetails.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium capitalize",
                  runDetails.status === "completed" ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" : "bg-amber-500/10 text-amber-600 border border-amber-500/20"
                )}>
                  <CheckCircle2 className="h-3 w-3" />
                  {runDetails.status}
                </span>
                {calculateDuration(runDetails.started_at, runDetails.completed_at) && (
                  <span className="flex items-center gap-1 text-muted-foreground font-mono">
                    <Clock className="h-3 w-3" />
                    {calculateDuration(runDetails.started_at, runDetails.completed_at)}
                  </span>
                )}
              </div>
            </div>

            {/* Stepper List */}
            <div className="space-y-3">
              {runDetails.steps.map((step, idx) => {
                const Icon = STEP_ICONS[step.step_type] || Code2;
                const title = STEP_TITLES[step.step_type] || step.step_type.replace(/_/g, " ");
                const isExpanded = expandedSteps[step.id];
                const duration = calculateDuration(step.started_at, step.completed_at);

                return (
                  <div
                    key={step.id}
                    className="border rounded-xl overflow-hidden bg-card transition-all"
                  >
                    {/* Header */}
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-muted/50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-muted-foreground">
                              #{step.sequence}
                            </span>
                            <h4 className="text-sm font-semibold capitalize">
                              {title}
                            </h4>
                          </div>
                          <p className="text-[11px] text-muted-foreground capitalize">
                            Status: {step.status}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* {duration && (
                          <span className="text-xs text-muted-foreground font-mono">
                            {duration}
                          </span>
                        )} */}
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </button>

                    {/* Step Details Body */}
                    {isExpanded && (
                      <div className="p-3.5 border-t bg-muted/20 space-y-3 text-xs">
                        {/* Input Section */}
                        {step.input && Object.keys(step.input).length > 0 && (
                          <div>
                            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1">
                              Input Data
                            </span>
                            <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto border">
                              {JSON.stringify(step.input, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Output Section */}
                        {step.output && Object.keys(step.output).length > 0 && (
                          <div>
                            <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider block mb-1">
                              Output Data
                            </span>
                            <pre className="p-2.5 rounded-lg bg-slate-950 text-slate-100 font-mono text-[11px] overflow-x-auto border">
                              {JSON.stringify(step.output, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Error Section if failed */}
                        {step.error && (
                          <div>
                            <span className="font-semibold text-destructive uppercase text-[10px] tracking-wider block mb-1">
                              Error
                            </span>
                            <pre className="p-2.5 rounded-lg bg-destructive/10 text-destructive font-mono text-[11px] overflow-x-auto border border-destructive/20">
                              {JSON.stringify(step.error, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
