"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Brain,
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
  Maximize2,
  Minimize2,
  XCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useThreadStore, isUuid } from "@/lib/thread-store";
import { threadApi, type RunDetails, type RunStep } from "@/lib/thread-api";
import { RunFlowchartView } from "./run-steps/run-flowchart-view";
import { StepPresentationView } from "./run-steps/step-presentation-view";

export type { RunDetails, RunStep };

interface RunStepsDialogProps {
  messageId?: string | null;
  runId?: string | null;
  isRunning?: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STEP_ICONS: Record<string, any> = {
  memory: Brain,
  query_transformation: Sparkles,
  transformation: Sparkles,
  retrieval: Database,
  reranking: Filter,
  generation: Cpu,
  context: Layers,
};

const STEP_TITLES: Record<string, string> = {
  memory: "Conversation Memory",
  query_transformation: "Query Transformation",
  transformation: "Query Transformation",
  retrieval: "Knowledge Retrieval",
  reranking: "Candidate Reranking",
  context: "Context Assembly",
  generation: "LLM Generation",
};

export function RunStepsDialog({
  messageId,
  runId,
  isRunning = false,
  open,
  onOpenChange,
}: RunStepsDialogProps) {
  const fetchRunSteps = useThreadStore((state) => state.fetchRunSteps);
  const liveRuns = useThreadStore((state) => state.liveRuns);
  const activeLiveRunId = useThreadStore((state) => state.activeLiveRunId);
  const messageIdMap = useThreadStore((state) => state.messageIdMap);

  const liveRun = useMemo(() => {
    if (runId && liveRuns[runId]) {
      return liveRuns[runId];
    }
    if (messageId) {
      const match = Object.values(liveRuns).find(
        (r) => r.input_message_id === messageId || r.output_message_id === messageId
      );
      if (match) return match;

      const mappedId = messageIdMap[messageId];
      if (mappedId) {
        const mappedMatch = Object.values(liveRuns).find(
          (r) => r.input_message_id === mappedId || r.output_message_id === mappedId
        );
        if (mappedMatch) return mappedMatch;
      }
    }
    if (activeLiveRunId && liveRuns[activeLiveRunId]) {
      return liveRuns[activeLiveRunId];
    }
    return null;
  }, [liveRuns, activeLiveRunId, messageIdMap, messageId, runId]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [runDetails, setRunDetails] = useState<RunDetails | null>(null);
  const [activeStepId, setActiveStepId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"flowchart" | "tabs">("flowchart");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const userSelectedStepRef = useRef(false);

  // Use live run telemetry when actively running; otherwise prefer fetched authoritative DB details
  const effectiveRunDetails = isRunning
    ? (liveRun ?? runDetails)
    : (runDetails ?? liveRun);

  // Auto-select active or latest step as live run steps stream in
  useEffect(() => {
    if (!open) {
      userSelectedStepRef.current = false;
      return;
    }
    if (effectiveRunDetails?.steps && effectiveRunDetails.steps.length > 0) {
      if (!userSelectedStepRef.current) {
        const running = effectiveRunDetails.steps.find((s) => s.status === "running");
        const target = running ?? effectiveRunDetails.steps[effectiveRunDetails.steps.length - 1];
        if (target && target.id !== activeStepId) {
          setActiveStepId(target.id);
        }
      }
    }
  }, [open, effectiveRunDetails?.steps, activeStepId]);

  // Live timer for currently running execution
  const [liveElapsed, setLiveElapsed] = useState<string | null>(null);
  useEffect(() => {
    if (!open || effectiveRunDetails?.status !== "running" || !effectiveRunDetails?.started_at) {
      setLiveElapsed(null);
      return;
    }
    const updateElapsed = () => {
      const diff = Date.now() - new Date(effectiveRunDetails.started_at!).getTime();
      if (!isNaN(diff) && diff >= 0) {
        setLiveElapsed(`${(diff / 1000).toFixed(1)}s`);
      }
    };
    updateElapsed();
    const interval = setInterval(updateElapsed, 200);
    return () => clearInterval(interval);
  }, [open, effectiveRunDetails?.status, effectiveRunDetails?.started_at]);

  const fetchSteps = useCallback(
    async (force = false) => {
      // If not forcing refresh, and we already have live steps while running, skip REST fetch
      if (!force && isRunning && liveRun?.steps && liveRun.steps.length > 0) {
        setLoading(false);
        setError(null);
        return;
      }

      // If message is actively running and no runId yet, live telemetry will stream in
      if (!force && isRunning && !runId) {
        setLoading(false);
        setError(null);
        return;
      }

      const targetRunId = runId && isUuid(runId) ? runId : null;
      const targetMsgId = messageId && isUuid(messageId) ? messageId : null;

      if (!targetRunId && !targetMsgId) {
        // If we don't have valid UUIDs and message is running, wait for live telemetry
        if (isRunning) {
          setLoading(false);
          setError(null);
          return;
        }
        setLoading(false);
        setError("Execution trace is not available for this message.");
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let data: RunDetails | null = null;
        if (targetRunId) {
          try {
            data = await threadApi.runDetails(targetRunId);
          } catch (runErr) {
            if (targetMsgId) {
              data = await threadApi.runSteps(targetMsgId);
            } else {
              throw runErr;
            }
          }
        } else if (targetMsgId) {
          data = await threadApi.runSteps(targetMsgId);
        }

        if (data) {
          setRunDetails(data);
          if (data.steps && data.steps.length > 0) {
            setActiveStepId((prev) => (prev ? prev : data.steps[0].id));
          }
        } else {
          setError("No execution steps found for this message.");
        }
      } catch (err: any) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          "An error occurred while loading step details.";
        if (errorMsg.toLowerCase().includes("not found") || err?.status === 404) {
          setError("No execution steps found for this message.");
        } else if (
          errorMsg.toLowerCase().includes("validation") ||
          err?.status === 422 ||
          err?.code === "VALIDATION_ERROR"
        ) {
          setError("Execution trace is not available for this message.");
        } else {
          setError(errorMsg);
        }
      } finally {
        setLoading(false);
      }
    },
    [liveRun?.steps, isRunning, runId, messageId]
  );

  useEffect(() => {
    if (!open) {
      setRunDetails(null);
      setError(null);
      setActiveStepId(null);
      setIsFullscreen(false);
      userSelectedStepRef.current = false;
      return;
    }

    void fetchSteps();
  }, [open, fetchSteps]);

  const calculateDuration = (start?: string | null, end?: string | null) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    if (isNaN(diff) || diff < 0) return null;
    return `${(diff / 1000).toFixed(2)}s`;
  };

  const activeStep = effectiveRunDetails?.steps.find((s) => s.id === activeStepId);
  const activeStepIdx = activeStep
    ? effectiveRunDetails?.steps.findIndex((s) => s.id === activeStep.id) ?? -1
    : -1;

  const handleSelectPrev = () => {
    if (effectiveRunDetails && activeStepIdx > 0) {
      userSelectedStepRef.current = true;
      setActiveStepId(effectiveRunDetails.steps[activeStepIdx - 1].id);
    }
  };

  const handleSelectNext = () => {
    if (effectiveRunDetails && activeStepIdx >= 0 && activeStepIdx < effectiveRunDetails.steps.length - 1) {
      userSelectedStepRef.current = true;
      setActiveStepId(effectiveRunDetails.steps[activeStepIdx + 1].id);
    }
  };

  // Allow ESC to exit fullscreen mode before closing the dialog
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFullscreen) {
        e.preventDefault();
        e.stopPropagation();
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      window.addEventListener("keydown", handleKeyDown, { capture: true });
      return () => window.removeEventListener("keydown", handleKeyDown, { capture: true });
    }
  }, [isFullscreen]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex flex-col p-4 sm:p-6 gap-3 sm:gap-4 font-mono transition-all duration-200",
          isFullscreen

            ? "fixed inset-0 !top-0 !left-0 !translate-x-0 !translate-y-0 !w-screen !h-screen !max-w-none !max-h-none sm:!max-w-none md:!max-w-none lg:!max-w-none !rounded-none !border-0"
            : "sm:max-w-[95vw] md:max-w-[92vw] lg:max-w-7xl w-full max-h-[92vh] h-[88vh]"
        )}
      >
        <DialogHeader className="border-b border-border pb-3 bg-card">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pr-8">
            <div>
              <DialogTitle className="text-base font-bold uppercase tracking-wider flex items-center gap-2 text-accent">
                <Layers className="h-5 w-5 text-accent" />
                &gt; PIPELINE_EXECUTION_TRACE
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground uppercase">
                Dual view inspection of inputs, outputs, and configs for active message run.
              </DialogDescription>
            </div>

            {/* View Mode Toggle & Fullscreen Controls */}
            <div className="flex items-center gap-2 shrink-0">
              {effectiveRunDetails && effectiveRunDetails.steps.length > 0 && (
                <div className="flex items-center gap-1 p-1 bg-background border border-border cyber-chamfer-sm shrink-0">
                  <button
                    onClick={() => setViewMode("flowchart")}
                    className={cn(
                      "px-3 py-1.5 text-xs flex items-center gap-1.5 font-bold uppercase transition-colors cyber-chamfer-sm",
                      viewMode === "flowchart"
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
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
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                    )}
                  >
                    <ListTree className="h-3.5 w-3.5" />
                    Tabbed Inspector
                  </button>
                </div>
              )}

              <button
                onClick={() => void fetchSteps(true)}
                disabled={loading}
                className="px-2.5 py-2 text-xs flex items-center gap-1.5 font-bold uppercase transition-colors cyber-chamfer-sm border border-border bg-background text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50"
                title="Refresh execution steps from database"
                aria-label="Refresh execution steps"
              >
                <RefreshCw className={cn("h-3.5 w-3.5", loading && "animate-spin text-accent")} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setIsFullscreen((prev) => !prev)}
                className={cn(
                  "px-2.5 py-2 text-xs flex items-center gap-1.5 font-bold uppercase transition-colors cyber-chamfer-sm border border-border",
                  isFullscreen
                    ? "bg-accent text-accent-foreground border-accent"
                    : "bg-background text-muted-foreground hover:text-foreground hover:bg-secondary"
                )}
                title={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
                aria-label={isFullscreen ? "Exit Fullscreen" : "Toggle Fullscreen"}
              >
                {isFullscreen ? (
                  <>
                    <Minimize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Exit</span>
                  </>
                ) : (
                  <>
                    <Maximize2 className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Fullscreen</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-12 w-full bg-secondary" />
            <Skeleton className="h-36 w-full bg-secondary" />
            <Skeleton className="h-36 w-full bg-secondary" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center border border-border/40 bg-muted/20 cyber-chamfer space-y-2">
            <Layers className="h-8 w-8 mb-1 text-muted-foreground/60" />
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono">
              [EXECUTION TRACE NOT AVAILABLE FOR THIS MESSAGE]
            </p>
            <p className="text-[11px] text-muted-foreground/80 font-mono">
              {error.toLowerCase().includes("validation") || error.toLowerCase().includes("invalid")
                ? "Live execution trace telemetry is initializing or not associated with a persistent run."
                : error}
            </p>
          </div>
        ) : (isRunning || effectiveRunDetails?.status === "running") && (!effectiveRunDetails || effectiveRunDetails.steps.length === 0) ? (
          <div className="flex flex-col items-center justify-center p-12 text-center text-accent text-xs uppercase font-mono space-y-3">
            <Loader2 className="h-6 w-6 animate-spin text-accent" />
            <p className="font-bold tracking-wider">&gt; INITIALIZING_PIPELINE_RUN...</p>
            <p className="text-[10px] text-muted-foreground">Awaiting live stage telemetry from backend</p>
          </div>
        ) : !effectiveRunDetails || effectiveRunDetails.steps.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs uppercase font-mono">
            &gt; NO_EXECUTION_STEPS_RECORDED
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden flex flex-col space-y-4 font-mono">
            {/* Run Overview Metadata */}
            <div className="flex items-center justify-between p-3 cyber-chamfer-sm bg-card border border-border text-xs">
              <div className="flex items-center gap-4 font-mono">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground uppercase text-[10px]">RUN_ID:</span>
                  <span className="font-bold text-accent">{effectiveRunDetails.id.slice(0, 8)}...</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground text-[10px]">
                  <span>STEPS:</span>
                  <span className="text-foreground font-bold">{effectiveRunDetails.steps.length} STAGES</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground uppercase text-[10px]">STATUS:</span>
                  <span
                    className={cn(
                      "uppercase font-bold text-[10px] flex items-center gap-1",
                      effectiveRunDetails.status === "completed"
                        ? "text-green-500"
                        : effectiveRunDetails.status === "failed"
                        ? "text-destructive"
                        : effectiveRunDetails.status === "running"
                        ? "text-yellow-400 animate-pulse"
                        : "text-yellow-500"
                    )}
                  >
                    {effectiveRunDetails.status === "running" && (
                      <Loader2 className="h-3 w-3 animate-spin text-yellow-400" />
                    )}
                    {effectiveRunDetails.status === "completed" && <CheckCircle2 className="h-3 w-3" />}
                    {effectiveRunDetails.status === "failed" && <XCircle className="h-3 w-3" />}
                    {effectiveRunDetails.status === "running" ? "RUNNING (LIVE)" : effectiveRunDetails.status}
                  </span>
                </div>
                {effectiveRunDetails.status === "running" && liveElapsed && (
                  <span className="flex items-center gap-1 text-yellow-400 font-mono text-[10px]">
                    <Clock className="h-3 w-3" />
                    {liveElapsed}
                  </span>
                )}
                {effectiveRunDetails.status !== "running" && effectiveRunDetails.started_at && effectiveRunDetails.completed_at && (
                  <span className="flex items-center gap-1 text-muted-foreground font-mono text-[10px]">
                    <Clock className="h-3 w-3 text-accent" />
                    {calculateDuration(effectiveRunDetails.started_at, effectiveRunDetails.completed_at)}
                  </span>
                )}
              </div>
            </div>

            {/* DUAL VIEW CONTENT */}
            {viewMode === "flowchart" ? (
              <RunFlowchartView
                runDetails={effectiveRunDetails}
                activeStepId={activeStepId}
                onSelectStepId={(id) => {
                  userSelectedStepRef.current = true;
                  setActiveStepId(id);
                }}
                isFullscreen={isFullscreen}
                onToggleFullscreen={() => setIsFullscreen((prev) => !prev)}
              />
            ) : (
              <div className="flex-1 overflow-hidden flex flex-col space-y-3 font-mono">
                {/* Step Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border shrink-0">
                  {effectiveRunDetails.steps.map((step) => {
                    const Icon = STEP_ICONS[step.step_type] || Code2;
                    const title = STEP_TITLES[step.step_type] || step.step_type.replace(/_/g, " ");
                    const isActive = activeStepId === step.id;
                    return (
                      <button
                        key={step.id}
                        onClick={() => {
                          userSelectedStepRef.current = true;
                          setActiveStepId(step.id);
                        }}
                        className={cn(
                          "px-3 py-2 text-xs flex items-center gap-2 whitespace-nowrap border-b-2 transition-colors shrink-0",
                          isActive
                            ? "border-accent text-accent"
                            : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
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
                      hasNext={activeStepIdx < effectiveRunDetails.steps.length - 1}
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
