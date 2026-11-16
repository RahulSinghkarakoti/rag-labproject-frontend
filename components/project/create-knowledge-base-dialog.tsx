"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Database, Layers, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
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
      <DialogContent className="max-w-xl sm:max-w-xl">
        <DialogHeader className="pb-0">
          <div className="flex items-center gap-2">
            <div className="flex size-7 items-center justify-center cyber-chamfer-sm bg-accent text-accent-foreground shrink-0">
              <Database className="size-3.5" />
            </div>
            <div>
              <DialogTitle>
                &gt; CREATE_KNOWLEDGE_BASE
              </DialogTitle>
              <DialogDescription>
                Configure document parsing, chunking strategy &amp; vector embedding pipeline.
              </DialogDescription>
            </div>
          </div>

          <div className="mt-3 flex border-b border-border text-xs font-bold uppercase">
            <button
              type="button"
              onClick={() => setActiveTab("general")}
              className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 transition-none cursor-pointer ${
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
              className={`flex items-center gap-1.5 border-b-2 px-3 py-1.5 transition-none cursor-pointer ${
                activeTab === "chunking"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Layers className="size-3.5" /> [2] CHUNKING &amp; EMBEDDING
            </button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <DialogBody className="space-y-4">
            {activeTab === "general" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Knowledge Base Designation <span className="text-destructive">*</span>
                  </label>
                  <Input
                    {...register("name")}
                    placeholder="e.g. LEGAL_CONTRACTS_NODE"
                    className="mt-1.5 h-8 text-xs"
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

                <div className="cyber-chamfer-sm border border-border bg-secondary/30 p-2.5 text-xs text-muted-foreground space-y-1">
                  <p className="font-bold text-accent uppercase flex items-center gap-1.5 text-[11px]">
                    <Sparkles className="size-3.5 text-accent" /> // MULTI_KB_PIPELINE
                  </p>
                  <p className="text-[11px] leading-relaxed">
                    Multiple knowledge bases allow isolated chunking parameters and comparative vector search within a single project node.
                  </p>
                </div>
              </div>
            )}

            {activeTab === "chunking" && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Chunking Strategy
                  </label>
                  <select
                    {...register("chunking_config.strategy")}
                    className="mt-1.5 h-8 w-full bg-background border border-border cyber-chamfer-sm px-2.5 text-xs font-mono text-foreground outline-none focus:border-accent"
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                      Chunk Size (chars)
                    </label>
                    <Input
                      type="number"
                      {...register("chunking_config.chunk_size")}
                      className="mt-1.5 h-8 text-xs"
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
                      className="mt-1.5 h-8 text-xs"
                    />
                    {errors.chunking_config?.chunk_overlap && (
                      <p className="mt-1 text-xs text-destructive">
                        {errors.chunking_config.chunk_overlap.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="border-t border-border pt-3">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                    Vector Embedding Model
                  </label>
                  <select
                    {...register("embedding_config.model")}
                    className="mt-1.5 h-8 w-full bg-background border border-border cyber-chamfer-sm px-2.5 text-xs font-mono text-foreground outline-none focus:border-accent"
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
          </DialogBody>

          <DialogFooter>
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
