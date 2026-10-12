import { z } from "zod";

export const queryTransformationModeSchema = z.enum([
  "none",
  "rewrite",
  "hyde",
  "multi_query",
  "step_back",
  "sub_queries",
]);

export const llmProviderSchema = z.enum(["openai", "groq", "gemini"]);

export const retrievalStrategySchema = z.enum(["hybrid", "dense", "sparse", "mmr"]);

export const queryTransformationConfigSchema = z
  .object({
    mode: queryTransformationModeSchema,
    query_count: z.number().int().min(1).max(10).default(3),
    include_original: z.boolean().default(true),
    prompt_template: z.string().nullable().optional().default(null),
  })
  .strict(); 

export const retrievalConfigSchema = z
  .object({
    strategy: retrievalStrategySchema.default("hybrid"),
    alpha: z.number().min(0.0).max(1.0).default(0.5),
    top_k: z.number().int().min(1).max(100).default(8),
    fetch_k: z.number().int().min(1).max(200).default(20),
    similarity_threshold: z.number().min(-1.0).max(1.0).nullable().default(null),
    mmr_lambda: z.number().min(0.0).max(1.0).default(0.5),
    sparse_model: z.string().min(1).default("bm25"),
    dense_model: z.string().min(1).default("all-MiniLM-L6-v2"),
  })
  .strict();

export const rerankingConfigSchema = z
  .object({
    enabled: z.boolean().default(true),
    model: z.string().min(1).max(200).default("BAAI/bge-reranker-base"),
    top_n: z.number().int().min(1).max(200).default(10),
    top_k: z.number().int().min(1).max(100).default(5),
    batch_size: z.number().int().min(1).max(256).default(16),
    score_threshold: z.number().nullable().default(null),
    return_documents: z.boolean().default(true),
  })
  .strict();

export const generationConfigSchema = z
  .object({
    provider: llmProviderSchema.default("groq"),
    llm_model: z.string().min(1).max(200).default("openai/gpt-oss-120b"),
    // model: z.string().min(1).max(200).default("gpt-4o"),
    temperature: z.number().min(0.0).max(2.0).default(0.2),
    max_tokens: z.number().int().min(1).max(32000).default(1000),
    stream: z.boolean().default(true),
    citation_enforced: z.boolean().default(false),
  })
  .strict();

export const threadConfigSchema = z
  .object({
    query_transformation: queryTransformationConfigSchema,
    retrieval: retrievalConfigSchema,
    reranking: rerankingConfigSchema,
    generation: generationConfigSchema,
  })
  .strict();

export type QueryTransformationMode = z.infer<typeof queryTransformationModeSchema>;
export type LLMProvider = z.infer<typeof llmProviderSchema>;
export type RetrievalStrategy = z.infer<typeof retrievalStrategySchema>;
export type QueryTransformationConfig = z.infer<typeof queryTransformationConfigSchema>;
export type RetrievalConfig = z.infer<typeof retrievalConfigSchema>;
export type RerankingConfig = z.infer<typeof rerankingConfigSchema>;
export type GenerationConfig = z.infer<typeof generationConfigSchema>;
export type ThreadConfig = z.infer<typeof threadConfigSchema>;
export type ThreadConfigInput = z.input<typeof threadConfigSchema>;

export interface ThreadCreatePayload {
  title: string;
  knowledge_base_ids: string[];
  config?: ThreadConfig;
}
