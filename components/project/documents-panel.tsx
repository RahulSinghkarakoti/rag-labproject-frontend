"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import {
  AlertCircle,
  CheckSquare,
  FileText,
  FolderOpen,
  Loader2,
  Plus,
  Square,
  Trash2,
  UploadCloud,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { KnowledgeBaseSelector } from "./knowledge-base-selector";
import { CreateKnowledgeBaseDialog } from "./create-knowledge-base-dialog";
import { isDocumentReady, useDocumentStore, useKnowledgeBaseStore } from "@/lib/store";
import { useSSE } from "@/app/hooks/useSSE";

interface DocumentsPanelProps {
  projectId: string;
  projectName: string;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes || bytes <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function DocumentsPanel({ projectId, projectName }: DocumentsPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isCreateKbOpen, setIsCreateKbOpen] = useState(false);
  const trackedDocumentIdsRef = useRef(new Set<string>());
  const previousSseStatusRef = useRef<string>("DISCONNECTED");

  const knowledgeBases = useKnowledgeBaseStore((state) => state.knowledgeBases);
  const selectedKbId = useKnowledgeBaseStore((state) => state.selectedKnowledgeBaseId);
  const fetchKnowledgeBases = useKnowledgeBaseStore((state) => state.fetchKnowledgeBases);
  const kbStatus = useKnowledgeBaseStore((state) => state.status);

  const documents = useDocumentStore((state) =>
    Array.isArray(state?.documents) ? state.documents : []
  );
  const documentsRef = useRef(documents);
  documentsRef.current = documents;
  const selectedDocumentIds = useDocumentStore((state) =>
    Array.isArray(state?.selectedDocumentIds) ? state.selectedDocumentIds : []
  );
  const docStatus = useDocumentStore((state) => state.status);
  const docError = useDocumentStore((state) => state.error);
  const fetchDocuments = useDocumentStore((state) => state.fetchDocuments);
  const uploadDocuments = useDocumentStore((state) => state.uploadDocuments);
  const deleteDocument = useDocumentStore((state) => state.deleteDocument);
  const applySSEStatusUpdate = useDocumentStore((state) => state.applySSEStatusUpdate);
  const toggleSelectDocument = useDocumentStore((state) => state.toggleSelectDocument);
  const selectAllDocuments = useDocumentStore((state) => state.selectAllDocuments);

  const eventNames = useMemo(
    () => ["ingestion_status"],
    []
  );

  const { data: sseEvent, status: sseStatus, reconnect: reconnectSse, disconnect: disconnectSse } = useSSE<{
    document_id?: string;
    status?: string;
    filename?: string;
    message?: string;
    error?: string;
    embedded_count?: number;
    total_chunks?: number;
  }>({
    url: `${process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"}/api/v1/sse/stream`,
    eventNames,
  });

  useEffect(() => {
    if (!sseEvent?.document_id || !sseEvent?.status) {
      return;
    }
    const isKnownDocument = documentsRef.current.some((doc) => doc.id === sseEvent.document_id);
    const isTrackedUpload = trackedDocumentIdsRef.current.has(sseEvent.document_id);
    if (!isKnownDocument && !isTrackedUpload) return;

    applySSEStatusUpdate(sseEvent.document_id, {
      status: sseEvent.status,
      error: sseEvent.error ?? null,
      embedded_count: sseEvent.embedded_count,
      total_chunks: sseEvent.total_chunks,
    });

    if (sseEvent.status === "completed" || sseEvent.status === "failed") {
      if (isTrackedUpload) {
        trackedDocumentIdsRef.current.delete(sseEvent.document_id);
        if (selectedKbId) void fetchDocuments(projectId, selectedKbId);
        if (trackedDocumentIdsRef.current.size === 0) disconnectSse();
      }
    }
  }, [sseEvent, applySSEStatusUpdate, fetchDocuments, projectId, selectedKbId, disconnectSse]);

  useEffect(() => {
    if (previousSseStatusRef.current === "CONNECTED" && sseStatus === "DISCONNECTED" && selectedKbId && trackedDocumentIdsRef.current.size > 0) {
      void fetchDocuments(projectId, selectedKbId).then((docs) => {
        for (const document of docs) {
          if ((document.status === "completed" || document.status === "failed") && trackedDocumentIdsRef.current.has(document.id)) {
            trackedDocumentIdsRef.current.delete(document.id);
          }
        }
        if (trackedDocumentIdsRef.current.size === 0) disconnectSse();
      });
    }
    previousSseStatusRef.current = sseStatus;
  }, [sseStatus, projectId, selectedKbId, fetchDocuments]);

  useEffect(() => {
    if (projectId) {
      fetchKnowledgeBases(projectId);
    }
  }, [projectId, fetchKnowledgeBases]);

  useEffect(() => {
    if (projectId && selectedKbId) {
      fetchDocuments(projectId, selectedKbId);
    }
  }, [projectId, selectedKbId, fetchDocuments]);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0 || !selectedKbId) return;

    try {
      reconnectSse();
      const uploadedDocuments = await uploadDocuments(projectId, selectedKbId, Array.from(files));
      for (const document of uploadedDocuments) trackedDocumentIdsRef.current.add(document.id);
      const refreshedDocuments = await fetchDocuments(projectId, selectedKbId);
      for (const document of refreshedDocuments) {
        if ((document.status === "completed" || document.status === "failed") && trackedDocumentIdsRef.current.has(document.id)) {
          trackedDocumentIdsRef.current.delete(document.id);
        }
      }
      if (trackedDocumentIdsRef.current.size === 0) disconnectSse();
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const readyDocuments = documents.filter((doc) => isDocumentReady(doc.status));
  const isAllSelected =
    readyDocuments.length > 0 && selectedDocumentIds.length === readyDocuments.length;
  const isUploading = docStatus === "uploading";

  return (
    <aside className="flex min-h-0 w-80 shrink-0 flex-col border-r border-[#2a2a3a] bg-[#0a0a0f] font-mono">
      {/* Project & Knowledge Base Header */}
      <div className="border-b border-[#2a2a3a] px-4 py-4 space-y-3 bg-[#12121a]">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-foreground">
          <div className="flex size-7 items-center justify-center cyber-chamfer-sm bg-accent text-[#0a0a0f]">
            <FolderOpen className="size-3.5" />
          </div>
          <span className="truncate">&gt; {projectName}</span>
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-accent block mb-1.5">
            // KNOWLEDGE_BASE
          </label>
          <KnowledgeBaseSelector projectId={projectId} />
        </div>
      </div>

      {/* Sources & Controls Bar */}
      <div className="flex items-center justify-between border-b border-[#2a2a3a] px-4 py-2.5 bg-[#0a0a0f]">
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <button
              type="button"
              onClick={() => selectAllDocuments(!isAllSelected)}
              className="text-muted-foreground hover:text-accent transition-none"
              title={isAllSelected ? "Deselect all" : "Select all sources"}
            >
              {isAllSelected ? (
                <CheckSquare className="size-3.5 text-accent" />
              ) : (
                <Square className="size-3.5" />
              )}
            </button>
          )}
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            SOURCES [{documents.length}]
            {documents.length > 0 && ` (${selectedDocumentIds.length} ACTIVE)`}
          </span>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />

        <Button
          size="xs"
          disabled={!selectedKbId || isUploading}
          onClick={() => fileInputRef.current?.click()}
          className="h-6 text-[10px]"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-3 animate-spin" /> UPLOADING
            </>
          ) : (
            <>
              <Plus className="size-3" /> ADD_FILES
            </>
          )}
        </Button>
      </div>

      {/* Error Message banner */}
      {docError && (
        <div className="mx-3 mt-2 flex items-center gap-1.5 cyber-chamfer-sm border border-destructive bg-destructive/10 px-2.5 py-1.5 text-[11px] text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span className="truncate">{docError}</span>
        </div>
      )}

      {/* Documents List & Drag Area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {!selectedKbId ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center border border-dashed border-[#2a2a3a] cyber-chamfer bg-[#12121a]">
            <div className="flex size-10 items-center justify-center cyber-chamfer-sm bg-accent/10 text-accent mb-3">
              <UploadCloud className="size-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">NO KNOWLEDGE BASE</p>
            <p className="mt-1 text-[10px] text-muted-foreground max-w-xs">
              Configure chunking &amp; embedding parameters before ingestion.
            </p>
            <Button
              size="xs"
              className="mt-3 text-[10px]"
              onClick={() => setIsCreateKbOpen(true)}
            >
              <Plus className="size-3" /> CREATE_KB
            </Button>
          </div>
        ) : docStatus === "loading" && documents.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground gap-2 font-mono">
            <Loader2 className="size-4 animate-spin text-accent" /> INITIALIZING_DOCS...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center cyber-chamfer border border-dashed border-[#2a2a3a] bg-[#12121a] p-6 text-center">
            <div className="flex size-10 items-center justify-center cyber-chamfer-sm bg-[#1c1c2e] text-accent mb-3">
              <UploadCloud className="size-5" />
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-foreground">NO DOCUMENTS INDEXED</p>
            <p className="mt-1 text-[10px] text-muted-foreground max-w-[200px]">
              Upload PDF, MD, TXT, or source files.
            </p>
            <Button
              variant="outline"
              size="xs"
              className="mt-3 text-[10px]"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="size-3" /> SELECT_FILES
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => {
              const isReady = isDocumentReady(doc.status);
              const isSelected = selectedDocumentIds.includes(doc.id);
              const extension = doc.name.split(".").pop()?.toUpperCase() ?? "DOC";
              const normalizedStatus = doc.status?.toLowerCase();
              const statusClass =
                normalizedStatus === "completed" || normalizedStatus === "ready"
                  ? "text-accent font-bold"
                  : normalizedStatus === "failed"
                    ? "text-destructive font-bold"
                    : ["uploaded", "queued", "processing", "loading", "loaded", "chunking", "chunked", "embedding", "embedded", "storing", "stored"].includes(normalizedStatus ?? "")
                    ? "text-amber-400 font-bold"
                    : "text-muted-foreground";

              return (
                <div
                  key={doc.id}
                  className={`group flex items-center gap-2.5 cyber-chamfer-sm border px-2.5 py-2 transition-none ${isSelected
                      ? "border-accent bg-[#12121a]"
                      : "border-[#2a2a3a] bg-[#0a0a0f] opacity-60 hover:opacity-100 hover:border-accent/50"
                    } ${!isReady ? "opacity-75" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelectDocument(doc.id)}
                    disabled={!isReady}
                    className="text-muted-foreground hover:text-accent transition-none shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                    title={
                      !isReady
                        ? `${doc.status ?? "Processing"} — wait until document is ready`
                        : isSelected
                          ? "Exclude from RAG query context"
                          : "Include in RAG query context"
                    }
                  >
                    {isSelected ? (
                      <CheckSquare className="size-3.5 text-accent" />
                    ) : (
                      <Square className="size-3.5" />
                    )}
                  </button>

                  <div className="flex size-7 shrink-0 items-center justify-center cyber-chamfer-sm border border-[#2a2a3a] bg-[#1c1c2e] text-[9px] font-black text-accent">
                    {extension.slice(0, 3)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-foreground">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[9px] text-muted-foreground uppercase">
                      <span>{formatBytes(doc.size_bytes)}</span>
                      <span>•</span>
                      <span className={`capitalize ${statusClass}`}>
                        {doc.status ?? "queued"}
                      </span>
                    </div>
                    {normalizedStatus === "embedding" && doc.total_chunks ? (
                      <div className="mt-0.5 text-[9px] text-accent">
                        EMBEDDING {Math.min(doc.embedded_count ?? 0, doc.total_chunks)} / {doc.total_chunks}
                      </div>
                    ) : null}
                    {normalizedStatus === "failed" && doc.error ? (
                      <div className="mt-0.5 truncate text-[9px] text-destructive" title={doc.error}>
                        {doc.error}
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${doc.name}`}
                    className="p-1 text-muted-foreground opacity-0 transition-none hover:text-destructive group-hover:opacity-100"
                    onClick={() => deleteDocument(projectId, selectedKbId, doc.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-1.5 cyber-chamfer-sm border border-dashed border-[#2a2a3a] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:border-accent hover:text-accent transition-none"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="size-3" /> UPLOAD_MORE
            </button>
          </div>
        )}
      </div>

      <CreateKnowledgeBaseDialog
        projectId={projectId}
        open={isCreateKbOpen}
        onOpenChange={setIsCreateKbOpen}
      />
    </aside>
  );
}
