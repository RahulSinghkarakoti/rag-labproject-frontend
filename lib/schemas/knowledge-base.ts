import { z } from "zod";

export const chunkingConfigSchema = z
  .object({
    strategy: z.enum(["recursive", "markdown", "semantic", "character"]),
    chunk_size: z.coerce
      .number()
      .min(100, "Chunk size must be at least 100")
      .max(4000, "Chunk size must be at most 4000"),
    chunk_overlap: z.coerce
      .number()
      .min(0, "Overlap cannot be negative")
      .max(1000, "Overlap must be at most 1000"),
  })
  .refine((data) => data.chunk_overlap < data.chunk_size, {
    message: "Overlap must be smaller than chunk size",
    path: ["chunk_overlap"],
  });

export const embeddingConfigSchema = z.object({
  model: z.string().min(1, "Embedding model is required"),
  dimension: z.coerce.number().optional().default(1536),
});

export const indexingConfigSchema = z.object({
  retriever: z.enum(["similarity", "mmr", "similarity-score-threshold"]),
  top_k: z.coerce
    .number()
    .min(1, "Top K must be at least 1")
    .max(20, "Top K must be at most 20"),
  similarity_threshold: z.coerce.number().min(0).max(1),
  reranking: z.boolean().default(true),
  citations: z.boolean().default(true),
});

export const createKnowledgeBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters"),
  description: z
    .string()
    .max(500, "Description cannot exceed 500 characters")
    .optional()
    .default(""),
  chunking_config: chunkingConfigSchema,
  embedding_config: embeddingConfigSchema,
  indexing_config: indexingConfigSchema,
});

export type CreateKnowledgeBaseFormValues = z.infer<
  typeof createKnowledgeBaseSchema
>;

export const defaultKnowledgeBaseFormValues: CreateKnowledgeBaseFormValues = {
  name: "",
  description: "",
  chunking_config: {
    strategy: "recursive",
    chunk_size: 1000,
    chunk_overlap: 200,
  },
  embedding_config: {
    model: "text-embedding-3-small",
    dimension: 1536,
  },
  indexing_config: {
    retriever: "similarity",
    top_k: 5,
    similarity_threshold: 0.7,
    reranking: true,
    citations: true,
  },
};
