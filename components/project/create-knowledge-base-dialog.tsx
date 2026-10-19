"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database, Layers, Sparkles } from "lucide-react";

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
  const [activeTab, setActiveTab] = useState<"general" | "chunking">("general");
  const createKnowledgeBase = useKnowledgeBaseStore((state) => state.createKnowledgeBase);
  const isSaving = useKnowledgeBaseStore((state) => state.status === "saving");

  const {
    register,
    handleSubmit,
    reset,
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
      // Handled by store
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl sm:max-w-2xl overflow-hidden p-0 font-mono">
        <DialogHeader className="border-b border-[#2a2a3a] px-6 py-4 bg-[#12121a]">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center cyber-chamfer-sm bg-accent text-[#0a0a0f]">
              <Database className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-base font-bold uppercase tracking-wider text-foreground">
                &gt; CREATE_KNOWLEDGE_BASE
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground uppercase">
                Configure document parsing, chunking strategy &amp; vector embedding pipeline.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-3 flex border-b border-[#2a2a3a] -mb-4 text-xs font-bold uppercase">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-none ${
                activeTab === "general"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Database className="size-3.5" /> [1] GENERAL
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("chunking")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-2 transition-none ${
                activeTab === "chunking"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-3.5" /> [2] CHUNKING &amp; EMBEDDING
            </button> 
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4 bg-[#12121a]">
          {activeTab === "general" && (
            <div className="space-y-4 font-mono">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Knowledge Base Designation <span className="text-destructive">*</span>
                </label>
                <Input
                  {...register("name")}
                  placeholder="e.g. LEGAL_CONTRACTS_NODE"
                  className="mt-1.5 h-9"
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">Description</label>
                <Textarea
                  {...register("description")}
                  placeholder="Domain description and ingestion parameters..."
                  className="mt-1.5 resize-none text-xs"
                  rows={3}
                />
                {errors.description && (
                  <p className="mt-1 text-xs text-destructive">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div className="cyber-chamfer-sm border border-[#2a2a3a] bg-[#0a0a0f] p-3 text-xs text-muted-foreground space-y-1 font-mono">
                <p className="font-bold text-accent uppercase flex items-center gap-1.5">
                  <Sparkles className="size-3.5 text-accent" /> // MULTI_KB_PIPELINE
                </p>
                <p className="text-[11px]">
                  Multiple knowledge bases allow isolated chunking parameters and comparative vector search within a single project node.
                </p>
              </div>
            </div>
          )}

          {activeTab === "chunking" && (
            <div className="space-y-4 font-mono">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Chunking Strategy
                </label>
                <select
                  {...register("chunking_config.strategy")}
                  className="mt-1.5 h-9 w-full bg-[#0a0a0f] border border-[#2a2a3a] cyber-chamfer-sm px-3 text-xs font-mono text-foreground outline-none focus:border-accent"
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
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Chunk Size (chars)
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
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Chunk Overlap (chars)
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

              <div className="border-t border-[#2a2a3a] pt-4">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Vector Embedding Model
                </label>
                <select
                  {...register("embedding_config.model")}
                  className="mt-1.5 h-9 w-full bg-[#0a0a0f] border border-[#2a2a3a] cyber-chamfer-sm px-3 text-xs font-mono text-foreground outline-none focus:border-accent"
                > 
                  <option value="BAAI/bge-large-en-v1.5">BAAI bge-large-en-v1.5 (1024d)</option>
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

          <DialogFooter className="border-t border-[#2a2a3a] pt-3 -mx-6 px-6 -mb-4 pb-4 bg-[#12121a]">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              CANCEL
            </Button>
            <Button type="submit" size="sm" disabled={isSaving}>
              {isSaving ? "INITIALIZING..." : "EXECUTE_CREATE"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
