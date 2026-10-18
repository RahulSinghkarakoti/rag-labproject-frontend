"use client";

import { useEffect, useState } from "react";
import {
  Brain,
  ChevronDown,
  Database,
  FileText,
  Filter,
  Info,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { getThreadConfig } from "@/lib/thread-api";
import { api } from "@/lib/api";
import { useThreadStore } from "@/lib/thread-store";
import {
  defaultProjectConfig,
  useDocumentStore,
  useKnowledgeBaseStore,
  useThreadConfigStore,
  type ProjectConfig,
  type DocumentItem,
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
  // openai: [
  //   { value: "gpt-4o", label: "GPT-4o" },
  //   { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  //   { value: "gpt-4-turbo", label: "GPT-4 Turbo" },
  //   { value: "o1-mini", label: "o1 Mini" },
  //   { value: "o3-mini", label: "o3 Mini" },
  // ],
  groq: [
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

type FieldInfo = {
  description: string;
  whenToUse: string;
};

function FieldInfoButton({ label, info }: { label: string; info?: FieldInfo }) {
  if (!info) return null;

  return (
    <Dialog>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <DialogTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                aria-label={`Learn about ${label}`}
                className="size-5 rounded-full text-muted-foreground hover:text-foreground"
              >
                <Info className="size-3" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top">Learn about {label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>{info.description}</DialogDescription>
        </DialogHeader>
        <div className="rounded-md bg-muted/50 p-3 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">When to use: </span>
          {info.whenToUse}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FieldLabel({ label, hint, info }: { label: string; hint?: string; info?: FieldInfo }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex items-center gap-0.5">
        <span>{label}</span>
        <FieldInfoButton label={label} info={info} />
      </div>
      {hint && <span className="text-[10px] font-normal text-muted-foreground/75">{hint}</span>}
    </div>
  );
}

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
  info,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  hint?: string;
  info?: FieldInfo;
}) {
  return (
    <div className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      <FieldLabel label={label} hint={hint} info={info} />
      <select
        aria-label={label}
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
    </div>
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
  info,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  hint?: string;
  info?: FieldInfo;
}) {
  return (
    <div className="grid gap-1.5 text-xs font-medium text-muted-foreground">
      <FieldLabel label={label} hint={hint} info={info} />
      <Input
        aria-label={label}
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
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  description,
  info,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  info?: FieldInfo;
}) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs">
      <div className="grid gap-0.5">
        <span className="flex items-center font-medium text-foreground">
          {label}
          <FieldInfoButton label={label} info={info} />
        </span>
        {description && <span className="text-[11px] text-muted-foreground">{description}</span>}
      </div>
      <input
        aria-label={label}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-primary"
      />
    </div>
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
    knowledge_bases: false,
    query_transformation: false,
    retrieval: false,
    reranking: false,
    generation: false,
  });

  const toggleSection = (key: string) => {
    setOpenSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const [threadDocuments, setThreadDocuments] = useState<Record<string, DocumentItem[]>>({});
  const [documentsLoading, setDocumentsLoading] = useState(false);

  useEffect(() => {
    if (!openSections.knowledge_bases || !thread?.knowledge_bases?.length) return;
    let cancelled = false;
    setThreadDocuments({});
    setDocumentsLoading(true);
    Promise.all(
      thread.knowledge_bases.map(async (kb) => {
        const documents = await api.get<DocumentItem[]>(
          `/api/projects/${thread.project_id}/knowledge-bases/${kb.id}/documents`,
        );
        return [kb.id, Array.isArray(documents) ? documents : []] as const;
      }),
    )
      .then((entries) => {
        if (!cancelled) setThreadDocuments(Object.fromEntries(entries));
      })
      .catch(() => {
        if (!cancelled) setThreadDocuments({});
      })
      .finally(() => {
        if (!cancelled) setDocumentsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [openSections.knowledge_bases, thread]);

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
  const availableModels = MODEL_OPTIONS[currentProvider] || MODEL_OPTIONS.groq;
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
        {/* <div className="rounded-lg border bg-background/60 p-3 text-xs shadow-2xs">
          <div className="flex items-center justify-between font-semibold">
            <span>Pipeline version</span>
            <span className="text-primary font-mono text-[11px]">
              v{latestPipelineVersion ?? 1}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            All updates sync strictly to thread metadata.
          </p>
        </div> */}
 
        <SectionAccordion
          title="Knowledge bases"
          badge={`${thread?.knowledge_bases?.length ?? 0}`}
          icon={<Database className="size-3.5" />}
          isOpen={openSections.knowledge_bases}
          onToggle={() => toggleSection("knowledge_bases")}
        >
          {!thread?.knowledge_bases?.length ? (
            <p className="text-[11px] text-muted-foreground">No knowledge bases attached to this thread.</p>
          ) : documentsLoading ? (
            <p className="text-[11px] text-muted-foreground">Loading documents…</p>
          ) : (
            <div className="space-y-2">
              {thread.knowledge_bases.map((kb) => {
                const kbDocuments = threadDocuments[kb.id] ?? [];
                return (
                  <div key={kb.id} className="rounded-md border bg-background px-2.5 py-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-xs font-semibold">{kb.name}</span>
                      <span className="shrink-0 text-[10px] text-muted-foreground">{kbDocuments.length} docs</span>
                    </div>
                    {kbDocuments.length ? (
                      <div className="mt-1.5 space-y-1 border-t pt-1.5">
                        {kbDocuments.map((document) => (
                          <div key={document.id} className="flex min-w-0 items-center gap-1.5 text-[10px] text-muted-foreground">
                            <FileText className="size-3 shrink-0" />
                            <span className="truncate">{document.name}</span>
                            <span className="ml-auto shrink-0">{document.status}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-1 text-[10px] text-muted-foreground">No documents</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </SectionAccordion>

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
                info={{ description: "Chooses how the user's question is prepared before retrieval.", whenToUse: "Keep None for straightforward questions; use Rewrite for follow-ups, HyDE or Multi-Query when recall is more important than latency, and Step-Back or Sub-Queries for complex questions." }}
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
                info={{ description: "The number of transformed queries generated for one user question.", whenToUse: "Increase it when one wording misses relevant documents; leave it low for faster, cheaper retrieval." }}
                onChange={(query_count) =>
                  updateSection("query_transformation", {
                    query_count: Math.min(10, Math.max(1, query_count)),
                  })
                }
              />

              <ToggleRow
                label="Include original query"
                description="Include the raw user query alongside generated queries"
                info={{ description: "Keeps the original question in the retrieval set in addition to transformed queries.", whenToUse: "Enable it when transformations may lose exact names, identifiers, or wording." }}
                checked={values.query_transformation.include_original}
                onChange={(include_original) =>
                  updateSection("query_transformation", { include_original })
                }
              />

              <div className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">Custom prompt template<FieldInfoButton label="Custom prompt template" info={{ description: "An optional instruction used to customize query transformation. The template can use the query and count placeholders.", whenToUse: "Use it only when the built-in transformation behavior does not match your domain or question style." }} /></span>
                  <span className="text-[10px] font-normal text-muted-foreground/75">
                    Optional
                  </span>
                </div>
                <Textarea
                  aria-label="Custom prompt template"
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
              </div>
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
                info={{ description: "Selects the search method used to find candidate passages.", whenToUse: "Use Hybrid for a balance of keyword and semantic matching, Dense for meaning-based search, Sparse for exact terms, or MMR for more diverse results." }}
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
                  info={{ description: "Balances sparse keyword search against dense embedding search. 0 is sparse; 1 is dense.", whenToUse: "Raise it for conceptual questions; lower it when exact terms, IDs, or names matter." }}
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
                  info={{ description: "The number of passages returned to the answer pipeline after retrieval.", whenToUse: "Increase it when answers need broader context; lower it to reduce noise and latency." }}
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
                  info={{ description: "The number of candidates fetched before later filtering, diversity selection, or reranking.", whenToUse: "Set it higher than Top K when using MMR or reranking and you want more candidates to compare." }}
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
                  info={{ description: "Excludes retrieved passages whose similarity score is below this value.", whenToUse: "Use it to remove weak matches; raise it for precision, or lower it when recall is more important." }}
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
                  info={{ description: "Controls the MMR trade-off between relevance and diversity. 1 favors relevance; 0 favors diversity.", whenToUse: "Use it with MMR: raise it for focused answers and lower it when results are repetitive." }}
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
                info={{ description: "The lexical search algorithm used for sparse retrieval.", whenToUse: "Use the default BM25 for keyword, phrase, and identifier matching." }}
                onChange={(sparse_model) =>
                  updateSection("retrieval", { sparse_model })
                }
              />

              <div className="grid gap-1.5">
                <SelectField
                  label="Dense model"
                  value={values.retrieval.dense_model}
                  options={DENSE_MODELS}
                  info={{ description: "The embedding model used to compare the meaning of queries and passages.", whenToUse: "Choose a model compatible with the knowledge base; use a larger model when semantic quality matters more than speed." }}
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
                info={{ description: "Runs a second relevance model over retrieved passages to improve their ordering.", whenToUse: "Enable it when retrieval returns plausible but poorly ordered results; disable it to reduce latency and compute." }}
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
                    info={{ description: "The cross-encoder model that scores query-passage relevance.", whenToUse: "Use the base model for lower cost or the larger model when ranking quality is more important." }}
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
                    info={{ description: "The maximum number of passages kept after reranking.", whenToUse: "Increase it when the final answer needs more supporting context; keep it near Top K for concise context." }}
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
                      info={{ description: "The number of retrieved candidates sent into the reranker.", whenToUse: "Increase it when relevant passages are being missed, at the cost of reranking time." }}
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
                      info={{ description: "How many passages the reranker scores in one batch.", whenToUse: "Increase it for throughput if memory allows; lower it when the reranker uses too much memory." }}
                      onChange={(batch_size) =>
                        updateSection("reranking", {
                          batch_size: Math.min(256, Math.max(1, batch_size)),
                        })
                      }
                    />
                  </div>

                  <div className="grid gap-1.5 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center">Score threshold<FieldInfoButton label="Score threshold" info={{ description: "An optional minimum reranker score; passages below it are excluded.", whenToUse: "Use it when low-quality matches should never reach generation; leave empty when score scales vary by model." }} /></span>
                      <span className="text-[10px] font-normal text-muted-foreground/75">
                        Optional
                      </span>
                    </div>
                    <Input
                      aria-label="Score threshold"
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
                  </div>

                  <ToggleRow
                    label="Return documents"
                    description="Include reranked documents in the pipeline result"
                    info={{ description: "Includes the final reranked passages in the pipeline response for downstream use or inspection.", whenToUse: "Enable it when the client needs source documents; disable it to return only the generated answer." }}
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
                info={{ description: "The service that runs answer generation.", whenToUse: "Choose the provider configured for your deployment and preferred latency, cost, or model availability." }}
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
                  info={{ description: "The language model used to write the final response.", whenToUse: "Choose a stronger model for difficult synthesis or a faster model for simple, low-latency answers." }}
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
                  info={{ description: "Controls randomness in generated text. Lower values are more consistent; higher values are more varied.", whenToUse: "Use a low value for factual RAG answers and raise it only when more creative wording is wanted." }}
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
                  info={{ description: "The maximum number of tokens allowed in the generated response.", whenToUse: "Increase it for long answers; keep it lower to control cost and prevent unnecessarily verbose output." }}
                  onChange={(max_tokens) =>
                    updateSection("generation", {
                      max_tokens: Math.min(32000, Math.max(1, max_tokens)),
                    })
                  }
                />
              </div>

              <ToggleRow
                label="Enforce Citations"
                description="Require grounded citations in the generated response"
                info={{ description: "Requires the answer to include citations grounded in retrieved source material.", whenToUse: "Enable it when traceability matters; keep it off when citations are not supported by the selected pipeline." }}
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
