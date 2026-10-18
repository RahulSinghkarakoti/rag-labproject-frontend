import { create } from "zustand";
import type {
  QueryTransformationConfig,
  QueryTransformationMode,
  RetrievalConfig,
  RerankingConfig,
  GenerationConfig,
  LLMProvider,
  RetrievalStrategy,
  ThreadConfig,
} from "@/lib/schemas/thread-config";

export type {
  QueryTransformationConfig,
  QueryTransformationMode,
  RetrievalConfig,
  RerankingConfig,
  GenerationConfig,
  LLMProvider,
  RetrievalStrategy,
  ThreadConfig,
};

export const defaultThreadConfig: ThreadConfig = {
  query_transformation: {
    mode: "none",
    query_count: 3,
    include_original: true,
    prompt_template: null,
  },
  retrieval: {
    strategy: "hybrid",
    alpha: 0.5,
    top_k: 8,
    fetch_k: 20,
    similarity_threshold: null,
    mmr_lambda: 0.5,
    sparse_model: "bm25",
    dense_model: "all-MiniLM-L6-v2",
  },
  reranking: {
    enabled: true,
    model: "BAAI/bge-reranker-base",
    top_n: 10,
    top_k: 5,
    batch_size: 16,
    score_threshold: null,
    return_documents: true,
  },
  generation: {
    provider: "groq",
    llm_model: "openai/gpt-oss-120b",
    temperature: 0.2,
    max_tokens: 1000,
    citation_enforced: false,
  },
};

type ThreadConfigStore = {
  configs: Record<string, ThreadConfig>;
  getConfig: (threadId: string) => ThreadConfig;
  updateConfig: (threadId: string, patch: Partial<ThreadConfig>) => void;
  updateSection: <K extends keyof ThreadConfig>(
    threadId: string,
    section: K,
    patch: Partial<ThreadConfig[K]>
  ) => void;
  setConfig: (threadId: string, config: ThreadConfig) => void;
  resetConfig: (threadId: string) => void;
};

export const useThreadConfigStore = create<ThreadConfigStore>((set, get) => ({
  configs: {},
  getConfig: (threadId) => get().configs[threadId] ?? defaultThreadConfig,
  updateConfig: (threadId, patch) =>
    set((state) => ({
      configs: {
        ...state.configs,
        [threadId]: {
          ...(state.configs[threadId] ?? defaultThreadConfig),
          ...patch,
        },
      },
    })),
  updateSection: (threadId, section, patch) =>
    set((state) => {
      const current = state.configs[threadId] ?? defaultThreadConfig;
      return {
        configs: {
          ...state.configs,
          [threadId]: {
            ...current,
            [section]: {
              ...current[section],
              ...patch,
            },
          },
        },
      };
    }),
  setConfig: (threadId, config) =>
    set((state) => ({
      configs: {
        ...state.configs,
        [threadId]: config,
      },
    })),
  resetConfig: (threadId) =>
    set((state) => ({
      configs: {
        ...state.configs,
        [threadId]: defaultThreadConfig,
      },
    })),
}));
