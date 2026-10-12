"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  ChevronDown,
  Database,
  Filter,
  Maximize2,
  Minimize2,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { getThreadConfig } from "@/lib/thread-api";
import { useThreadStore } from "@/lib/thread-store";
import {
  defaultProjectConfig,
  useDocumentStore,
  useKnowledgeBaseStore,
  useThreadConfigStore,
  type ProjectConfig,
} from "@/lib/store";
import type {
  GenerationConfig,
  LLMProvider,
  QueryTransformationConfig,
  QueryTransformationMode,
  RerankingConfig,
  RetrievalConfig,
  RetrievalStrategy,
} from "@/lib/schemas/thread-config";

const QUERY_TRANSFORMATION_MODES: {
  value: QueryTransformationMode;
  label: string;
  description: string;
}[] = [
    {
      value: "none",
      label: "None (Pass-through)",
      description: "No transformation applied to user query.",
    },
    {
      value: "rewrite",
      label: "Rewrite",
      description: "Clarifies and resolves pronouns using chat history.",
    },
    {
      value: "hyde",
      label: "HyDE",
      description: "Generates hypothetical answer document passages.",
    },
    {
      value: "multi_query",
      label: "Multi-Query",
      description: "Generates diverse queries from multiple angles.",
    },
    {
      value: "step_back",
      label: "Step-Back",
      description: "Generates higher-level conceptual background question.",
    },
    {
      value: "sub_queries",
      label: "Sub-Queries",
      description: "Decomposes complex questions into independent sub-queries.",
    },
  ];

const MODEL_OPTIONS: Record<LLMProvider, { value: string; label: string }[]> = {
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o Mini" },
    { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
    { value: "o1-mini", label: "o1 Mini" },
    { value: "o3-mini", label: "o3 Mini" },
  ],
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
    { value: "llama-3.1-8b-instant", label: "Llama 3.1 8B Instant" },
    { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
    { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
    { value: "whisper-large-v3", label: "Whisper Large V3" },
  ],
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    { value: "gemini-3.8-flash", label: "Gemini 3.8 Flash" },
    { value: "gemini-3.7-flash", label: "Gemini 3.7 Flash" },
    { value: "gemini-3.5-flash", label: "Gemini 3.5 Flash" },
    { value: "gemini-3.5-flash-lite", label: "Gemini 3.5 Flash Lite" },
  ],
};

const SPARSE_MODELS = [
  { value: "bm25", label: "BM25" },
];

const RETRIEVAL_STRATEGIES = [
  { value: "hybrid", label: "Hybrid" },
  { value: "dense", label: "Dense" },
  { value: "sparse", label: "Sparse" },
  { value: "mmr", label: "MMR" },
];

const DENSE_MODELS = [
  { value: "text-embedding-3-small", label: "text-embedding-3-small" },
  { value: "text-embedding-3-large", label: "text-embedding-3-large" },
  { value: "all-MiniLM-L6-v2", label: "all-MiniLM-L6-v2" },
];

const RERANKER_MODELS = [
  { value: "BAAI/bge-reranker-base", label: "BAAI/bge-reranker-base" },
  { value: "bge-reranker-large", label: "bge-reranker-large" },
];

function SelectField({
  label,
  value,
  options,
  onChange,
  hint,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-[10px] font-normal text-muted-foreground/75">{hint}</span>}
      </div>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full rounded-md border border-input bg-background px-2.5 text-xs font-normal text-foreground outline-none transition-colors focus:ring-2 focus:ring-ring/40"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  hint?: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      <div className="flex items-center justify-between">
        <span>{label}</span>
        {hint && <span className="text-[10px] font-normal text-muted-foreground/75">{hint}</span>}
      </div>
      <Input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const val = Number(event.target.value);
          if (isNaN(val)) return;
          onChange(val);
        }}
        className="h-8 bg-background text-xs"
      />
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  description,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-3 text-xs">
      <div className="grid gap-0.5">
        <span className="font-medium text-foreground">{label}</span>
        {description && <span className="text-[11px] text-muted-foreground">{description}</span>}
      </div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
    </label>
  );
}

interface SectionAccordionProps {
  title: string;
  badge?: string;
  icon: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SectionAccordion({
  title,
  badge,
  icon,
  isOpen,
  onToggle,
  children,
}: SectionAccordionProps) {
  return (
    <Collapsible open={isOpen} onOpenChange={onToggle} className="rounded-lg border bg-card/60 shadow-2xs transition-all">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2.5 text-left transition hover:bg-muted/40"
        >
          <div className="flex items-center gap-2">
            <span className="text-primary">{icon}</span>
            <span className="text-xs font-semibold text-foreground">{title}</span>
            {badge && (
              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                {badge}
              </span>
            )}
          </div>
          <ChevronDown
            className={`size-4 text-muted-foreground transition-transform duration-200 ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t px-3 py-3 space-y-3 bg-background/50">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function RagSettingsPanel({ threadId }: { threadId: string | null }) {
  const config = useThreadConfigStore((state) =>
    threadId ? state.configs[threadId] : undefined
  );
  const updateConfig = useThreadConfigStore((state) => state.updateConfig);
  const saveThreadConfig = useThreadStore((state) => state.saveThreadConfig);
  const refreshThreadConfig = useThreadStore((state) => state.refreshThreadConfig);
  const latestPipelineVersion = useThreadStore((state) =>
    threadId ? state.latestPipelineVersions[threadId] : undefined
  );
  const thread = useThreadStore((state) =>
    state.threads.find((item) => item.id === threadId)
  );
  const knowledgeBases = useKnowledgeBaseStore((state) => state.knowledgeBases);
  const selectedKnowledgeBaseId = useKnowledgeBaseStore((state) => state.selectedKnowledgeBaseId);
  const activeKb = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId);
  const selectedDocumentIds = useDocumentStore((state) =>
    Array.isArray(state?.selectedDocumentIds) ? state.selectedDocumentIds : []
  );
  const documents = useDocumentStore((state) =>
    Array.isArray(state?.documents) ? state.documents : []
  );

  // Expandable panel state (allows expanding width for detailed inspection)
  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(false);

  // Expandable accordions state for each config category
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    query_transformation: false,
    retrieval: false,
    reranking: false,
    generation: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  useEffect(() => {
    if (!threadId) return;
    void refreshThreadConfig(threadId).catch(() => undefined);
  }, [threadId, refreshThreadConfig]);

  useEffect(() => {
    if (!activeKb || !threadId || !thread || getThreadConfig(thread.metadata)) return;
    updateConfig(threadId, {
      retrieval: {
        ...defaultProjectConfig.retrieval,
        top_k: activeKb.indexing_config?.top_k ?? defaultProjectConfig.retrieval.top_k,
        dense_model: activeKb.embedding_config?.model ?? defaultProjectConfig.retrieval.dense_model,
      },
      reranking: {
        ...defaultProjectConfig.reranking,
        enabled: activeKb.indexing_config?.reranking ?? defaultProjectConfig.reranking.enabled,
      },
    });
  }, [activeKb, thread, threadId, updateConfig]);

  const values: ProjectConfig = config ?? defaultProjectConfig;

  // Strict updater ensuring only valid ThreadConfig sections and fields are saved
  const updateSection = <K extends keyof ProjectConfig>(
    section: K,
    patch: Partial<ProjectConfig[K]>
  ) => {
    if (!threadId) return;
    const nextConfig: ProjectConfig = {
      ...values,
      [section]: {
        ...values[section],
        ...patch,
      },
    };
    updateConfig(threadId, nextConfig);
    void saveThreadConfig(threadId, nextConfig);
  };

  const currentProvider: LLMProvider = values.generation.provider || "openai";
  const availableModels = MODEL_OPTIONS[currentProvider] || MODEL_OPTIONS.openai;
  const currentModeInfo = QUERY_TRANSFORMATION_MODES.find(
    (m) => m.value === values.query_transformation.mode
  );

  return (
    <aside
      className={`flex min-h-0 shrink-0 flex-col border-l bg-muted/10 transition-all duration-200 ${isPanelExpanded ? "w-[440px]" : "w-80"
        }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b px-4 py-3.5">
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold">
            <SlidersHorizontal className="size-4 text-primary" />
            <span>Thread Configuration</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Strict RAG execution parameters
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={isPanelExpanded ? "Collapse panel width" : "Expand panel width"}
            title={isPanelExpanded ? "Collapse panel width" : "Expand panel width"}
            onClick={() => setIsPanelExpanded((prev) => !prev)}
          >
            {isPanelExpanded ? (
              <Minimize2 className="size-3.5" />
            ) : (
              <Maximize2 className="size-3.5" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label="Reload settings"
            title="Reload latest settings"
            onClick={() => {
              if (threadId) void refreshThreadConfig(threadId).catch(() => undefined);
            }}
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Body */}
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {/* Pipeline & Knowledge Base Badges */}
        <div className="rounded-lg border bg-background/60 p-3 text-xs shadow-2xs">
          <div className="flex items-center justify-between font-semibold">
            <span>Pipeline version</span>
            <span className="text-primary font-mono text-[11px]">
              v{latestPipelineVersion ?? 1}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            All updates sync strictly to thread metadata.
          </p>
        </div>

        <div className="space-y-1.5 rounded-lg border bg-background/60 p-3 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Database className="size-3.5 text-primary" />
              <span className="truncate">{activeKb ? activeKb.name : "No KB Selected"}</span>
            </div>
            <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
              {selectedDocumentIds?.length ?? 0} / {documents?.length ?? 0} sources active
            </span>
          </div>
          <p className="line-clamp-2 text-[11px] text-muted-foreground">
            {activeKb?.description || "Select or create a knowledge base to populate pipeline specs."}
          </p>
        </div>

        {documents?.length > 0 ? (
          <div className="space-y-3">
            {/* 1. QUERY TRANSFORMATION */}
            <SectionAccordion
              title="Query Transformation"
              badge={values.query_transformation.mode}
              icon={<Sparkles className="size-3.5" />}
              isOpen={openSections.query_transformation}
              onToggle={() => toggleSection("query_transformation")}
            >
              <SelectField
                label="Mode"
                value={values.query_transformation.mode}
                options={QUERY_TRANSFORMATION_MODES.map((m) => ({
                  value: m.value,
                  label: m.label,
                }))}
                onChange={(mode) =>
                  updateSection("query_transformation", {
                    mode: mode as QueryTransformationMode,
                  })
                }
              />
              {currentModeInfo && (
                <p className="rounded bg-muted/50 p-2 text-[11px] text-muted-foreground">
                  {currentModeInfo.description}
                </p>
              )}

              <NumberField
                label="Query count"
                value={values.query_transformation.query_count}
                min={1}
                max={10}
                hint="1 - 10"
                onChange={(query_count) =>
                  updateSection("query_transformation", {
                    query_count: Math.min(10, Math.max(1, query_count)),
                  })
                }
              />

              <ToggleRow
                label="Include original query"
                description="Include the raw user query alongside generated queries"
                checked={values.query_transformation.include_original}
                onChange={(include_original) =>
                  updateSection("query_transformation", { include_original })
                }
              />

              <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Custom prompt template</span>
                  <span className="text-[10px] font-normal text-muted-foreground/75">
                    Optional
                  </span>
                </div>
                <Textarea
                  value={values.query_transformation.prompt_template ?? ""}
                  placeholder="e.g. Rewrite this query: {query} for count: {count}"
                  onChange={(event) => {
                    const text = event.target.value;
                    updateSection("query_transformation", {
                      prompt_template: text.trim() === "" ? null : text,
                    });
                  }}
                  className="min-h-16 text-xs font-mono"
                />
              </label>
            </SectionAccordion>

            {/* 2. RETRIEVAL */}
            <SectionAccordion
              title="Retrieval"
              badge={`k=${values.retrieval.top_k}, α=${values.retrieval.alpha}`}
              icon={<Database className="size-3.5" />}
              isOpen={openSections.retrieval}
              onToggle={() => toggleSection("retrieval")}
            >
              <SelectField
                label="Strategy"
                value={values.retrieval.strategy}
                options={RETRIEVAL_STRATEGIES}
                onChange={(strategy) =>
                  updateSection("retrieval", { strategy: strategy as RetrievalStrategy })
                }
              />

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Alpha (Hybrid)"
                  value={values.retrieval.alpha}
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  hint="0.0 - 1.0"
                  onChange={(alpha) =>
                    updateSection("retrieval", {
                      alpha: Math.min(1.0, Math.max(0.0, alpha)),
                    })
                  }
                />
                <NumberField
                  label="Top K"
                  value={values.retrieval.top_k}
                  min={1}
                  max={100}
                  hint="1 - 100"
                  onChange={(top_k) =>
                    updateSection("retrieval", {
                      top_k: Math.min(100, Math.max(1, top_k)),
                    })
                  }
                />
                <NumberField
                  label="Fetch K"
                  value={values.retrieval.fetch_k}
                  min={1}
                  max={200}
                  hint="1 - 200"
                  onChange={(fetch_k) =>
                    updateSection("retrieval", {
                      fetch_k: Math.min(200, Math.max(1, fetch_k)),
                    })
                  }
                />
                <NumberField
                  label="Similarity threshold"
                  value={values.retrieval.similarity_threshold ?? 0.7}
                  min={-1}
                  max={1}
                  step={0.05}
                  hint="-1.0 - 1.0"
                  onChange={(similarity_threshold) =>
                    updateSection("retrieval", {
                      similarity_threshold: Math.min(1, Math.max(-1, similarity_threshold)),
                    })
                  }
                />
                <NumberField
                  label="MMR lambda"
                  value={values.retrieval.mmr_lambda}
                  min={0}
                  max={1}
                  step={0.05}
                  hint="0.0 - 1.0"
                  onChange={(mmr_lambda) =>
                    updateSection("retrieval", {
                      mmr_lambda: Math.min(1, Math.max(0, mmr_lambda)),
                    })
                  }
                />
              </div>

              <div className="rounded bg-muted/40 p-2 text-[10px] text-muted-foreground">
                <span className="font-semibold text-foreground">Alpha:</span> 0.0 = pure BM25
                sparse search, 1.0 = pure dense vector embedding search.
              </div>

              <SelectField
                label="Sparse model"
                value={values.retrieval.sparse_model}
                options={SPARSE_MODELS}
                onChange={(sparse_model) =>
                  updateSection("retrieval", { sparse_model })
                }
              />

              <div className="grid gap-1.5">
                <SelectField
                  label="Dense model"
                  value={values.retrieval.dense_model}
                  options={DENSE_MODELS}
                  onChange={(dense_model) =>
                    updateSection("retrieval", { dense_model })
                  }
                />
                <Input
                  value={values.retrieval.dense_model}
                  placeholder="Or enter custom embedding model ID"
                  onChange={(e) =>
                    updateSection("retrieval", { dense_model: e.target.value })
                  }
                  className="h-7 text-[11px] font-mono"
                />
              </div>
            </SectionAccordion>

            {/* 3. RERANKING */}
            <SectionAccordion
              title="Reranking"
              badge={values.reranking.enabled ? "Enabled" : "Disabled"}
              icon={<Filter className="size-3.5" />}
              isOpen={openSections.reranking}
              onToggle={() => toggleSection("reranking")}
            >
              <ToggleRow
                label="Enable Reranking"
                description="Run cross-encoder to re-score retrieved passages"
                checked={values.reranking.enabled}
                onChange={(enabled) =>
                  updateSection("reranking", {
                    enabled,
                  })
                }
              />

              {values.reranking.enabled && (
                <>
                  <SelectField
                    label="Reranker Model"
                    value={values.reranking.model}
                    options={RERANKER_MODELS}
                    onChange={(model) =>
                      updateSection("reranking", { model })
                    }
                  />

                  <Input
                    value={values.reranking.model}
                    placeholder="Or enter custom reranker model ID"
                    onChange={(event) =>
                      updateSection("reranking", { model: event.target.value })
                    }
                    className="h-7 text-[11px] font-mono"
                  />

                  <NumberField
                    label="Top N (Post-Rerank)"
                    value={values.reranking.top_n}
                    min={1}
                    max={200}
                    hint="1 - 200"
                    onChange={(top_n) =>
                      updateSection("reranking", {
                        top_n: Math.min(200, Math.max(1, top_n)),
                      })
                    }
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <NumberField
                      label="Top K"
                      value={values.reranking.top_k}
                      min={1}
                      max={100}
                      hint="1 - 100"
                      onChange={(top_k) =>
                        updateSection("reranking", {
                          top_k: Math.min(100, Math.max(1, top_k)),
                        })
                      }
                    />
                    <NumberField
                      label="Batch size"
                      value={values.reranking.batch_size}
                      min={1}
                      max={256}
                      hint="1 - 256"
                      onChange={(batch_size) =>
                        updateSection("reranking", {
                          batch_size: Math.min(256, Math.max(1, batch_size)),
                        })
                      }
                    />
                  </div>

                  <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Score threshold</span>
                      <span className="text-[10px] font-normal text-muted-foreground/75">
                        Optional
                      </span>
                    </div>
                    <Input
                      type="number"
                      step="any"
                      value={values.reranking.score_threshold ?? ""}
                      placeholder="No threshold"
                      onChange={(event) => {
                        const value = event.target.value;
                        if (value !== "" && Number.isNaN(Number(value))) return;
                        updateSection("reranking", {
                          score_threshold: value === "" ? null : Number(value),
                        });
                      }}
                      className="h-8 bg-background text-xs"
                    />
                  </label>

                  <ToggleRow
                    label="Return documents"
                    description="Include reranked documents in the pipeline result"
                    checked={values.reranking.return_documents}
                    onChange={(return_documents) =>
                      updateSection("reranking", { return_documents })
                    }
                  />
                </>
              )}
            </SectionAccordion>

            {/* 4. GENERATION */}
            <SectionAccordion
              title="Generation"
              badge={`${values.generation.provider}: ${values.generation.llm_model}`}
              icon={<Brain className="size-3.5" />}
              isOpen={openSections.generation}
              onToggle={() => toggleSection("generation")}
            >
              <SelectField
                label="Provider"
                value={currentProvider}
                options={[
                  { value: "openai", label: "OpenAI" },
                  { value: "groq", label: "Groq" },
                  { value: "gemini", label: "Gemini" },
                ]}
                onChange={(provider) => {
                  const newProvider = provider as LLMProvider;
                  const defaultModel =
                    MODEL_OPTIONS[newProvider]?.[0]?.value || "gpt-4o";
                  updateSection("generation", {
                    provider: newProvider,
                    llm_model: defaultModel,
                  });
                }}
              />

              <div className="grid gap-1.5">
                <SelectField
                  label="Model"
                  value={values.generation.llm_model}
                  options={availableModels}
                  onChange={(llm_model) =>
                    updateSection("generation", { llm_model })
                  }
                />
                <Input
                  value={values.generation.llm_model}
                  placeholder="Or enter custom model ID"
                  onChange={(e) =>
                    updateSection("generation", { llm_model: e.target.value })
                  }
                  className="h-7 text-[11px] font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <NumberField
                  label="Temperature"
                  value={values.generation.temperature}
                  min={0.0}
                  max={2.0}
                  step={0.05}
                  hint="0.0 - 2.0"
                  onChange={(temperature) =>
                    updateSection("generation", {
                      temperature: Math.min(2.0, Math.max(0.0, temperature)),
                    })
                  }
                />
                <NumberField
                  label="Max Tokens"
                  value={values.generation.max_tokens}
                  min={1}
                  max={32000}
                  step={100}
                  hint="1 - 32,000"
                  onChange={(max_tokens) =>
                    updateSection("generation", {
                      max_tokens: Math.min(32000, Math.max(1, max_tokens)),
                    })
                  }
                />
              </div>

              <ToggleRow
                label="Stream Response"
                description="Stream tokens live during answer generation"
                checked={values.generation.stream}
                onChange={(stream) =>
                  updateSection("generation", { stream })
                }
              />

              <ToggleRow
                label="Enforce Citations"
                description="Require grounded citations in the generated response"
                checked={values.generation.citation_enforced}
                onChange={(citation_enforced) =>
                  updateSection("generation", { citation_enforced })
                }
              />
            </SectionAccordion>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 rounded-lg border bg-background/60 p-4 text-center text-xs text-muted-foreground shadow-2xs">
            <Database className="size-5 text-primary" />
            <p>No documents found</p>
            <p className="text-[10px]">
              Add one or more documents to configure RAG settings.
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
