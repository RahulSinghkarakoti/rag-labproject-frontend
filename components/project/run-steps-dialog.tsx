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
  const [activeStepId, setActiveStepId] = useState<string | null>(null);

  useEffect(() => {
    if (!open || !messageId) {
      setRunDetails(null);
      setError(null);
      setActiveStepId(null);
      return;
    }

    async function fetchSteps() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchRunSteps(messageId!);
        setRunDetails(data);
        if (data.steps && data.steps.length > 0) {
          // Sort steps by sequence if needed, but assuming they come ordered
          setActiveStepId(data.steps[0].id);
        }
      } catch (err: any) {
        setError(err.message || "An error occurred while loading step details.");
      } finally {
        setLoading(false);
      }
    }

    fetchSteps();
  }, [open, messageId, fetchRunSteps]);

  const calculateDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(diff) || diff < 0) return null;
    return `${(diff / 1000).toFixed(2)}s`;
  };

  const activeStep = runDetails?.steps.find((s) => s.id === activeStepId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[90vw] md:max-w-[80vw] lg:max-w-5xl w-full max-h-[85vh] flex flex-col p-6 gap-4 font-mono">
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
          <div className="flex-1 overflow-hidden flex flex-col space-y-4 font-mono">
            {/* Run Overview Metadata */}
            <div className="flex items-center justify-between p-3 cyber-chamfer-sm bg-[#12121a] border border-[#2a2a3a] text-xs">
              <div className="flex items-center gap-2 font-mono">
                <span className="text-muted-foreground uppercase text-[10px]">RUN_ID:</span>
                <span className="font-bold text-accent">{runDetails.id.slice(0, 8)}...</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground uppercase text-[10px]">STATUS:</span>
                  <span
                    className={cn(
                      "uppercase font-bold text-[10px] flex items-center gap-1",
                      runDetails.status === "completed"
                        ? "text-green-500"
                        : runDetails.status === "failed"
                        ? "text-destructive"
                        : "text-yellow-500",
                    )}
                  >
                    {runDetails.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                    {runDetails.status === "failed" && <XCircle className="h-3 w-3" />}
                    {runDetails.status}
                  </span>
                </div>
                {(runDetails.started_at && runDetails.completed_at) && (
                  <span className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
                    <Clock className="h-3 w-3 text-accent" />
                    {calculateDuration(runDetails.started_at, runDetails.completed_at)}
                  </span>
                )}
              </div>
            </div>

            {/* Top Bar Tabs for Steps */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-[#2a2a3a] shrink-0">
              {runDetails.steps.map((step) => {
                const Icon = STEP_ICONS[step.step_type] || Code2;
                const title = STEP_TITLES[step.step_type] || step.step_type.replace(/_/g, " ");
                const isActive = activeStepId === step.id;
                return (
                  <button
                    key={step.id}
                    onClick={() => setActiveStepId(step.id)}
                    className={cn(
                      "px-3 py-2 text-xs flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors shrink-0",
                      isActive
                        ? "border-accent text-accent"
                        : "border-transparent text-muted-foreground hover:text-foreground hover:border-[#2a2a3a]"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="font-bold uppercase">
                      {step.sequence}. {title}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Active Step Content */}
            {activeStep && (
              <div className="flex-1 overflow-y-auto pr-2 space-y-4">
                <div className="flex items-center gap-4 p-3 bg-[#12121a] border border-[#2a2a3a] cyber-chamfer-sm text-xs">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase">Status</span>
                    <span className={cn(
                      "font-bold uppercase",
                      activeStep.status === "completed" ? "text-green-500" : activeStep.status === "failed" ? "text-destructive" : "text-yellow-500"
                    )}>{activeStep.status}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase">Duration</span>
                    <span className="text-foreground">
                      {calculateDuration(activeStep.started_at, activeStep.completed_at) || "-"}
                    </span>
                  </div>
                </div>

                {/* Input Section */}
                {activeStep.input && Object.keys(activeStep.input).length > 0 && (
                  <div>
                    <span className="font-bold text-accent uppercase text-[10px] tracking-wider block mb-1">
                      // INPUT
                    </span>
                    <pre className="p-2.5 cyber-chamfer-sm bg-[#12121a] text-foreground font-mono text-[10px] overflow-x-auto border border-[#2a2a3a]">
                      {JSON.stringify(activeStep.input, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Output Section */}
                {activeStep.output && (
                  <div>
                    <span className="font-bold text-accent uppercase text-[10px] tracking-wider block mb-1">
                      // OUTPUT
                    </span>
                    <pre className="p-2.5 cyber-chamfer-sm bg-[#12121a] text-foreground font-mono text-[10px] overflow-x-auto border border-[#2a2a3a]">
                      {JSON.stringify(activeStep.output, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Config Section */}
                {activeStep.config && Object.keys(activeStep.config).length > 0 && (
                  <div>
                    <span className="font-bold text-accent uppercase text-[10px] tracking-wider block mb-1">
                      // CONFIG
                    </span>
                    <pre className="p-2.5 cyber-chamfer-sm bg-[#12121a] text-foreground font-mono text-[10px] overflow-x-auto border border-[#2a2a3a]">
                      {JSON.stringify(activeStep.config, null, 2)}
                    </pre>
                  </div>
                )}

                {/* Error Section */}
                {activeStep.error && (
                  <div>
                    <span className="font-bold text-destructive uppercase text-[10px] tracking-wider block mb-1">
                      // ERROR
                    </span>
                    <pre className="p-2.5 cyber-chamfer-sm bg-destructive/10 text-destructive font-mono text-[10px] overflow-x-auto border border-destructive/20">
                      {JSON.stringify(activeStep.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
