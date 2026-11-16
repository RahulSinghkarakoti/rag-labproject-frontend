export type ChunkingConfig = {
  strategy: "recursive" | "markdown" | "semantic" | "character";
  chunk_size: number;
  chunk_overlap: number;
};

export type EmbeddingConfig = {
  model: string;
  provider?: string;
  // dimension?: number;
};

export type IndexingConfig = {
  retriever: "similarity" | "mmr" | "similarity-score-threshold";
  top_k: number;
  similarity_threshold: number;
  reranking: boolean;
  citations: boolean;
};

export type KnowledgeBase = {
  id: string;
  project_id: string;
  name: string;
  description?: string | null;
  chunking_config: ChunkingConfig;
  embedding_config: EmbeddingConfig;
  indexing_config: IndexingConfig;
  document_count: number;
  created_at?: string;
  updated_at?: string;
};

export type CreateKnowledgeBaseInput = {
  name: string;
  description?: string;
  chunking_config: ChunkingConfig;
  embedding_config: EmbeddingConfig;
  // indexing_config: IndexingConfig;
};
