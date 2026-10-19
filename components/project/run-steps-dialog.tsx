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
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-6 gap-4 font-mono">
        <DialogHeader className="border-b border-[#2a2a3a] pb-3 bg-[#12121a]">
          <DialogTitle className="text-base font-bold uppercase tracking-wider flex items-center gap-2 text-accent">
            <Layers className="h-5 w-5 text-accent" />
            &gt; PIPELINE_EXECUTION_STEPS
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground uppercase">
            Inspect RAG pipeline execution trace for active message run.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full bg-[#12121a]" />
            <Skeleton className="h-24 w-full bg-[#12121a]" />
            <Skeleton className="h-24 w-full bg-[#12121a]" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-destructive/40 bg-destructive/10 cyber-chamfer text-destructive">
            <XCircle className="h-8 w-8 mb-2" />
            <p className="text-xs font-bold uppercase">{error}</p>
          </div>
        ) : !runDetails || runDetails.steps.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs uppercase font-mono">
            &gt; NO_EXECUTION_STEPS_RECORDED
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pr-1 space-y-4 font-mono">
            {/* Run Overview Metadata */}
            <div className="flex items-center justify-between p-3 cyber-chamfer-sm bg-[#12121a] border border-[#2a2a3a] text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-muted-foreground uppercase text-[10px]">RUN_ID:</span>
                <span className="font-bold text-accent">{runDetails.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 cyber-chamfer-sm text-[10px] font-bold uppercase border",
                  runDetails.status === "completed" ? "bg-accent/10 text-accent border-accent/40" : "bg-amber-500/10 text-amber-400 border-amber-500/40"
                )}>
                  <CheckCircle2 className="h-3 w-3" />
                  {runDetails.status}
                </span>
                {calculateDuration(runDetails.started_at, runDetails.completed_at) && (
                  <span className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
                    <Clock className="h-3 w-3 text-accent" />
                    {calculateDuration(runDetails.started_at, runDetails.completed_at)}
                  </span>
                )}
              </div>
            </div>

            {/* Stepper List */}
            <div className="space-y-3">
              {runDetails.steps.map((step) => {
                const Icon = STEP_ICONS[step.step_type] || Code2;
                const title = STEP_TITLES[step.step_type] || step.step_type.replace(/_/g, " ");
                const isExpanded = expandedSteps[step.id];

                return (
                  <div
                    key={step.id}
                    className="border border-[#2a2a3a] cyber-chamfer-sm overflow-hidden bg-[#12121a] transition-none"
                  >
                    {/* Header */}
                    <button
                      onClick={() => toggleStep(step.id)}
                      className="w-full flex items-center justify-between p-3.5 hover:bg-[#1c1c2e] transition-none text-left"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 cyber-chamfer-sm bg-accent/10 text-accent">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono text-accent">
                              #{step.sequence}
                            </span>
                            <h4 className="text-xs font-bold uppercase tracking-wider text-foreground">
                              {title}
                            </h4>
                          </div>
                          <p className="text-[10px] text-muted-foreground uppercase">
                            STATUS: {step.status}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 text-accent" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-accent" />
                        )}
                      </div>
                    </button>

                    {/* Step Details Body */}
                    {isExpanded && (
                      <div className="p-3.5 border-t border-[#2a2a3a] bg-[#0a0a0f] space-y-3 text-xs">
                        {/* Input Section */}
                        {step.input && Object.keys(step.input).length > 0 && (
                          <div>
                            <span className="font-bold text-accent uppercase text-[10px] tracking-wider block mb-1">
                              // INPUT_DATA
                            </span>
                            <pre className="p-2.5 cyber-chamfer-sm bg-[#12121a] text-foreground font-mono text-[10px] overflow-x-auto border border-[#2a2a3a]">
                              {JSON.stringify(step.input, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Output Section */}
                        {step.output && Object.keys(step.output).length > 0 && (
                          <div>
                            <span className="font-bold text-accent uppercase text-[10px] tracking-wider block mb-1">
                              // OUTPUT_DATA
                            </span>
                            <pre className="p-2.5 cyber-chamfer-sm bg-[#12121a] text-foreground font-mono text-[10px] overflow-x-auto border border-[#2a2a3a]">
                              {JSON.stringify(step.output, null, 2)}
                            </pre>
                          </div>
                        )}

                        {/* Error Section if failed */}
                        {step.error && (
                          <div>
                            <span className="font-bold text-destructive uppercase text-[10px] tracking-wider block mb-1">
                              // ERROR
                            </span>
                            <pre className="p-2.5 cyber-chamfer-sm bg-destructive/10 text-destructive font-mono text-[10px] overflow-x-auto border border-destructive/20">
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
