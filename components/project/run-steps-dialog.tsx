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
  Workflow,
  ListTree,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThreadStore } from "@/lib/thread-store";
import type { RunDetails, RunStep } from "@/lib/thread-api";
import { RunFlowchartView } from "./run-steps/run-flowchart-view";
import { StepPresentationView } from "./run-steps/step-presentation-view";

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
  const [viewMode, setViewMode] = useState<"flowchart" | "tabs">("flowchart");

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
  const activeStepIdx = activeStep
    ? runDetails?.steps.findIndex((s) => s.id === activeStep.id) ?? -1
    : -1;

  const handleSelectPrev = () => {
    if (runDetails && activeStepIdx > 0) {
      setActiveStepId(runDetails.steps[activeStepIdx - 1].id);
    }
  };

  const handleSelectNext = () => {
    if (runDetails && activeStepIdx >= 0 && activeStepIdx < runDetails.steps.length - 1) {
      setActiveStepId(runDetails.steps[activeStepIdx + 1].id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-7xl w-full max-h-[92vh] h-[88vh] flex flex-col p-6 gap-4 font-mono">
        <DialogHeader className="border-b border-[#2a2a3a] pb-3 bg-[#12121a]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <DialogTitle className="text-base font-bold uppercase tracking-wider flex items-center gap-2 text-accent">
                <Layers className="h-5 w-5 text-accent" />
                &gt; PIPELINE_EXECUTION_TRACE
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground uppercase">
                Dual view inspection of inputs, outputs, and configs for active message run.
              </DialogDescription>
            </div>

            {/* View Mode Toggle Buttons */}
            {runDetails && runDetails.steps.length > 0 && (
              <div className="flex items-center gap-1 p-1 bg-[#0a0a0f] border border-[#2a2a3a] cyber-chamfer-sm shrink-0">
                <button
                  onClick={() => setViewMode("flowchart")}
                  className={cn(
                    "px-3 py-1.5 text-xs flex items-center gap-1.5 font-bold uppercase transition-colors cyber-chamfer-sm",
                    viewMode === "flowchart"
                      ? "bg-accent text-[#0a0a0f]"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#12121a]"
                  )}
                >
                  <Workflow className="h-3.5 w-3.5" />
                  Flowchart View
                </button>
                <button
                  onClick={() => setViewMode("tabs")}
                  className={cn(
                    "px-3 py-1.5 text-xs flex items-center gap-1.5 font-bold uppercase transition-colors cyber-chamfer-sm",
                    viewMode === "tabs"
                      ? "bg-accent text-[#0a0a0f]"
                      : "text-muted-foreground hover:text-foreground hover:bg-[#12121a]"
                  )}
                >
                  <ListTree className="h-3.5 w-3.5" />
                  Tabbed Inspector
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full bg-[#12121a]" />
            <Skeleton className="h-36 w-full bg-[#12121a]" />
            <Skeleton className="h-36 w-full bg-[#12121a]" />
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
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-4 font-mono">
            {/* Run Overview Metadata */}
            <div className="flex items-center justify-between p-3 cyber-chamfer-sm bg-[#12121a] border border-[#2a2a3a] text-xs">
              <div className="flex items-center gap-4 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground uppercase text-[10px]">RUN_ID:</span>
                  <span className="font-bold text-accent">{runDetails.id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                  <span>STEPS:</span>
                  <span className="text-foreground font-bold">{runDetails.steps.length} STAGES</span>
                </div>
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
                        : "text-yellow-500"
                    )}
                  >
                    {runDetails.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                    {runDetails.status === "failed" && <XCircle className="h-3 w-3" />}
                    {runDetails.status}
                  </span>
                </div>
                {runDetails.started_at && runDetails.completed_at && (
                  <span className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
                    <Clock className="h-3 w-3 text-accent" />
                    {calculateDuration(runDetails.started_at, runDetails.completed_at)}
                  </span>
                )}
              </div>
            </div>

            {/* DUAL VIEW CONTENT */}
            {viewMode === "flowchart" ? (
              <RunFlowchartView
                runDetails={runDetails}
                activeStepId={activeStepId}
                onSelectStepId={setActiveStepId}
              />
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col space-y-3 font-mono">
                {/* Step Tabs */}
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

                {/* Presentation view for active tab */}
                {activeStep && (
                  <div className="flex-1 overflow-y-auto pr-1">
                    <StepPresentationView
                      step={activeStep}
                      onSelectPrevStep={handleSelectPrev}
                      onSelectNextStep={handleSelectNext}
                      hasPrev={activeStepIdx > 0}
                      hasNext={activeStepIdx < runDetails.steps.length - 1}
                    />
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
