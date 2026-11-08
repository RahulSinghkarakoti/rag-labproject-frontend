import { MarkerType, type Node, type Edge } from "@xyflow/react";
import type { RunDetails, RunStep } from "@/lib/thread-api";
import type { DataArtifactNodeData, StepProcessNodeData } from "./types";

export type FlowchartLayoutMode = "rows" | "horizontal";

const STEP_TITLES: Record<string, string> = {
  query_transformation: "Query Transformation",
  transformation: "Query Transformation",
  retrieval: "Knowledge Retrieval",
  reranking: "Candidate Reranking",
  context: "Context Assembly",
  generation: "LLM Generation",
};

export function buildPipelineGraph(
  runDetails: RunDetails,
  selectedTarget: { type: "step" | "input" | "output"; stepId: string } | null,
  layoutMode: FlowchartLayoutMode = "rows"
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const steps = runDetails.steps || [];
  if (steps.length === 0) return { nodes, edges };

  // Explicit dimensions for React Flow node boundary calculations
  const INPUT_WIDTH = 210;
  const STEP_WIDTH = 250;
  const OUTPUT_WIDTH = 210;
  const ESTIMATED_HEIGHT = 120;

  // Staged Rows mode:
  // Each stage occupies one horizontal row with: [Input] -> [Step Process] -> [Output]
  // Stages are stacked vertically: Stage 1, Stage 2, Stage 3, Stage 4
  // Lineage edge connects Output of Stage N to Input of Stage N+1
  const ROW_HEIGHT = 160;
  const ROW_START_X = 40;
  const ROW_START_Y = 40;
  const ROW_INTERNAL_GAP = 40;

  // Horizontal conveyor mode constants
  const HORIZ_INTERNAL_GAP = 40;
  const HORIZ_STAGE_GAP = 80;
  let horizCurrentX = 40;
  const HORIZ_CENTER_Y = 60;

  steps.forEach((step, idx) => {
    const title = STEP_TITLES[step.step_type] || step.step_type.replace(/_/g, " ");
    const isStepSelected =
      selectedTarget?.type === "step" && selectedTarget.stepId === step.id;
    const isInputSelected =
      selectedTarget?.type === "input" && selectedTarget.stepId === step.id;
    const isOutputSelected =
      selectedTarget?.type === "output" && selectedTarget.stepId === step.id;

    // Calculate duration
    let duration: string | null = null;
    if (step.started_at && step.completed_at) {
      const diff = new Date(step.completed_at).getTime() - new Date(step.started_at).getTime();
      if (!isNaN(diff) && diff >= 0) {
        duration = `${(diff / 1000).toFixed(2)}s`;
      }
    }

    // Config summary pills
    const configSummary: { key: string; value: string | number | boolean }[] = [];
    if (step.config && typeof step.config === "object") {
      for (const [k, v] of Object.entries(step.config)) {
        if (v !== null && v !== undefined && typeof v !== "object") {
          configSummary.push({ key: k, value: String(v) });
        }
      }
    }

    // Determine positions based on layoutMode
    let inputPos = { x: 0, y: 0 };
    let stepPos = { x: 0, y: 0 };
    let outputPos = { x: 0, y: 0 };

    if (layoutMode === "rows") {
      const y = ROW_START_Y + idx * ROW_HEIGHT;
      inputPos = { x: ROW_START_X, y };
      stepPos = { x: ROW_START_X + INPUT_WIDTH + ROW_INTERNAL_GAP, y };
      outputPos = { x: stepPos.x + STEP_WIDTH + ROW_INTERNAL_GAP, y };
    } else {
      const y = HORIZ_CENTER_Y;
      inputPos = { x: horizCurrentX, y };
      stepPos = { x: horizCurrentX + INPUT_WIDTH + HORIZ_INTERNAL_GAP, y };
      outputPos = { x: stepPos.x + STEP_WIDTH + HORIZ_INTERNAL_GAP, y };
      horizCurrentX = outputPos.x + OUTPUT_WIDTH + HORIZ_STAGE_GAP;
    }

    // 1. INPUT NODE
    const inputNodeId = `in-${step.id}`;
    const inputSummary = extractInputSummary(step);

    nodes.push({
      id: inputNodeId,
      type: "ragDataNode",
      position: inputPos,
      width: INPUT_WIDTH,
      height: ESTIMATED_HEIGHT,
      initialWidth: INPUT_WIDTH,
      initialHeight: ESTIMATED_HEIGHT,
      data: {
        stepId: step.id,
        stepSequence: step.sequence,
        stepType: step.step_type,
        variant: "input",
        label: `${title} Input`,
        subLabel: inputSummary.subLabel,
        badgeCount: inputSummary.badgeCount,
        previewText: inputSummary.previewText,
        fullData: step.input,
        isSelected: isInputSelected,
      } as DataArtifactNodeData,
    });

    // 2. STEP / PROCESS NODE
    const stepNodeId = `step-${step.id}`;

    nodes.push({
      id: stepNodeId,
      type: "ragStepNode",
      position: stepPos,
      width: STEP_WIDTH,
      height: ESTIMATED_HEIGHT,
      initialWidth: STEP_WIDTH,
      initialHeight: ESTIMATED_HEIGHT,
      data: {
        step,
        title,
        status: step.status,
        duration,
        configSummary,
        isSelected: isStepSelected,
      } as StepProcessNodeData,
    });

    // 3. OUTPUT NODE
    const outputNodeId = `out-${step.id}`;
    const outputSummary = extractOutputSummary(step);

    nodes.push({
      id: outputNodeId,
      type: "ragDataNode",
      position: outputPos,
      width: OUTPUT_WIDTH,
      height: ESTIMATED_HEIGHT,
      initialWidth: OUTPUT_WIDTH,
      initialHeight: ESTIMATED_HEIGHT,
      data: {
        stepId: step.id,
        stepSequence: step.sequence,
        stepType: step.step_type,
        variant: "output",
        label: `${title} Output`,
        subLabel: outputSummary.subLabel,
        badgeCount: outputSummary.badgeCount,
        previewText: outputSummary.previewText,
        fullData: step.output,
        isSelected: isOutputSelected,
      } as DataArtifactNodeData,
    });

    // EDGE 1: Input Node -> Step Process Node
    edges.push({
      id: `edge-${inputNodeId}-to-${stepNodeId}`,
      source: inputNodeId,
      target: stepNodeId,
      sourceHandle: "right",
      targetHandle: "left",
      type: "smoothstep",
      animated: isInputSelected || isStepSelected,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isInputSelected || isStepSelected ? "var(--accent)" : "#5a5a70",
      },
      style: {
        stroke: isInputSelected || isStepSelected ? "var(--accent)" : "#3a3a50",
        strokeWidth: isInputSelected || isStepSelected ? 2.5 : 1.75,
      },
    });

    // EDGE 2: Step Process Node -> Output Node
    edges.push({
      id: `edge-${stepNodeId}-to-${outputNodeId}`,
      source: stepNodeId,
      target: outputNodeId,
      sourceHandle: "right",
      targetHandle: "left",
      type: "smoothstep",
      animated: isStepSelected || isOutputSelected,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isStepSelected || isOutputSelected ? "var(--accent)" : "#5a5a70",
      },
      style: {
        stroke: isStepSelected || isOutputSelected ? "var(--accent)" : "#3a3a50",
        strokeWidth: isStepSelected || isOutputSelected ? 2.5 : 1.75,
      },
    });

    // EDGE 3: Connect Output of Stage N -> Input of Stage N+1 (Pipeline lineage)
    if (idx < steps.length - 1) {
      const nextStep = steps[idx + 1];
      const nextInputNodeId = `in-${nextStep.id}`;

      if (layoutMode === "rows") {
        // Lineage flows down from Output bottom handle to next Input left handle
        edges.push({
          id: `edge-lineage-${step.id}-to-${nextStep.id}`,
          source: outputNodeId,
          target: nextInputNodeId,
          sourceHandle: "bottom",
          targetHandle: "left",
          type: "smoothstep",
          animated: true,
          label: "NEXT STAGE",
          labelStyle: { fill: "#00d4ff", fontSize: 9, fontFamily: "monospace", fontWeight: 700 },
          labelBgStyle: { fill: "#12121a", fillOpacity: 0.85 },
          labelBgPadding: [4, 2] as [number, number],
          style: {
            stroke: "#00d4ff",
            strokeWidth: 2,
            strokeDasharray: "4 4",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#00d4ff",
          },
        });
      } else {
        // Lineage flows horizontally to the right
        edges.push({
          id: `edge-lineage-${step.id}-to-${nextStep.id}`,
          source: outputNodeId,
          target: nextInputNodeId,
          sourceHandle: "right",
          targetHandle: "left",
          type: "smoothstep",
          animated: true,
          label: "NEXT STAGE",
          labelStyle: { fill: "#00d4ff", fontSize: 9, fontFamily: "monospace", fontWeight: 700 },
          labelBgStyle: { fill: "#12121a", fillOpacity: 0.85 },
          labelBgPadding: [4, 2] as [number, number],
          style: {
            stroke: "#00d4ff",
            strokeWidth: 2,
            strokeDasharray: "4 4",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#00d4ff",
          },
        });
      }
    }
  });

  return { nodes, edges };
}

function extractInputSummary(step: RunStep): {
  subLabel?: string;
  badgeCount?: number;
  previewText?: string;
} {
  const input = step.input;
  if (!input) return { previewText: "No input data" };

  const type = step.step_type.toLowerCase();

  if (type.includes("transformation") || type.includes("query")) {
    const q =
      typeof input === "string"
        ? input
        : input.query || input.original_query || JSON.stringify(input);
    return {
      subLabel: "Raw query",
      previewText: typeof q === "string" ? q : JSON.stringify(q),
    };
  }

  if (type.includes("retrieval")) {
    const queries = Array.isArray(input.queries) ? input.queries : [input.query || ""];
    return {
      badgeCount: queries.length,
      subLabel: `${queries.length} search queries`,
      previewText: queries.filter(Boolean).join(" | "),
    };
  }

  if (type.includes("reranking")) {
    const docCount = input.document_count ?? (Array.isArray(input.documents) ? input.documents.length : 0);
    return {
      badgeCount: docCount,
      subLabel: `${docCount} candidate docs`,
      previewText: `Evaluating ${docCount} candidates against search query`,
    };
  }

  if (type.includes("generation")) {
    const q = input.query || input.prompt || "";
    const ctxLen = input.context_length ? ` (~${Math.round(input.context_length / 4)} tokens)` : "";
    return {
      subLabel: `Context + Prompt${ctxLen}`,
      previewText: typeof q === "string" ? q : "Prompt context assembled",
    };
  }

  return {
    previewText: typeof input === "object" ? `${Object.keys(input).length} fields` : String(input),
  };
}

function extractOutputSummary(step: RunStep): {
  subLabel?: string;
  badgeCount?: number;
  previewText?: string;
} {
  const output = step.output;
  if (!output) return { previewText: "No output data recorded" };

  const type = step.step_type.toLowerCase();

  if (type.includes("transformation") || type.includes("query")) {
    let count = 0;
    let list: string[] = [];
    if (Array.isArray(output)) list = output;
    else if (Array.isArray(output.transformed_queries)) list = output.transformed_queries;
    else if (Array.isArray(output.queries)) list = output.queries;
    count = list.length;

    return {
      badgeCount: count,
      subLabel: `${count} transformed queries`,
      previewText: list.join(" • ") || "Transformed queries",
    };
  }

  if (type.includes("retrieval")) {
    let docs: any[] = [];
    if (Array.isArray(output)) docs = output;
    else if (Array.isArray(output.retrieved_documents)) docs = output.retrieved_documents;
    else if (Array.isArray(output.documents)) docs = output.documents;

    return {
      badgeCount: docs.length,
      subLabel: `${docs.length} chunks retrieved`,
      previewText: docs.length > 0 ? (docs[0].name || docs[0].title || "Retrieved vector chunks") : "No chunks",
    };
  }

  if (type.includes("reranking")) {
    let docs: any[] = [];
    if (Array.isArray(output)) docs = output;
    else if (Array.isArray(output.reranked_documents)) docs = output.reranked_documents;
    else if (Array.isArray(output.documents)) docs = output.documents;

    return {
      badgeCount: docs.length,
      subLabel: `${docs.length} reranked candidates`,
      previewText: `Top ${docs.length} relevant chunks selected`,
    };
  }

  if (type.includes("generation")) {
    const text = typeof output === "string" ? output : output.response || output.answer || "";
    return {
      subLabel: `${text.length} chars generated`,
      previewText: text ? text.slice(0, 120) + (text.length > 120 ? "..." : "") : "Generated text",
    };
  }

  return {
    previewText: typeof output === "object" ? `${Object.keys(output).length} keys output` : String(output),
  };
}
