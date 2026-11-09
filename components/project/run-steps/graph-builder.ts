import { MarkerType, type Node, type Edge } from "@xyflow/react";
import type { RunDetails, RunStep } from "@/lib/thread-api";
import type { DataArtifactNodeData, StepProcessNodeData, SelectedNodeTarget } from "./types";

export type FlowchartLayoutMode = "rows" | "horizontal";

export interface GraphThemeTokens {
  border?: string;
  accent?: string;
  card?: string;
  foreground?: string;
}

const STEP_TITLES: Record<string, string> = {
  query_transformation: "Query Transformation",
  transformation: "Query Transformation",
  retrieval: "Knowledge Retrieval",
  reranking: "Candidate Reranking",
  context: "Context Assembly",
  generation: "LLM Generation",
};

export function getStepOutputItems(step: RunStep): unknown[] | null {
  const output = step.output;
  if (!output) return null;

  // Direct array
  if (Array.isArray(output)) {
    return output;
  }

  // Object wrapping an array for known stages (excluding generation)
  const stepType = step.step_type.toLowerCase();
  if (!stepType.includes("generation") && typeof output === "object" && output !== null) {
    const obj = output as Record<string, unknown>;
    if (Array.isArray(obj.transformed_queries)) return obj.transformed_queries;
    if (Array.isArray(obj.retrieved_documents)) return obj.retrieved_documents;
    if (Array.isArray(obj.reranked_documents)) return obj.reranked_documents;
    if (Array.isArray(obj.documents)) return obj.documents;
    if (Array.isArray(obj.queries)) return obj.queries;
    if (Array.isArray(obj.items)) return obj.items;
    if (Array.isArray(obj.results)) return obj.results;
  }

  return null;
}

export function buildPipelineGraph(
  runDetails: RunDetails,
  selectedTarget: SelectedNodeTarget | null,
  layoutMode: FlowchartLayoutMode = "horizontal",
  themeTokens?: GraphThemeTokens
): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const strokeNormal = themeTokens?.border || "var(--border)";
  const strokeActive = themeTokens?.accent || "var(--accent)";
  const cardBg = themeTokens?.card || "var(--card)";

  const steps = runDetails.steps || [];
  if (steps.length === 0) return { nodes, edges };

  // Explicit dimensions for React Flow node boundary calculations
  const INPUT_WIDTH = 210;
  const STEP_WIDTH = 250;
  const OUTPUT_WIDTH = 210;
  const ESTIMATED_HEIGHT = 120;
  const ITEM_GAP_Y = 16;

  // Staged Rows mode constants:
  const ROW_START_X = 40;
  const ROW_START_Y = 40;
  const ROW_INTERNAL_GAP = 40;
  const STAGE_ROW_GAP = 50;
  let currentStageY = ROW_START_Y;

  // Horizontal conveyor mode constants:
  const HORIZ_INTERNAL_GAP = 40;
  const HORIZ_STAGE_GAP = 80;
  const HORIZ_CENTER_Y = 100;
  let horizCurrentX = 40;

  // Track output node IDs for each step to connect lineage to downstream stages
  const stepOutputNodeIds: Record<string, string[]> = {};

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

    // Determine output items
    const outputItems = getStepOutputItems(step);
    const isArrayOutput = outputItems !== null && outputItems.length > 0;
    const outputCount = isArrayOutput ? outputItems.length : 1;

    // Calculate heights and positions
    const totalOutputHeight = outputCount * ESTIMATED_HEIGHT + (outputCount - 1) * ITEM_GAP_Y;
    const stageHeight = Math.max(ESTIMATED_HEIGHT, totalOutputHeight);

    let inputPos = { x: 0, y: 0 };
    let stepPos = { x: 0, y: 0 };
    const outputPositions: { x: number; y: number }[] = [];

    if (layoutMode === "rows") {
      const centerY = currentStageY + (stageHeight - ESTIMATED_HEIGHT) / 2;
      inputPos = { x: ROW_START_X, y: centerY };
      stepPos = { x: ROW_START_X + INPUT_WIDTH + ROW_INTERNAL_GAP, y: centerY };
      const outputX = stepPos.x + STEP_WIDTH + ROW_INTERNAL_GAP;

      if (!isArrayOutput) {
        outputPositions.push({ x: outputX, y: centerY });
      } else {
        for (let j = 0; j < outputCount; j++) {
          outputPositions.push({
            x: outputX,
            y: currentStageY + j * (ESTIMATED_HEIGHT + ITEM_GAP_Y),
          });
        }
      }

      currentStageY += stageHeight + STAGE_ROW_GAP;
    } else {
      // Horizontal conveyor mode
      inputPos = { x: horizCurrentX, y: HORIZ_CENTER_Y };
      stepPos = { x: horizCurrentX + INPUT_WIDTH + HORIZ_INTERNAL_GAP, y: HORIZ_CENTER_Y };
      const outputX = stepPos.x + STEP_WIDTH + HORIZ_INTERNAL_GAP;

      if (!isArrayOutput) {
        outputPositions.push({ x: outputX, y: HORIZ_CENTER_Y });
      } else {
        const startY = HORIZ_CENTER_Y + (ESTIMATED_HEIGHT - totalOutputHeight) / 2;
        for (let j = 0; j < outputCount; j++) {
          outputPositions.push({
            x: outputX,
            y: startY + j * (ESTIMATED_HEIGHT + ITEM_GAP_Y),
          });
        }
      }

      horizCurrentX = outputX + OUTPUT_WIDTH + HORIZ_STAGE_GAP;
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
        color: isInputSelected || isStepSelected ? strokeActive : strokeNormal,
      },
      style: {
        stroke: isInputSelected || isStepSelected ? strokeActive : strokeNormal,
        strokeWidth: isInputSelected || isStepSelected ? 2.5 : 1.75,
      },
    });

    // 3. OUTPUT NODE(S)
    const currentStepOutputIds: string[] = [];

    if (!isArrayOutput) {
      // Single output node
      const outputNodeId = `out-${step.id}`;
      currentStepOutputIds.push(outputNodeId);
      const outputSummary = extractOutputSummary(step);

      nodes.push({
        id: outputNodeId,
        type: "ragDataNode",
        position: outputPositions[0],
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
          color: isStepSelected || isOutputSelected ? strokeActive : strokeNormal,
        },
        style: {
          stroke: isStepSelected || isOutputSelected ? strokeActive : strokeNormal,
          strokeWidth: isStepSelected || isOutputSelected ? 2.5 : 1.75,
        },
      });
    } else {
      // Multiple output nodes (one for each array item)
      outputItems!.forEach((item, itemIdx) => {
        const outputNodeId = `out-${step.id}-${itemIdx}`;
        currentStepOutputIds.push(outputNodeId);

        const itemSummary = extractOutputItemSummary(
          item,
          itemIdx,
          outputItems!.length,
          step.step_type
        );

        const isThisItemSelected =
          isOutputSelected &&
          (selectedTarget?.itemIndex === undefined || selectedTarget.itemIndex === itemIdx);

        nodes.push({
          id: outputNodeId,
          type: "ragDataNode",
          position: outputPositions[itemIdx],
          width: OUTPUT_WIDTH,
          height: ESTIMATED_HEIGHT,
          initialWidth: OUTPUT_WIDTH,
          initialHeight: ESTIMATED_HEIGHT,
          data: {
            stepId: step.id,
            stepSequence: step.sequence,
            stepType: step.step_type,
            variant: "output",
            label: itemSummary.label,
            subLabel: itemSummary.subLabel,
            previewText: itemSummary.previewText,
            itemIndex: itemIdx,
            totalItems: outputItems!.length,
            fullData: item,
            isSelected: isThisItemSelected,
          } as DataArtifactNodeData,
        });

        // EDGE 2: Step Process Node -> Item Output Node
        const isEdgeActive = isStepSelected || isThisItemSelected;
        edges.push({
          id: `edge-${stepNodeId}-to-${outputNodeId}`,
          source: stepNodeId,
          target: outputNodeId,
          sourceHandle: "right",
          targetHandle: "left",
          type: "smoothstep",
          animated: isEdgeActive,
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: isEdgeActive ? strokeActive : strokeNormal,
          },
          style: {
            stroke: isEdgeActive ? strokeActive : strokeNormal,
            strokeWidth: isEdgeActive ? 2.5 : 1.75,
          },
        });
      });
    }

    stepOutputNodeIds[step.id] = currentStepOutputIds;

    // EDGE 3: Connect Output(s) of Stage N -> Input of Stage N+1 (Pipeline lineage)
    if (idx < steps.length - 1) {
      const nextStep = steps[idx + 1];
      const nextInputNodeId = `in-${nextStep.id}`;

      if (layoutMode === "rows") {
        // Lineage flows down from the last output node bottom handle to next Input left handle
        const sourceNodeId = currentStepOutputIds[currentStepOutputIds.length - 1];
        edges.push({
          id: `edge-lineage-${step.id}-to-${nextStep.id}`,
          source: sourceNodeId,
          target: nextInputNodeId,
          sourceHandle: "bottom",
          targetHandle: "left",
          type: "smoothstep",
          animated: true,
          label: "NEXT STAGE",
          labelStyle: { fill: strokeActive, fontSize: 9, fontFamily: "monospace", fontWeight: 700 },
          labelBgStyle: { fill: cardBg, fillOpacity: 0.95 },
          labelBgPadding: [4, 2] as [number, number],
          style: {
            stroke: strokeActive,
            strokeWidth: 2,
            strokeDasharray: "4 4",
          },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: strokeActive,
          },
        });
      } else {
        // Horizontal conveyor: all output nodes connect into the next stage input
        const middleIdx = Math.floor(currentStepOutputIds.length / 2);
        currentStepOutputIds.forEach((outNodeId, outIdx) => {
          const isMiddle = outIdx === middleIdx;
          edges.push({
            id: `edge-lineage-${outNodeId}-to-${nextStep.id}`,
            source: outNodeId,
            target: nextInputNodeId,
            sourceHandle: "right",
            targetHandle: "left",
            type: "smoothstep",
            animated: true,
            label: isMiddle ? "NEXT STAGE" : undefined,
            labelStyle: isMiddle
              ? { fill: strokeActive, fontSize: 9, fontFamily: "monospace", fontWeight: 700 }
              : undefined,
            labelBgStyle: isMiddle ? { fill: cardBg, fillOpacity: 0.95 } : undefined,
            labelBgPadding: isMiddle ? ([4, 2] as [number, number]) : undefined,
            style: {
              stroke: strokeActive,
              strokeWidth: 2,
              strokeDasharray: "4 4",
            },
            markerEnd: {
              type: MarkerType.ArrowClosed,
              color: strokeActive,
            },
          });
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

function extractOutputItemSummary(
  item: unknown,
  index: number,
  total: number,
  stepType: string
): {
  label: string;
  subLabel?: string;
  previewText?: string;
} {
  const type = stepType.toLowerCase();

  // If item is a string (e.g. transformed query string)
  if (typeof item === "string") {
    if (type.includes("transformation") || type.includes("query")) {
      return {
        label: `Query #${index + 1}`,
        subLabel: `Query ${index + 1} of ${total}`,
        previewText: item,
      };
    }
    return {
      label: `Item #${index + 1}`,
      subLabel: `${index + 1} of ${total}`,
      previewText: item,
    };
  }

  // If item is an object (e.g. chunk/doc)
  if (typeof item === "object" && item !== null) {
    const doc = item as Record<string, any>;
    const score = doc.rerank_score ?? doc.score ?? doc.relevance_score ?? doc.metadata?.score;
    const scoreStr = typeof score === "number" ? `score: ${score.toFixed(3)}` : undefined;

    if (type.includes("retrieval")) {
      const docName =
        doc.name ||
        doc.title ||
        doc.metadata?.document_name ||
        (doc.id ? `Chunk ${String(doc.id).slice(0, 8)}` : `Chunk #${index + 1}`);
      const snippet = doc.snippet || doc.content || doc.text || doc.page_content || "";
      return {
        label: docName,
        subLabel: scoreStr ? `Retrieved #${index + 1} • ${scoreStr}` : `Retrieved Chunk #${index + 1}`,
        previewText: snippet
          ? typeof snippet === "string"
            ? snippet.length > 120
              ? snippet.slice(0, 120) + "..."
              : snippet
            : JSON.stringify(snippet)
          : undefined,
      };
    }

    if (type.includes("reranking")) {
      const docName =
        doc.name ||
        doc.title ||
        doc.metadata?.document_name ||
        (doc.id ? `Chunk ${String(doc.id).slice(0, 8)}` : `Candidate #${index + 1}`);
      const snippet = doc.snippet || doc.content || doc.text || doc.page_content || "";
      return {
        label: docName,
        subLabel: scoreStr ? `Rank #${index + 1} • ${scoreStr}` : `Rank #${index + 1}`,
        previewText: snippet
          ? typeof snippet === "string"
            ? snippet.length > 120
              ? snippet.slice(0, 120) + "..."
              : snippet
            : JSON.stringify(snippet)
          : undefined,
      };
    }

    // Generic object
    const label = doc.name || doc.title || doc.id || `Item #${index + 1}`;
    const snippet =
      doc.snippet || doc.content || doc.text || doc.summary || doc.message || JSON.stringify(doc);
    return {
      label: String(label),
      subLabel: scoreStr || `${index + 1} of ${total}`,
      previewText:
        typeof snippet === "string"
          ? snippet.length > 120
            ? snippet.slice(0, 120) + "..."
            : snippet
          : JSON.stringify(snippet),
    };
  }

  // Primitive number / boolean
  return {
    label: `Item #${index + 1}`,
    previewText: String(item),
  };
}
