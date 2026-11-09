"use client";

import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeMouseHandler,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useNodesInitialized,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import { buildPipelineGraph, type FlowchartLayoutMode } from "./graph-builder";
import { useThemeAccent } from "@/components/theme-accent-provider";
import { StepProcessNode } from "./nodes/step-process-node";
import { DataArtifactNode } from "./nodes/data-artifact-node";
import { StepPresentationView } from "./step-presentation-view";
import type { RunDetails, RunStep } from "@/lib/thread-api";
import type { SelectedNodeTarget, DataArtifactNodeData } from "./types";
import {
  ArrowDownRight,
  ArrowUpRight,
  Cpu,
  Layers,
  Maximize2,
  Minimize2,
  Scan,
  X,
  LayoutGrid,
  Workflow,
  Sparkles,
  Database,
  Filter,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RunFlowchartViewProps {
  runDetails: RunDetails;
  activeStepId: string | null;
  onSelectStepId: (stepId: string) => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const nodeTypes = {
  ragStepNode: StepProcessNode,
  ragDataNode: DataArtifactNode,
};

const STEP_SHORT_NAMES: Record<string, string> = {
  query_transformation: "Transform",
  transformation: "Transform",
  retrieval: "Retrieval",
  reranking: "Rerank",
  context: "Context",
  generation: "Generate",
};

function FlowchartCanvas({
  runDetails,
  activeStepId,
  onSelectStepId,
  isFullscreen,
  onToggleFullscreen,
}: RunFlowchartViewProps) {
  const { fitView, zoomIn, zoomOut } = useReactFlow();
  const nodesInitialized = useNodesInitialized();
  const containerRef = useRef<HTMLDivElement>(null);

  const { activePreset } = useThemeAccent();
  const [layoutMode, setLayoutMode] = useState<FlowchartLayoutMode>("horizontal");
  const [selectedTarget, setSelectedTarget] = useState<SelectedNodeTarget | null>(() =>
    activeStepId ? { type: "step", stepId: activeStepId } : null
  );

  const [inspectorOpen, setInspectorOpen] = useState(false);

  // Sync external step selection
  useEffect(() => {
    if (activeStepId) {
      setSelectedTarget((prev) => {
        if (prev?.stepId === activeStepId) return prev;
        return { type: "step", stepId: activeStepId };
      });
    }
  }, [activeStepId]);

  // React Flow stateful nodes & edges with XYFlow's native state handlers
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Rebuild graph when details, selection, layout, or theme changes
  useEffect(() => {
    const graph = buildPipelineGraph(runDetails, selectedTarget, layoutMode, {
      border: activePreset.border,
      accent: activePreset.accent,
      card: activePreset.surface,
      foreground: activePreset.text,
    });
    setNodes(graph.nodes);
    setEdges(graph.edges);
  }, [runDetails, selectedTarget, layoutMode, activePreset, setNodes, setEdges]);

  // Auto-fit whenever nodes initialize, layout changes, or fullscreen toggles
  useEffect(() => {
    if (nodesInitialized && nodes.length > 0) {
      const timer = setTimeout(() => {
        fitView({ padding: 0.15, duration: 250 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [nodesInitialized, layoutMode, isFullscreen, fitView, nodes.length]);

  // Auto-fit when inspector is toggled open/closed
  const handleToggleInspector = (open: boolean) => {
    setInspectorOpen(open);
    setTimeout(() => {
      fitView({ padding: 0.15, duration: 300 });
    }, 200);
  };

  const onNodeClick: NodeMouseHandler = useCallback(
    (_, node) => {
      const nodeData = node.data as Partial<DataArtifactNodeData> | undefined;
      if (node.id.startsWith("in-")) {
        const stepId = (nodeData?.stepId as string) || node.id.replace("in-", "");
        setSelectedTarget({ type: "input", stepId });
        onSelectStepId(stepId);
        setInspectorOpen(true);
      } else if (node.id.startsWith("out-")) {
        const stepId =
          (nodeData?.stepId as string) || node.id.replace("out-", "").split("-")[0];
        const itemIndex = nodeData?.itemIndex;
        setSelectedTarget({ type: "output", stepId, itemIndex });
        onSelectStepId(stepId);
        setInspectorOpen(true);
      } else if (node.id.startsWith("step-")) {
        const stepId =
          (nodeData as any)?.step?.id || node.id.replace("step-", "");
        setSelectedTarget({ type: "step", stepId });
        onSelectStepId(stepId);
        setInspectorOpen(true);
      }
    },
    [onSelectStepId]
  );

  const activeStep = runDetails.steps.find(
    (s) => s.id === (selectedTarget?.stepId || activeStepId)
  );

  const activeStepIdx = activeStep
    ? runDetails.steps.findIndex((s) => s.id === activeStep.id)
    : -1;

  const handleSelectPrev = () => {
    if (activeStepIdx > 0) {
      const prevStep = runDetails.steps[activeStepIdx - 1];
      setSelectedTarget({ type: "step", stepId: prevStep.id });
      onSelectStepId(prevStep.id);
    }
  };

  const handleSelectNext = () => {
    if (activeStepIdx >= 0 && activeStepIdx < runDetails.steps.length - 1) {
      const nextStep = runDetails.steps[activeStepIdx + 1];
      setSelectedTarget({ type: "step", stepId: nextStep.id });
      onSelectStepId(nextStep.id);
    }
  };

  // Jump to specific stage and center camera on it
  const handleJumpToStage = (step: RunStep) => {
    setSelectedTarget({ type: "step", stepId: step.id });
    onSelectStepId(step.id);
    setInspectorOpen(true);

    const stageNodes = nodes.filter(
      (n) =>
        n.id.startsWith(`in-${step.id}`) ||
        n.id.startsWith(`step-${step.id}`) ||
        n.id.startsWith(`out-${step.id}`)
    );

    fitView({
      nodes: stageNodes.length > 0 ? stageNodes : [{ id: `step-${step.id}` }],
      duration: 350,
      padding: 0.25,
    });
  };

  const handleFitAll = () => {
    fitView({ padding: 0.15, duration: 300 });
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full min-h-[480px] border border-border cyber-chamfer-sm overflow-hidden bg-background font-mono">
      {/* Canvas Area */}
      <div ref={containerRef} className="flex-1 relative h-full min-h-[400px] w-full overflow-hidden">
        {/* Canvas Top Toolbar */}
        <div className="absolute top-2.5 left-2.5 z-10 flex flex-wrap items-center gap-1.5 p-1 bg-card/95 backdrop-blur border border-border text-xs cyber-chamfer-sm shadow-md">
          {/* Layout Mode Segmented Switcher */}
          <div className="flex items-center gap-0.5 p-0.5 bg-background border border-border cyber-chamfer-sm">
            <button
              onClick={() => setLayoutMode("horizontal")}
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase cyber-chamfer-sm flex items-center gap-1 transition-colors",
                layoutMode === "horizontal"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              title="Pipeline Layout: All stages in one continuous horizontal conveyor line (Default)"
            >
              <Workflow className="h-3 w-3" />
              <span>Pipeline</span>
            </button>
            <button
              onClick={() => setLayoutMode("rows")}
              className={cn(
                "px-2 py-0.5 text-[10px] font-bold uppercase cyber-chamfer-sm flex items-center gap-1 transition-colors",
                layoutMode === "rows"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              title="Rows Layout: Each pipeline stage stacked on its own row"
            >
              <LayoutGrid className="h-3 w-3" />
              <span>Rows</span>
            </button>
          </div>

          {/* Fit View Button */}
          <button
            onClick={handleFitAll}
            className="px-2 py-1 bg-secondary hover:bg-muted text-foreground text-[10px] font-bold uppercase cyber-chamfer-sm flex items-center gap-1 border border-border"
            title="Fit Entire Pipeline to Viewport"
          >
            <Scan className="h-3 w-3 text-accent" />
            <span>Fit All</span>
          </button>

          {/* Fullscreen Toggle Button */}
          {onToggleFullscreen && (
            <button
              onClick={onToggleFullscreen}
              className={cn(
                "px-2 py-1 text-[10px] font-bold uppercase cyber-chamfer-sm flex items-center gap-1 border border-border transition-colors",
                isFullscreen
                  ? "bg-accent text-accent-foreground border-accent hover:brightness-110"
                  : "bg-secondary hover:bg-muted text-foreground"
              )}
              title={isFullscreen ? "Exit Fullscreen View" : "Toggle Fullscreen View"}
            >
              {isFullscreen ? (
                <>
                  <Minimize2 className="h-3 w-3" />
                  <span>Exit</span>
                </>
              ) : (
                <>
                  <Maximize2 className="h-3 w-3 text-accent" />
                  <span>Fullscreen</span>
                </>
              )}
            </button>
          )}

          <div className="h-4 w-[1px] bg-border mx-0.5 hidden sm:block" />

          {/* Quick Stage Jump Buttons */}
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-[9px] text-muted-foreground uppercase px-1">Stages:</span>
            {runDetails.steps.map((step) => {
              const shortName = STEP_SHORT_NAMES[step.step_type] || step.step_type;
              const isSelected = selectedTarget?.stepId === step.id;
              return (
                <button
                  key={step.id}
                  onClick={() => handleJumpToStage(step)}
                  className={cn(
                    "px-1.5 py-0.5 text-[9px] font-bold uppercase cyber-chamfer-sm border transition-colors",
                    isSelected
                      ? "bg-accent text-accent-foreground border-accent"
                      : "bg-secondary text-muted-foreground border-border hover:text-foreground hover:border-accent/40"
                  )}
                  title={`Focus on Stage #${step.sequence}: ${step.step_type}`}
                >
                  #{step.sequence} {shortName}
                </button>
              );
            })}
          </div>
        </div>

        {/* Toggle inspector button if collapsed */}
        {!inspectorOpen && activeStep && (
          <button
            onClick={() => handleToggleInspector(true)}
            className="absolute top-2.5 right-2.5 z-10 px-3 py-1.5 bg-accent text-accent-foreground font-bold text-xs cyber-chamfer-sm flex items-center gap-1.5 shadow-lg hover:brightness-110 transition-all"
          >
            <Layers className="h-3.5 w-3.5" />
            Inspect Step Details
          </button>
        )}

        {/* React Flow Canvas */}
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodeTypes={nodeTypes}
          onNodeClick={onNodeClick}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.05}
          maxZoom={2.0}
          proOptions={{ hideAttribution: true }}
          colorMode={activePreset.mode === "light" ? "light" : "dark"}
          defaultMarkerColor={activePreset.accent}
          className="bg-background"
          style={{ width: "100%", height: "100%", backgroundColor: activePreset.bg }}
        >
          <Background
            variant={BackgroundVariant.Dots}
            gap={24}
            size={1.5}
            color={activePreset.border}
            className="opacity-60"
          />
          <Controls
            position="bottom-left"
            className="!bg-card !border !border-border !rounded-none [&>button]:!border-border [&>button]:!bg-card [&>button]:!text-foreground [&>button:hover]:!bg-secondary [&>button:hover]:!text-accent [&>button>svg]:!fill-current"
          />
        </ReactFlow>

        {/* Legend bar at bottom right (never colliding with Controls) */}
        <div className="absolute bottom-2.5 right-2.5 z-10 hidden sm:flex items-center gap-3 p-1.5 px-2.5 bg-card/95 backdrop-blur border border-border text-[10px] cyber-chamfer-sm shadow-md">
          <span className="flex items-center gap-1 text-accent">
            <ArrowDownRight className="h-3 w-3" />
            Input Node
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="flex items-center gap-1 text-foreground font-bold">
            <Cpu className="h-3 w-3 text-accent" />
            Step Node
          </span>
          <span className="text-muted-foreground">→</span>
          <span className="flex items-center gap-1 text-accent">
            <ArrowUpRight className="h-3 w-3" />
            Output Node
          </span>
        </div>
      </div>

      {/* Inspector Panel */}
      {inspectorOpen && activeStep && (
        <div className="w-full md:w-[420px] lg:w-[480px] h-[340px] md:h-full border-t md:border-t-0 md:border-l border-border bg-card flex flex-col z-20 shrink-0">
          <div className="p-3 border-b border-border bg-card flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-accent inline-block" />
              <span className="font-bold text-xs uppercase tracking-wider text-accent">
                {selectedTarget?.type === "input"
                  ? "Input Inspection"
                  : selectedTarget?.type === "output"
                  ? selectedTarget.itemIndex !== undefined
                    ? `Output Item #${selectedTarget.itemIndex + 1} Inspection`
                    : "Output Inspection"
                  : "Step Execution Inspector"}
              </span>
            </div>
            <button
              onClick={() => handleToggleInspector(false)}
              className="text-muted-foreground hover:text-foreground p-1 transition-colors"
              title="Collapse Inspector"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            <StepPresentationView
              step={activeStep}
              focusSection={
                selectedTarget?.type === "input"
                  ? "input"
                  : selectedTarget?.type === "output"
                  ? "output"
                  : "all"
              }
              selectedItemIndex={
                selectedTarget?.type === "output" ? selectedTarget.itemIndex : undefined
              }
              onSelectPrevStep={handleSelectPrev}
              onSelectNextStep={handleSelectNext}
              hasPrev={activeStepIdx > 0}
              hasNext={activeStepIdx < runDetails.steps.length - 1}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function RunFlowchartView(props: RunFlowchartViewProps) {
  return (
    <ReactFlowProvider>
      <FlowchartCanvas {...props} />
    </ReactFlowProvider>
  );
}
