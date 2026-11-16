"use client";

import { useEffect, useMemo, useState } from "react";
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
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogBody,
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
import { cn } from "@/lib/utils";
import { useThreadStore } from "@/lib/thread-store";
import {
  defaultProjectConfig,
  useDocumentStore,
  useKnowledgeBaseStore,
  useThreadConfigStore,
  type ProjectConfig,
  type DocumentItem,
  type KnowledgeBase,
} from "@/lib/store";
import { KbDetailsDialog } from "@/components/project/kb-details-dialog";
import type {
  ChatMode,
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
  groq: [
    { value: "openai/gpt-oss-120b", label: "GPT-OSS 120B" },
    { value: "openai/gpt-oss-20b", label: "GPT-OSS 20B" },
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

const CHAT_MODES = [
  { value: "conversational", label: "Conversational (Gemini/ChatGPT)" },
  { value: "strict", label: "Strict Q&A (Extractive)" },
];

type FieldInfo = {
  description: string;
  whenInPicture: string;
  desiredValue: string;
  impactOnOutput: string;
  consequences?: string;
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
                className="size-4 rounded-none text-muted-foreground hover:text-accent"
              >
                <Info className="size-3" />
              </Button>
            </DialogTrigger>
          </TooltipTrigger>
          <TooltipContent side="top" className="font-mono text-xs bg-popover border border-border text-popover-foreground">
            Learn about {label}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <DialogContent className="max-w-md bg-[#0a0a0f] border-[#2a2a3a] text-foreground font-mono">
        <DialogHeader>
          <DialogTitle className="text-accent text-sm font-bold uppercase tracking-wider">&gt; {label}</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-1 leading-relaxed">{info.description}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="cyber-chamfer-sm border border-[#2a2a3a] p-3 space-y-2.5 bg-[#12121a]">
            <div className="flex flex-col">
              <span className="text-accent text-[10px] font-bold uppercase tracking-wider mb-0.5">When It Comes Into Picture</span>
              <span className="text-[11px] text-muted-foreground leading-relaxed">{info.whenInPicture}</span>
            </div>
            <div className="flex flex-col border-t border-[#2a2a3a] pt-2">
              <span className="text-accent text-[10px] font-bold uppercase tracking-wider mb-0.5">Recommended / Desired Value</span>
              <span className="text-[11px] text-foreground font-semibold leading-relaxed">{info.desiredValue}</span>
            </div>
            <div className="flex flex-col border-t border-[#2a2a3a] pt-2">
              <span className="text-accent text-[10px] font-bold uppercase tracking-wider mb-0.5">How Value Affects Output</span>
              <span className="text-[11px] text-muted-foreground leading-relaxed">{info.impactOnOutput}</span>
            </div>
            {info.consequences && (
              <div className="flex flex-col border-t border-destructive/30 pt-2">
                <span className="text-destructive text-[10px] font-bold uppercase tracking-wider mb-0.5">Warning / Pitfall</span>
                <span className="text-destructive/90 text-[11px] leading-relaxed">{info.consequences}</span>
              </div>
            )}
          </div>
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}

function FieldLabel({ label, hint, info }: { label: string; hint?: string; info?: FieldInfo }) {
  return (
    <div className="flex items-center justify-between gap-2 font-mono">
      <div className="flex items-center gap-0.5">
        <span className="uppercase text-[11px] font-bold text-foreground">{label}</span>
        <FieldInfoButton label={label} info={info} />
      </div>
      {hint && <span className="text-[9px] font-mono text-muted-foreground">{hint}</span>}
    </div>
  );
}

const RERANKER_MODELS = [
  { value: "cross-encoder/ms-marco-MiniLM-L-6-v2", label: "cross-encoder/ms-marco-MiniLM-L-6-v2 (Fast / 22M params)" },
  { value: "BAAI/bge-reranker-base", label: "BAAI/bge-reranker-base (Balanced / 278M params)" },
  { value: "BAAI/bge-reranker-large", label: "BAAI/bge-reranker-large (High Accuracy / 560M params)" },
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
  const resolvedOptions = options.some((o) => o.value === value)
    ? options
    : value
      ? [...options, { value, label: value }]
      : options;

  return (
    <div className="grid gap-1.5 text-xs font-mono font-medium text-muted-foreground">
      <FieldLabel label={label} hint={hint} info={info} />
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-8 w-full bg-[#0a0a0f] border border-[#2a2a3a] cyber-chamfer-sm px-2.5 text-xs font-mono text-foreground outline-none focus:border-accent"
      >
        {resolvedOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function SliderField({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  hint,
  info,
  unit,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  hint?: string;
  info?: FieldInfo;
  unit?: string;
}) {
  const [localText, setLocalText] = useState(String(value));

  useEffect(() => {
    setLocalText(String(value));
  }, [value]);

  const precision = step.toString().split(".")[1]?.length ?? 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setLocalText(raw);
    const parsed = parseFloat(raw);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      const rounded = Number(clamped.toFixed(precision));
      onChange(rounded);
    }
  };

  const handleBlur = () => {
    const parsed = parseFloat(localText);
    if (isNaN(parsed)) {
      setLocalText(String(value));
    } else {
      const clamped = Math.min(max, Math.max(min, parsed));
      const rounded = Number(clamped.toFixed(precision));
      onChange(rounded);
      setLocalText(String(rounded));
    }
  };

  const handleSliderChange = (vals: number[]) => {
    const nextVal = vals[0];
    if (nextVal !== undefined) {
      const rounded = Number(nextVal.toFixed(precision));
      onChange(rounded);
      setLocalText(String(rounded));
    }
  };

  return (
    <div className="grid gap-1.5 text-xs font-mono font-medium text-muted-foreground p-2 border border-[#2a2a3a] bg-[#12121a]/80 cyber-chamfer-sm">
      <div className="flex items-center justify-between gap-1.5">
        <div className="flex items-center gap-0.5 min-w-0">
          <span className="uppercase text-[11px] font-bold text-foreground truncate" title={label}>
            {label}
          </span>
          <FieldInfoButton label={label} info={info} />
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <input
            type="number"
            min={min}
            max={max}
            step={step}
            value={localText}
            onChange={handleInputChange}
            onBlur={handleBlur}
            aria-label={label}
            className="h-5.5 w-14 bg-[#0a0a0f] border border-[#2a2a3a] px-1 text-right font-mono text-[10px] font-bold text-accent outline-none focus:border-accent cyber-chamfer-xs"
          />
          {unit && <span className="text-[9px] text-muted-foreground">{unit}</span>}
        </div>
      </div>

      <div className="pt-0.5">
        <Slider
          value={[value]}
          min={min}
          max={max}
          step={step}
          onValueChange={handleSliderChange}
          aria-label={label}
        />
      </div>

      <div className="flex items-center justify-between text-[9px] text-muted-foreground/80 font-mono -mt-0.5">
        <span className="text-[8.5px]">{min}</span>
        {hint && <span className="text-[8px] text-muted-foreground/90 uppercase tracking-tight">{hint}</span>}
        <span className="text-[8.5px]">{max}</span>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  description,
  info,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
  description?: string;
  info?: FieldInfo;
  disabled?: boolean;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3 text-xs font-mono", disabled && "opacity-50")}>
      <div className="grid gap-0.5">
        <span className="flex items-center font-bold uppercase text-foreground">
          {label}
          <FieldInfoButton label={label} info={info} />
        </span>
        {description && <span className="text-[10px] text-muted-foreground">{description}</span>}
      </div>
      <input
        aria-label={label}
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-0.5 size-4 accent-accent cursor-pointer disabled:cursor-not-allowed"
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
    <Collapsible open={isOpen} onOpenChange={onToggle} className="cyber-chamfer-sm border border-[#2a2a3a] bg-[#12121a] font-mono transition-none">
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className="flex w-full items-center justify-between px-3 py-2.5 text-left transition-none hover:bg-[#1c1c2e]"
        >
          <div className="flex items-center gap-2">
            <span className="text-accent">{icon}</span>
            <span className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</span>
            {badge && (
              <span className="cyber-chamfer-sm bg-accent/20 px-1.5 py-0.5 text-[9px] font-bold uppercase text-accent border border-accent/40">
                {badge}
              </span>
            )}
          </div>
          <ChevronDown
            className={`size-4 text-accent transition-none ${isOpen ? "rotate-180" : ""
              }`}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-[#2a2a3a] px-3 py-3 space-y-3 bg-[#0a0a0f]">
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
  const documents = useDocumentStore((state) =>
    Array.isArray(state?.documents) ? state.documents : []
  );

  const [isPanelExpanded, setIsPanelExpanded] = useState<boolean>(false);

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
  const [selectedInspectKb, setSelectedInspectKb] = useState<KnowledgeBase | null>(null);

  useEffect(() => {
    if (!openSections.knowledge_bases || !thread?.knowledge_bases?.length) return;
    let cancelled = false;
    setThreadDocuments({});
    setDocumentsLoading(true);
    Promise.all(
      thread.knowledge_bases.map(async (kb) => {
        const documents = await api.get<DocumentItem[]>(
          `/projects/${thread.project_id}/knowledge-bases/${kb.id}/documents`,
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

  const currentProvider: LLMProvider = values.generation.provider || "groq";
  const availableModels = MODEL_OPTIONS[currentProvider] || MODEL_OPTIONS.groq;
  const currentModeInfo = QUERY_TRANSFORMATION_MODES.find(
    (m) => m.value === values.query_transformation.mode
  );

  const readyAttachedKbs = useMemo(() => {
    if (!thread?.knowledge_bases) return [];
    return thread.knowledge_bases
      .map((kb) => knowledgeBases.find((k) => k.id === kb.id) ?? kb)
      .filter((kb) => {
        const docCount = threadDocuments[kb.id]?.length ?? kb.document_count ?? 0;
        return docCount > 0;
      });
  }, [thread?.knowledge_bases, knowledgeBases, threadDocuments]);

  const detectedDenseModel = useMemo(() => {
    const kbWithEmbedding =
      readyAttachedKbs.find((kb) => kb.embedding_config?.model) ??
      thread?.knowledge_bases?.find((kb) => kb.embedding_config?.model) ??
      activeKb;
    return (
      kbWithEmbedding?.embedding_config?.model ??
      values.retrieval.dense_model ??
      "all-MiniLM-L6-v2"
    );
  }, [readyAttachedKbs, thread?.knowledge_bases, activeKb, values.retrieval.dense_model]);

  useEffect(() => {
    if (!threadId) return;
    if (detectedDenseModel && config?.retrieval?.dense_model !== detectedDenseModel) {
      updateConfig(threadId, {
        retrieval: {
          ...values.retrieval,
          dense_model: detectedDenseModel,
        },
      });
    }
  }, [threadId, detectedDenseModel, config?.retrieval?.dense_model, updateConfig, values.retrieval]);

  const retrievalBadge = useMemo(() => {
    if (values.retrieval.strategy === "hybrid") {
      return `k=${values.retrieval.top_k}, α=${values.retrieval.alpha}`;
    }
    if (values.retrieval.strategy === "mmr") {
      return `k=${values.retrieval.top_k}, λ=${values.retrieval.mmr_lambda ?? 0.5}`;
    }
    return `k=${values.retrieval.top_k}, ${values.retrieval.strategy.toUpperCase()}`;
  }, [values.retrieval.strategy, values.retrieval.top_k, values.retrieval.alpha, values.retrieval.mmr_lambda]);

  const showFetchK =
    values.retrieval.strategy === "mmr" ||
    values.retrieval.strategy === "hybrid" ||
    values.reranking.enabled;

  return (
    <aside
      className={`flex min-h-0 shrink-0 flex-col border-l border-[#2a2a3a] bg-[#0a0a0f] font-mono transition-none ${isPanelExpanded ? "w-[440px]" : "w-80"
        }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#2a2a3a] px-4 py-3 bg-[#12121a]">
        <div className="min-w-0 flex-1 mr-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
            <SlidersHorizontal className="size-4 text-accent shrink-0" />
            <span className="truncate">&gt; THREAD_CONFIG</span>
          </div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[10px] text-accent font-bold truncate">
            <span className="text-muted-foreground uppercase shrink-0">SESSION:</span>
            <span className="truncate" title={thread?.title ?? "UNTITLED_THREAD"}>
              {thread?.title ?? "UNTITLED_THREAD"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={isPanelExpanded ? "Collapse panel width" : "Expand panel width"}
            title={isPanelExpanded ? "Collapse panel width" : "Expand panel width"}
            onClick={() => setIsPanelExpanded((prev) => !prev)}
            className="hover:text-accent"
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
            className="hover:text-accent"
          >
            <RotateCcw className="size-3.5" />
          </Button>
        </div>
      </div>

      {/* Main Body */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {readyAttachedKbs.length > 0 && (
          <SectionAccordion
            title="KNOWLEDGE_BASES"
            badge={`${readyAttachedKbs.length}`}
            icon={<Database className="size-3.5" />}
            isOpen={openSections.knowledge_bases}
            onToggle={() => toggleSection("knowledge_bases")}
          >
            {documentsLoading ? (
              <p className="text-[10px] uppercase text-muted-foreground">LOADING_DOCUMENTS...</p>
            ) : (
              <div className="space-y-2">
                {readyAttachedKbs.map((kb) => {
                  const kbDocuments = threadDocuments[kb.id] ?? [];
                  const chunkStrategy = kb.chunking_config?.strategy ?? "recursive";
                  const chunkSize = kb.chunking_config?.chunk_size ?? 512;
                  const chunkOverlap = kb.chunking_config?.chunk_overlap ?? 50;
                  const embedModel = kb.embedding_config?.model?.split("/").pop() ?? kb.embedding_config?.model ?? "bge-large";

                  return (
                    <div key={kb.id} className="cyber-chamfer-sm border border-[#2a2a3a] bg-[#12121a] px-2.5 py-2">
                      <div className="flex items-center justify-between gap-2 font-bold uppercase text-xs">
                        <span className="truncate text-foreground" title={kb.name}>{kb.name}</span>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[9px] text-accent">{kbDocuments.length || kb.document_count || 0} DOCS</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-xs"
                            onClick={() => setSelectedInspectKb(kb)}
                            className="size-4 rounded-none text-muted-foreground hover:text-accent hover:bg-[#1c1c2e] p-0"
                            title="Inspect Knowledge Base specifications"
                            aria-label={`Inspect configuration for ${kb.name}`}
                          >
                            <Info className="size-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Inline specs card */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => setSelectedInspectKb(kb)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedInspectKb(kb);
                          }
                        }}
                        className="mt-2 grid grid-cols-2 gap-1.5 border border-[#2a2a3a]/80 bg-[#0a0a0f] p-1.5 text-[9px] cursor-pointer hover:border-accent/40 transition-colors group select-none"
                        title="Click to open full KB specification dialog"
                      >
                        <div className="min-w-0">
                          <div className="text-[8px] text-muted-foreground uppercase flex items-center justify-between">
                            <span>CHUNKING</span>
                            <span className="text-[8px] text-accent/70 group-hover:text-accent">[SPECS]</span>
                          </div>
                          <p className="font-bold text-foreground uppercase truncate">
                            {chunkStrategy}
                          </p>
                          <p className="text-[8px] text-muted-foreground">
                            {chunkSize} / {chunkOverlap}
                          </p>
                        </div>
                        <div className="min-w-0 border-l border-[#2a2a3a]/60 pl-1.5">
                          <span className="text-[8px] text-muted-foreground uppercase">EMBEDDING</span>
                          <p className="font-bold text-accent uppercase truncate" title={kb.embedding_config?.model}>
                            {embedModel}
                          </p>
                          <p className="text-[8px] text-muted-foreground uppercase">
                            {kb.embedding_config?.provider ? `${kb.embedding_config.provider.toUpperCase()} VECTOR` : "DENSE_VECTOR"}
                          </p>
                        </div>
                      </div>

                      {kbDocuments.length ? (
                        <div className="mt-2 space-y-1 border-t border-[#2a2a3a] pt-1.5">
                          {kbDocuments.map((document) => (
                            <div key={document.id} className="flex min-w-0 items-center gap-1.5 text-[9px] text-muted-foreground">
                              <FileText className="size-3 shrink-0 text-accent" />
                              <span className="truncate">{document.name}</span>
                              <span className="ml-auto shrink-0 uppercase">{document.status}</span>
                            </div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            )}
          </SectionAccordion>
        )}

        {(documents?.length > 0 || readyAttachedKbs.length > 0) ? (
          <div className="space-y-3">
            {/* 1. QUERY TRANSFORMATION */}
            <SectionAccordion
              title="QUERY_TRANSFORMATION"
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
                info={{
                  description: "Determines how the user's input question is pre-processed and reformulated before vector and keyword searches execute.",
                  whenInPicture: "Step 1 of the pipeline, running immediately when you send a message before any document retrieval occurs.",
                  desiredValue: "None for direct factual questions; Rewrite for conversational threads and pronoun resolution; HyDE or Multi-Query when recall is weak.",
                  impactOnOutput: "None passes query untouched (fastest, zero extra latency). Rewrite replaces ambiguous references ('it', 'those configs') with exact entity names from chat history. HyDE generates an imaginary answer passage to find matches via semantic density. Multi-Query generates multiple phrasing angles to broaden document coverage.",
                  consequences: "Complex modes (HyDE, Multi-Query, Sub-Queries) require an upfront LLM call adding 300–800ms latency. HyDE may hallucinate imaginary facts if asking about obscure proprietary terms.",
                }}
                onChange={(mode) =>
                  updateSection("query_transformation", {
                    mode: mode as QueryTransformationMode,
                  })
                }
              />
              {currentModeInfo && (
                <p className="cyber-chamfer-sm border border-[#2a2a3a] bg-[#12121a] p-2 text-[10px] text-muted-foreground">
                  {currentModeInfo.description}
                </p>
              )}

              {values.query_transformation.mode !== "none" && (
                <>
                  <SliderField
                    label="Query Count"
                    value={values.query_transformation.query_count}
                    min={1}
                    max={10}
                    hint="1 - 10 queries"
                    info={{
                      description: "The number of alternative queries or sub-questions generated during transformation.",
                      whenInPicture: "Active when transformation mode is Multi-Query, Sub-Queries, or Step-Back.",
                      desiredValue: "2 - 4 queries (Default: 3).",
                      impactOnOutput: "Higher values (4-10) maximize recall by searching diverse angles, but multiply retrieval deduplication work and latency. Lower values (1-2) offer faster execution with tighter search focus.",
                      consequences: "Setting above 5 increases retrieval latency and risks pulling in tangentially related or noisy chunks.",
                    }}
                    onChange={(query_count) =>
                      updateSection("query_transformation", {
                        query_count: Math.min(10, Math.max(1, query_count)),
                      })
                    }
                  />

                  <ToggleRow
                    label="Include Original Query"
                    description="Include raw query in retrieval batch"
                    info={{
                      description: "Guarantees that the raw, unmodified user question is always included in the retrieval batch alongside generated queries.",
                      whenInPicture: "Active when transformation mode is anything other than None.",
                      desiredValue: "Enabled (Checked).",
                      impactOnOutput: "Prevents critical exact keywords, model numbers, error codes, and proper nouns from being lost if the LLM paraphrases the question too aggressively.",
                      consequences: "If disabled and the LLM rewrites the query with synonyms, BM25 keyword matching may fail to locate exact matches.",
                    }}
                    checked={values.query_transformation.include_original}
                    onChange={(include_original) =>
                      updateSection("query_transformation", { include_original })
                    }
                  />

                  <div className="grid gap-1.5 text-xs font-mono font-medium text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center uppercase font-bold text-foreground">Custom Prompt Template<FieldInfoButton label="Custom Prompt Template" info={{
                        description: "An optional custom prompt template overriding system instructions for query rewriting.",
                        whenInPicture: "Step 1 transformation when you need specialized domain prompt instructions or language translation rules.",
                        desiredValue: "Leave empty (uses optimized default prompt), or specify instructions containing {query} and {count}.",
                        impactOnOutput: "Allows enforcing domain extraction rules, language translation, or strict question decomposition.",
                        consequences: "If template instructions fail to output distinct separated queries, query parsing may fail and fallback to the original query.",
                      }} /></span>
                    </div>
                    <Textarea
                      aria-label="Custom prompt template"
                      value={values.query_transformation.prompt_template ?? ""}
                      placeholder="e.g. Rewrite query: {query} count: {count}"
                      onChange={(event) => {
                        const text = event.target.value;
                        updateSection("query_transformation", {
                          prompt_template: text.trim() === "" ? null : text,
                        });
                      }}
                      className="min-h-16 text-[11px] font-mono"
                    />
                  </div>
                </>
              )}
            </SectionAccordion>

            {/* 2. RETRIEVAL */}
            <SectionAccordion
              title="RETRIEVAL"
              badge={retrievalBadge}
              icon={<Database className="size-3.5" />}
              isOpen={openSections.retrieval}
              onToggle={() => toggleSection("retrieval")}
            >
              <SelectField
                label="Strategy"
                value={values.retrieval.strategy}
                options={RETRIEVAL_STRATEGIES}
                info={{
                  description: "Selects the search algorithm used to find candidate passages from knowledge base indexes.",
                  whenInPicture: "Step 2 of the pipeline; queries the Qdrant vector database and BM25 lexical index.",
                  desiredValue: "Hybrid (Recommended for best recall and keyword precision).",
                  impactOnOutput: "Hybrid combines vector semantic matches and BM25 keyword matches, excelling at both concepts and specific codes. Dense relies purely on cosine similarity (great for concepts, weak on exact part numbers or acronyms). Sparse uses pure BM25 (great for exact names, misses synonyms). MMR balances semantic relevance with passage diversity.",
                }}
                onChange={(strategy) =>
                  updateSection("retrieval", { strategy: strategy as RetrievalStrategy })
                }
              />

              <div className="space-y-2">
                {values.retrieval.strategy === "hybrid" && (
                  <SliderField
                    label="Alpha (Hybrid)"
                    value={values.retrieval.alpha}
                    min={0.0}
                    max={1.0}
                    step={0.05}
                    hint="0.0 Sparse · 1.0 Dense"
                    info={{
                      description: "Balances sparse BM25 keyword matching against dense vector embedding search in hybrid reciprocal fusion.",
                      whenInPicture: "Active only when Retrieval Strategy is set to Hybrid.",
                      desiredValue: "0.50 (Balanced 50/50).",
                      impactOnOutput: "Values closer to 1.0 favor conceptual meaning and conversational questions. Values closer to 0.0 favor exact strings, error codes, function names, and part numbers.",
                      consequences: "Setting to 0.0 or 1.0 completely eliminates the benefit of hybrid search by ignoring one entire modality.",
                    }}
                    onChange={(alpha) =>
                      updateSection("retrieval", {
                        alpha: Math.min(1.0, Math.max(0.0, alpha)),
                      })
                    }
                  />
                )}
                <div className={showFetchK ? "grid grid-cols-2 gap-2" : "space-y-2"}>
                  <SliderField
                    label="Top K"
                    value={values.retrieval.top_k}
                    min={1}
                    max={100}
                    step={1}
                    hint="Candidates"
                    info={{
                      description: "The target number of top-ranked document passages returned by retrieval.",
                      whenInPicture: "When Reranking is OFF, this is the exact number of chunks passed to the LLM. When Reranking is ON, it serves as a safety floor ensuring retrieval never fetches fewer than Top K candidates.",
                      desiredValue: "4 - 8 passages (Default: 4).",
                      impactOnOutput: "Higher values (10-20) provide broader background context but increase token costs and risk attention dilution. Lower values (2-4) provide concise, focused context.",
                      consequences: "Setting too low (< 3) often starves the LLM of necessary context, forcing it to state that it cannot answer or to hallucinate missing facts.",
                    }}
                    onChange={(top_k) =>
                      updateSection("retrieval", {
                        top_k: Math.min(100, Math.max(1, top_k)),
                      })
                    }
                  />
                  {showFetchK && (
                    <SliderField
                      label="Fetch K"
                      value={values.retrieval.fetch_k}
                      min={1}
                      max={200}
                      step={1}
                      hint={values.reranking.enabled ? "Pre-rerank" : "Pre-filter"}
                      info={{
                        description: "The initial candidate pool size retrieved from vector and BM25 indexes before diversity selection (MMR) or cross-encoder reranking.",
                        whenInPicture: "Active when Strategy is MMR or Hybrid, or when Reranking is enabled. In run step dialogs, you will see Fetch K chunks retrieved and passed to the reranker.",
                        desiredValue: "20 - 50 passages (Default: 20). Should be 3x to 5x of Top K / Top N.",
                        impactOnOutput: "Higher values (30-60) give the reranker or MMR algorithm a much richer pool to uncover high-relevance chunks that vector similarity ranked lower down. Lower values (5-10) reduce database I/O but severely limit reranker effectiveness.",
                        consequences: "If Fetch K is set too small (e.g. 5) when reranking Top N is 5, the reranker has virtually no candidate diversity to re-rank.",
                      }}
                      onChange={(fetch_k) =>
                        updateSection("retrieval", {
                          fetch_k: Math.min(200, Math.max(1, fetch_k)),
                        })
                      }
                    />
                  )}
                </div>
                {values.retrieval.strategy !== "sparse" && (
                  <SliderField
                    label="Sim Threshold"
                    value={values.retrieval.similarity_threshold ?? 0.7}
                    min={-1}
                    max={1}
                    step={0.05}
                    hint="-1.0 Loose · 1.0 Strict"
                    info={{
                      description: "Minimum cosine similarity score required for a dense vector chunk to be accepted as a candidate passage.",
                      whenInPicture: "Applied immediately after vector search in dense, hybrid, and MMR strategies.",
                      desiredValue: "0.2 to 0.5 for typical sentence-transformer embeddings (or -1.0 to disable cutoff).",
                      impactOnOutput: "Higher values (> 0.7) discard marginally relevant chunks, keeping context ultra-clean. Lower values (< 0.2) ensure recall when questions don't share identical phrasing with documents.",
                      consequences: "Setting too high (> 0.85) will discard all candidates, returning 0 documents and causing the model to answer that it lacks information.",
                    }}
                    onChange={(similarity_threshold) =>
                      updateSection("retrieval", {
                        similarity_threshold: Math.min(1, Math.max(-1, similarity_threshold)),
                      })
                    }
                  />
                )}
              </div>

              {values.retrieval.strategy === "mmr" && (
                <SliderField
                  label="MMR Lambda (Diversity)"
                  value={values.retrieval.mmr_lambda ?? 0.5}
                  min={0.0}
                  max={1.0}
                  step={0.05}
                  hint="0.0 Diverse · 1.0 Relevant"
                  info={{
                    description: "Balances query relevance (1.0) against candidate novelty/diversity (0.0) in Maximal Marginal Relevance.",
                    whenInPicture: "Active only when Retrieval Strategy is set to MMR.",
                    desiredValue: "0.50 - 0.70 (Default: 0.50).",
                    impactOnOutput: "At 1.0, acts like pure similarity and may return 4 nearly identical paragraphs from the same document section. At lower values (0.4 - 0.6), penalizes similarity to already chosen chunks, selecting information across diverse sections.",
                    consequences: "Setting lambda < 0.3 can pull in completely off-topic chunks simply because they differ from already selected text.",
                  }}
                  onChange={(mmr_lambda) =>
                    updateSection("retrieval", {
                      mmr_lambda: Math.min(1, Math.max(0, mmr_lambda)),
                    })
                  }
                />
              )}

              {(values.retrieval.strategy === "sparse" || values.retrieval.strategy === "hybrid") && (
                <SelectField
                  label="Sparse Model"
                  value={values.retrieval.sparse_model}
                  options={SPARSE_MODELS}
                  info={{
                    description: "Lexical keyword scoring algorithm used for inverted index matching.",
                    whenInPicture: "Active during sparse and hybrid retrieval passes.",
                    desiredValue: "bm25 (Standard Okapi BM25).",
                    impactOnOutput: "Provides precise token-frequency scoring for exact alphanumeric codes, variable names, and technical terminology.",
                  }}
                  onChange={(sparse_model) =>
                    updateSection("retrieval", { sparse_model })
                  }
                />
              )}

              {values.retrieval.strategy !== "sparse" && (
                <div className="grid gap-1.5 text-xs font-mono font-medium text-muted-foreground p-2 border border-[#2a2a3a] bg-[#12121a]/80 cyber-chamfer-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-0.5">
                      <span className="uppercase text-[11px] font-bold text-foreground">Dense Model</span>
                      <FieldInfoButton
                        label="Dense Model"
                        info={{
                          description: "Vector embedding model used to transform queries into semantic vector coordinates.",
                          whenInPicture: "Active during dense, hybrid, and MMR vector similarity search in Qdrant.",
                          desiredValue: "Auto-detected from attached Knowledge Base (e.g. all-MiniLM-L6-v2 or BAAI/bge-large-en-v1.5).",
                          impactOnOutput: "Higher-dimensional models (1024d) offer deep semantic comprehension; compact models (384d) offer ultra-fast CPU inference.",
                          consequences: "Cannot be changed independently of the Knowledge Base; vector dimensions must strictly match the stored collection index or search will fail.",
                        }}
                      />
                    </div>
                    <span className="text-[9px] uppercase px-1.5 py-0.5 bg-accent/10 border border-accent/30 text-accent font-bold">Auto-detected</span>
                  </div>
                  <p className="font-bold text-accent text-xs truncate" title={detectedDenseModel}>
                    {detectedDenseModel}
                  </p>
                  <span className="text-[9px] text-muted-foreground/80">
                    Locked to match Knowledge Base vector index dimensions
                  </span>
                </div>
              )}
            </SectionAccordion>

            {/* 3. RERANKING */}
            <SectionAccordion
              title="RERANKING"
              badge={values.reranking.enabled ? "ACTIVE" : "OFF"}
              icon={<Filter className="size-3.5" />}
              isOpen={openSections.reranking}
              onToggle={() => toggleSection("reranking")}
            >
              <ToggleRow
                label="Enable Reranking"
                description="Cross-encoder re-scoring of passages"
                info={{
                  description: "Enables a secondary cross-encoder neural network that jointly scores (query, candidate passage) pairs for high-precision semantic relevance.",
                  whenInPicture: "Runs after Stage 1 retrieval, inspecting all candidates from Fetch K before passing the best Top N to the LLM.",
                  desiredValue: "Enabled (Recommended for maximum factual precision and citation accuracy).",
                  impactOnOutput: "Re-orders the most relevant chunk directly to rank #1, catching subtle nuances, negations, and conditions that bi-encoder cosine similarity misses.",
                  consequences: "Adds approximately 100–300ms of neural inference time per query batch.",
                }}
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
                    info={{
                      description: "The cross-encoder architecture used for re-scoring candidates.",
                      whenInPicture: "Active when Reranking is enabled.",
                      desiredValue: "BAAI/bge-reranker-base (Balanced speed/accuracy) or ms-marco-MiniLM-L-6-v2 (Ultra-fast CPU).",
                      impactOnOutput: "bge-reranker-base (278M params) offers strong multilingual and technical comprehension. MiniLM (22M params) provides 3x faster inference on CPU.",
                    }}
                    onChange={(model) =>
                      updateSection("reranking", { model })
                    }
                  />

                  <SliderField
                    label="Top N (Post-Rerank)"
                    value={values.reranking.top_n}
                    min={1}
                    max={200}
                    hint="1 - 200 passages"
                    info={{
                      description: "The final number of top-scoring passages kept after cross-encoder reranking to feed into the generation prompt.",
                      whenInPicture: "Active when Reranking is enabled; supersedes Top K for final prompt context assembly.",
                      desiredValue: "3 - 6 passages (Default: 4 or 5).",
                      impactOnOutput: "Higher values (8-15) give the LLM more supporting evidence across multiple documents. Lower values (2-4) force concise, laser-focused answers.",
                      consequences: "Setting this too low (1 or 2) starves the LLM of necessary supporting context, forcing hallucinations or incomplete answers.",
                    }}
                    onChange={(top_n) =>
                      updateSection("reranking", {
                        top_n: Math.min(200, Math.max(1, top_n)),
                      })
                    }
                  />

                  <ToggleRow
                    label="Return Documents"
                    description="Include reranked passages in result"
                    info={{
                      description: "Whether the full document metadata and text snippets are returned in the API response payload.",
                      whenInPicture: "Emitted in the final response payload after generation completes.",
                      desiredValue: "Enabled (Checked).",
                      impactOnOutput: "Required for the UI to display interactive source document drawers, text highlights, and chunk inspection.",
                    }}
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
              title="GENERATION"
              badge={`${values.generation.provider}: ${values.generation.llm_model}`}
              icon={<Brain className="size-3.5" />}
              isOpen={openSections.generation}
              onToggle={() => toggleSection("generation")}
            >
              <SelectField
                label="Provider"
                value={currentProvider}
                options={[
                  { value: "groq", label: "Groq" },
                  { value: "gemini", label: "Gemini" },
                ]}
                info={{
                  description: "Cloud LLM service backend responsible for synthesizing the final answer from retrieved context.",
                  whenInPicture: "Final stage of the pipeline (Step 3 - Generation).",
                  desiredValue: "Groq (Ultra-fast streaming, 300+ tok/s) or Gemini (Large context, strong analytical reasoning).",
                  impactOnOutput: "Determines streaming latency, token limits, and reasoning capability.",
                }}
                onChange={(provider) => {
                  const newProvider = provider as LLMProvider;
                  const defaultModel =
                    MODEL_OPTIONS[newProvider]?.[0]?.value || "gemini-2.5-flash";
                  updateSection("generation", {
                    provider: newProvider,
                    llm_model: defaultModel,
                  });
                }}
              />

              <SelectField
                label="Model"
                value={values.generation.llm_model}
                options={availableModels}
                info={{
                  description: "Specific LLM checkpoint used to generate the final response.",
                  whenInPicture: "Invoked during answer streaming.",
                  desiredValue: "gemini-2.5-flash or openai/gpt-oss-120b for fast conversational answers; gemini-2.5-pro for complex multi-document analysis.",
                  impactOnOutput: "Larger models adhere more faithfully to strict document constraints and complex reasoning instructions.",
                }}
                onChange={(llm_model) =>
                  updateSection("generation", { llm_model })
                }
              />

              <div className="space-y-2">
                <SliderField
                  label="Temperature"
                  value={values.generation.temperature}
                  min={0.0}
                  max={2.0}
                  step={0.05}
                  hint="0.0 Grounded · 2.0 Creative"
                  info={{
                    description: "Controls randomness and creativity in LLM token selection.",
                    whenInPicture: "Applied by the LLM provider API during answer generation.",
                    desiredValue: "0.10 - 0.30 (Default: 0.20).",
                    impactOnOutput: "Lower values (0.0 - 0.2) yield deterministic, strictly factual, and grounded answers. Higher values (> 0.7) make the model creative, varied, and conversational.",
                    consequences: "High temperature (> 0.7) in RAG makes the model ignore retrieved document facts and hallucinate from pre-training memory.",
                  }}
                  onChange={(temperature) =>
                    updateSection("generation", {
                      temperature: Math.min(2.0, Math.max(0.0, temperature)),
                    })
                  }
                />
                <SliderField
                  label="Max Tokens"
                  value={values.generation.max_tokens}
                  min={100}
                  max={32000}
                  step={100}
                  hint="100 - 32,000 tokens"
                  info={{
                    description: "Upper bound on the number of generated response tokens.",
                    whenInPicture: "Limits the LLM generation streaming loop.",
                    desiredValue: "1,000 - 4,000 tokens (Default: 2,048).",
                    impactOnOutput: "Higher values allow detailed explanations, multi-step walkthroughs, and code blocks. Lower values (< 300) force brevity but may truncate text mid-sentence.",
                  }}
                  onChange={(max_tokens) =>
                    updateSection("generation", {
                      max_tokens: Math.min(32000, Math.max(100, max_tokens)),
                    })
                  }
                />
              </div>

              <ToggleRow
                label="Enforce Citations"
                description="Require grounded citations in response"
                info={{
                  description: "Instructs the system prompt to require explicit bracketed citations for every factual claim made.",
                  whenInPicture: "Injected into the generation system prompt prior to calling the LLM.",
                  desiredValue: "Enabled for research, verification, and audit; Disabled for casual brainstorming.",
                  impactOnOutput: "Forces the model to ground every assertion with source references, drastically reducing unverified claims.",
                  consequences: "If retrieved documents are only tangentially related, enforcing citations will force the model to state that the documents do not contain the answer.",
                }}
                checked={values.generation.citation_enforced}
                onChange={(citation_enforced) =>
                  updateSection("generation", { citation_enforced })
                }
              />

              <SelectField
                label="Chat Mode"
                value={values.generation.chat_mode || "conversational"}
                options={CHAT_MODES}
                info={{
                  description: "Sets the behavioral persona between conversational synthesis and strict extractive Q&A.",
                  whenInPicture: "Controls system prompt persona framing and answer tone.",
                  desiredValue: "Conversational for interactive study sessions; Strict for legal, compliance, or zero-chitchat extraction.",
                  impactOnOutput: "Conversational proactively synthesizes insights and offers document connections. Strict provides minimalist, purely extractive compliance answers.",
                }}
                onChange={(chat_mode) =>
                  updateSection("generation", { chat_mode: chat_mode as ChatMode })
                }
              />

              <ToggleRow
                label="Suggest Follow-ups"
                description={
                  values.generation.chat_mode === "strict"
                    ? "Disabled in Strict Q&A mode (extractive only)"
                    : "Proactively propose 2–3 next exploration questions"
                }
                info={{
                  description: "Instructs the assistant to propose 2–3 relevant, clickable follow-up questions at the bottom of the reply.",
                  whenInPicture: "Active when Chat Mode is Conversational.",
                  desiredValue: "Enabled (Checked).",
                  impactOnOutput: "Appends interactive suggestion chips to explore deeper document insights without having to formulate next questions.",
                }}
                checked={values.generation.chat_mode === "strict" ? false : (values.generation.suggest_followups ?? true)}
                disabled={values.generation.chat_mode === "strict"}
                onChange={(suggest_followups) =>
                  updateSection("generation", { suggest_followups })
                }
              />

              <div className="grid gap-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase text-muted-foreground flex items-center justify-between">
                  <span className="flex items-center gap-0.5">
                    <span>Custom Persona / Prompt</span>
                    <FieldInfoButton
                      label="Custom Persona / Prompt"
                      info={{
                        description: "Custom system instructions prepended to the LLM generation prompt.",
                        whenInPicture: "Assembled into the system instructions for every generation call in this thread.",
                        desiredValue: "Leave empty to use default RAG persona, or specify custom domain role instructions.",
                        impactOnOutput: "Overrides the assistant's persona, tone, formatting conventions, or language style.",
                      }}
                    />
                  </span>
                  {values.generation.system_prompt && (
                    <span className="text-[9px] text-accent font-normal">CUSTOM</span>
                  )}
                </span>
                <Textarea
                  value={values.generation.system_prompt ?? ""}
                  placeholder="Optional custom instructions to override default persona..."
                  rows={2}
                  className="text-[10px] font-mono resize-y bg-[#12121a] border-[#2a2a3a]"
                  onChange={(e) =>
                    updateSection("generation", {
                      system_prompt: e.target.value.trim() ? e.target.value : null,
                    })
                  }
                />
              </div>
            </SectionAccordion>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center gap-2 cyber-chamfer-sm border border-[#2a2a3a] bg-[#12121a] p-4 text-center text-xs text-muted-foreground font-mono">
            <Database className="size-5 text-accent" />
            <p className="font-bold uppercase text-foreground">NO DOCUMENTS FOUND</p>
            <p className="text-[10px] text-muted-foreground uppercase">
              Upload documents to configure RAG parameters.
            </p>
          </div>
        )}
      </div>

      <KbDetailsDialog
        kb={selectedInspectKb}
        open={Boolean(selectedInspectKb)}
        onOpenChange={(open) => !open && setSelectedInspectKb(null)}
        documents={selectedInspectKb ? threadDocuments[selectedInspectKb.id] : undefined}
      />
    </aside>
  );
}
