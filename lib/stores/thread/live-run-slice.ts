import { threadApi } from "@/lib/api/threads";
import type { RunDetails, RunStep } from "@/lib/types/run";
import type { LiveRunSlice, ThreadSliceCreator } from "./types";
import { isUuid } from "./utils";

export const createLiveRunSlice: ThreadSliceCreator<LiveRunSlice> = (set, get) => ({
  liveRuns: {},
  activeLiveRunId: null,

  initLiveRun: (runId, threadId, inputMessageId, _clientMsgId) =>
    set((state) => {
      const existing = state.liveRuns[runId];
      const newRun: RunDetails = existing || {
        id: runId,
        thread_id: threadId,
        input_message_id: inputMessageId ?? null,
        output_message_id: null,
        run_type: "chat",
        status: "running",
        started_at: new Date().toISOString(),
        completed_at: null,
        error: null,
        steps: [],
      };
      return {
        liveRuns: { ...state.liveRuns, [runId]: newRun },
        activeLiveRunId: runId,
      };
    }),

  updateLiveRunStep: (runId, step) =>
    set((state) => {
      const run = state.liveRuns[runId];
      if (!run) {
        const newRun: RunDetails = {
          id: runId,
          thread_id: "",
          input_message_id: null,
          output_message_id: null,
          run_type: "chat",
          status: "running",
          started_at: step.started_at ?? new Date().toISOString(),
          completed_at: null,
          error: null,
          steps: [step],
        };
        return {
          liveRuns: { ...state.liveRuns, [runId]: newRun },
          activeLiveRunId: runId,
        };
      }

      const steps = [...run.steps];
      const idx = steps.findIndex(
        (s) => s.id === step.id || (s.sequence === step.sequence && s.step_type === step.step_type),
      );
      if (idx >= 0) {
        steps[idx] = { ...steps[idx], ...step };
      } else {
        steps.push(step);
      }
      steps.sort((a, b) => a.sequence - b.sequence);

      return {
        liveRuns: {
          ...state.liveRuns,
          [runId]: {
            ...run,
            steps,
          },
        },
      };
    }),

  completeLiveRun: (runId, outputMessageId) =>
    set((state) => {
      const run = state.liveRuns[runId];
      if (!run) return state;

      const steps = run.steps.map((s) =>
        s.status === "running"
          ? { ...s, status: "completed", completed_at: s.completed_at ?? new Date().toISOString() }
          : s,
      );

      return {
        liveRuns: {
          ...state.liveRuns,
          [runId]: {
            ...run,
            status: "completed",
            completed_at: new Date().toISOString(),
            output_message_id: outputMessageId ?? run.output_message_id,
            steps,
          },
        },
        activeLiveRunId: state.activeLiveRunId === runId ? null : state.activeLiveRunId,
      };
    }),

  cancelLiveRun: (runId, outputMessageId) =>
    set((state) => {
      const run = state.liveRuns[runId];
      if (!run) return state;

      const steps = run.steps.map((s) =>
        s.status === "running"
          ? { ...s, status: "cancelled", completed_at: s.completed_at ?? new Date().toISOString() }
          : s,
      );

      return {
        liveRuns: {
          ...state.liveRuns,
          [runId]: {
            ...run,
            status: "cancelled",
            completed_at: new Date().toISOString(),
            output_message_id: outputMessageId ?? run.output_message_id,
            steps,
          },
        },
        activeLiveRunId: state.activeLiveRunId === runId ? null : state.activeLiveRunId,
      };
    }),

  failLiveRun: (runId, error) =>
    set((state) => {
      const run = state.liveRuns[runId];
      if (!run) return state;

      return {
        liveRuns: {
          ...state.liveRuns,
          [runId]: {
            ...run,
            status: "failed",
            completed_at: new Date().toISOString(),
            error: error ?? { message: "Run failed" },
          },
        },
        activeLiveRunId: state.activeLiveRunId === runId ? null : state.activeLiveRunId,
      };
    }),

  getLiveRun: (messageId, runId) => {
    const { liveRuns, activeLiveRunId, messageIdMap } = get();
    if (runId && liveRuns[runId]) {
      return liveRuns[runId];
    }
    if (messageId) {
      const match = Object.values(liveRuns).find(
        (r) => r.input_message_id === messageId || r.output_message_id === messageId,
      );
      if (match) return match;

      const mappedId = messageIdMap[messageId];
      if (mappedId) {
        const mappedMatch = Object.values(liveRuns).find(
          (r) => r.input_message_id === mappedId || r.output_message_id === mappedId,
        );
        if (mappedMatch) return mappedMatch;
      }
    }
    if (!messageId && !runId && activeLiveRunId && liveRuns[activeLiveRunId]) {
      return liveRuns[activeLiveRunId];
    }
    return null;
  },

  fetchRunSteps: (messageId) => {
    if (!isUuid(messageId)) {
      return Promise.reject(new Error("Valid message UUID required to fetch execution steps."));
    }
    return threadApi.runSteps(messageId);
  },

  fetchRunDetails: (runId) => {
    if (!isUuid(runId)) {
      return Promise.reject(new Error("Valid run UUID required to fetch execution steps."));
    }
    return threadApi.runDetails(runId);
  },
});
