import type { RunStep } from "@/lib/thread-api";

export type DataNodeVariant = "input" | "output";

export interface DataArtifactNodeData extends Record<string, unknown> {
  stepId: string;
  stepSequence: number;
  stepType: string;
  variant: DataNodeVariant;
  label: string;
  subLabel?: string;
  badgeCount?: number;
  previewText?: string;
  fullData: unknown;
  itemIndex?: number;
  totalItems?: number;
  isSelected?: boolean;
}

export interface StepProcessNodeData extends Record<string, unknown> {
  step: RunStep;
  title: string;
  status: string;
  duration?: string | null;
  configSummary?: { key: string; value: string | number | boolean }[];
  isSelected?: boolean;
}

export type SelectedNodeTarget =
  | { type: "step"; stepId: string }
  | { type: "input"; stepId: string }
  | { type: "output"; stepId: string; itemIndex?: number };
