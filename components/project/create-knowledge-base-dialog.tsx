"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database, Layers, Sparkles, Sliders } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  createKnowledgeBaseSchema,
  defaultKnowledgeBaseFormValues,
  type CreateKnowledgeBaseFormValues,
} from "@/lib/schemas/knowledge-base";
import { useKnowledgeBaseStore } from "@/lib/store";

interface CreateKnowledgeBaseDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateKnowledgeBaseDialog({
  projectId,
  open,
  onOpenChange,
}: CreateKnowledgeBaseDialogProps) {
  const [activeTab, setActiveTab] = useState<"general" | "chunking" | "retrieval">("general");
  const createKnowledgeBase = useKnowledgeBaseStore((state) => state.createKnowledgeBase);
  const isSaving = useKnowledgeBaseStore((state) => state.status === "saving");

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateKnowledgeBaseFormValues>({
    resolver: zodResolver(createKnowledgeBaseSchema) as any,
    defaultValues: defaultKnowledgeBaseFormValues,
  });

  const onSubmit = async (values: CreateKnowledgeBaseFormValues) => {
    try {
      await createKnowledgeBase(projectId, values);
      reset(defaultKnowledgeBaseFormValues);
      onOpenChange(false);
    } catch {
      // Error handled by store
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl overflow-hidden p-0">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Create Knowledge Base
              </DialogTitle>
              <DialogDescription className="text-xs">
                Configure your document parsing, chunking strategy, and embedding pipeline.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-3 flex border-b -mb-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
                activeTab === "general"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Database className="size-3.5" /> General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("chunking")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
                activeTab === "chunking"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-3.5" /> Chunking & Embedding
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("retrieval")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-colors ${
                activeTab === "retrieval"
                  ? "border-primary text-primary font-semibold"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sliders className="size-3.5" /> Retrieval
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          {activeTab === "general" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Knowledge Base Name <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("name")}
                  placeholder="e.g. Legal Contracts, Product Wiki"
                  className="mt-1.5 h-9"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-medium text-foreground">Description</label>
                <Textarea
                  {...register("description")}
                  placeholder="Describe the knowledge base contents and domain..."
                  className="mt-1.5 resize-none text-xs"
                  rows={3}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-medium text-foreground flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-primary" /> Multi-Knowledge Base Design
                </p>
                <p>
                  You can create multiple knowledge bases in this project to compare different
                  chunking strategies or isolate different document types.
                </p>
              </div>
            </div>
          )}

          {activeTab === "chunking" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Chunking Strategy
                </label>
                <select
                  {...register("chunking_config.strategy")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="recursive">Recursive Character (Recommended)</option>
                  <option value="markdown">Markdown Header Splitter</option>
                  <option value="semantic">Semantic Similarity Splitter</option>
                  <option value="character">Fixed Character Splitter</option>
                </select>
                {errors.chunking_config?.strategy && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.chunking_config.strategy.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground">
                    Chunk Size (characters)
                  </label>
                  <Input
                    type="number"
                    {...register("chunking_config.chunk_size")}
                    className="mt-1.5 h-9 text-xs"
                  />
                  {errors.chunking_config?.chunk_size && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.chunking_config.chunk_size.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">
                    Chunk Overlap (characters)
                  </label>
                  <Input
                    type="number"
                    {...register("chunking_config.chunk_overlap")}
                    className="mt-1.5 h-9 text-xs"
                  />
                  {errors.chunking_config?.chunk_overlap && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.chunking_config.chunk_overlap.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-xs font-medium text-foreground">
                  Embedding Model
                </label>
                <select
                  {...register("embedding_config.model")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="text-embedding-3-small">OpenAI text-embedding-3-small (1536d)</option>
                  <option value="text-embedding-3-large">OpenAI text-embedding-3-large (3072d)</option>
                  <option value="bge-large-en-v1.5">BAAI bge-large-en-v1.5 (1024d)</option>
                  <option value="all-MiniLM-L6-v2">all-MiniLM-L6-v2 (384d)</option>
                </select>
                {errors.embedding_config?.model && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.embedding_config.model.message}
                  </p>
                )}
              </div>
            </div>
          )}

          {activeTab === "retrieval" && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground">
                  Retriever Type
                </label>
                <select
                  {...register("indexing_config.retriever")}
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                >
                  <option value="similarity">Vector Similarity Search</option>
                  <option value="mmr">Maximal Marginal Relevance (MMR)</option>
                  <option value="similarity-score-threshold">Similarity Score Threshold</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-foreground">Top K Documents</label>
                  <Input
                    type="number"
                    {...register("indexing_config.top_k")}
                    className="mt-1.5 h-9 text-xs"
                  />
                  {errors.indexing_config?.top_k && (
                    <p className="mt-1 text-xs text-destructive">
                      {errors.indexing_config.top_k.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground">
                    Similarity Threshold
                  </label>
                  <Input
                    type="number"
                    step="0.05"
                    min="0"
                    max="1"
                    {...register("indexing_config.similarity_threshold")}
                    className="mt-1.5 h-9 text-xs"
                  />
                </div>
              </div>

              <div className="space-y-2 border-t pt-4">
                <label className="flex cursor-pointer items-center justify-between text-xs">
                  <span>Rerank retrieved results</span>
                  <input
                    type="checkbox"
                    {...register("indexing_config.reranking")}
                    className="size-4 accent-primary"
                  />
                </label>
                <label className="flex cursor-pointer items-center justify-between text-xs">
                  <span>Extract source citations</span>
                  <input
                    type="checkbox"
                    {...register("indexing_config.citations")}
                    className="size-4 accent-primary"
                  />
                </label>
              </div>
            </div>
          )}

          <DialogFooter className="border-t pt-3 -mx-6 px-6 -mb-4 pb-4">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "Creating..." : "Create Knowledge Base"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
