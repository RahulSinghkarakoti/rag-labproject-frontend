import { create } from "zustand";
import type { ThreadStore } from "./types";
import { createThreadSlice } from "./thread-slice";
import { createMessageSlice } from "./message-slice";
import { createLiveRunSlice } from "./live-run-slice";
import { createConfigSyncSlice } from "./config-sync-slice";

export * from "./types";
export { isUuid } from "./utils";

export const useThreadStore = create<ThreadStore>((...a) => ({
  ...createThreadSlice(...a),
  ...createMessageSlice(...a),
  ...createLiveRunSlice(...a),
  ...createConfigSyncSlice(...a),
}));
