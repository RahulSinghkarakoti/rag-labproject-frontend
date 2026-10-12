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

  const knowledgeBases = useKnowledgeBaseStore((state) => state.knowledgeBases);
  const selectedKbId = useKnowledgeBaseStore((state) => state.selectedKnowledgeBaseId);
  const fetchKnowledgeBases = useKnowledgeBaseStore((state) => state.fetchKnowledgeBases);
  const kbStatus = useKnowledgeBaseStore((state) => state.status);

  const documents = useDocumentStore((state) =>
    Array.isArray(state?.documents) ? state.documents : []
  );
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

  const { data: sseEvent } = useSSE<{
    document_id?: string;
    status?: string;
    filename?: string;
    message?: string;
  }>({
    url: "http://localhost:8000/api/v1/sse/stream",
    eventNames,
  });

  console.log("SSE Event:", sseEvent);

  useEffect(() => {
    if (!sseEvent?.document_id || !sseEvent?.status) {
      return;
    }
    applySSEStatusUpdate(sseEvent.document_id, sseEvent.status);
  }, [sseEvent, applySSEStatusUpdate]);

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
      await uploadDocuments(projectId, selectedKbId, Array.from(files));
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
    <aside className="flex min-h-0 w-80 shrink-0 flex-col border-r bg-muted/20">
      {/* Project & Knowledge Base Header */}
      <div className="border-b px-4 py-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs">
            <FolderOpen className="size-3.5" />
          </div>
          <span className="truncate">{projectName}</span>
        </div>

        <div>
          <label className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground block mb-1.5">
            Knowledge Base
          </label>
          <KnowledgeBaseSelector projectId={projectId} />
        </div>
      </div>

      {/* Sources & Controls Bar */}
      <div className="flex items-center justify-between border-b px-4 py-2.5 bg-background/50">
        <div className="flex items-center gap-2">
          {documents.length > 0 && (
            <button
              type="button"
              onClick={() => selectAllDocuments(!isAllSelected)}
              className="text-muted-foreground hover:text-foreground transition-colors"
              title={isAllSelected ? "Deselect all" : "Select all sources"}
            >
              {isAllSelected ? (
                <CheckSquare className="size-3.5 text-primary" />
              ) : (
                <Square className="size-3.5" />
              )}
            </button>
          )}
          <span className="text-xs font-medium text-muted-foreground">
            {documents.length} source{documents.length === 1 ? "" : "s"}
            {documents.length > 0 && ` (${selectedDocumentIds.length} active)`}
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
          className="h-7 text-xs"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-3 animate-spin" /> Uploading...
            </>
          ) : (
            <>
              <Plus className="size-3" /> Add files
            </>
          )}
        </Button>
      </div>

      {/* Error Message banner */}
      {docError && (
        <div className="mx-3 mt-2 flex items-center gap-1.5 rounded-md bg-destructive/10 px-2.5 py-1.5 text-xs text-destructive">
          <AlertCircle className="size-3.5 shrink-0" />
          <span className="truncate">{docError}</span>
        </div>
      )}

      {/* Documents List & Drag Area */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {!selectedKbId ? (
          <div className="flex h-full flex-col items-center justify-center p-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary mb-3">
              <UploadCloud className="size-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">No Knowledge Base</p>
            <p className="mt-1 text-[11px] text-muted-foreground max-w-xs">
              Create a knowledge base to configure chunking & embedding parameters before uploading.
            </p>
            <Button
              size="xs"
              className="mt-3 text-xs"
              onClick={() => setIsCreateKbOpen(true)}
            >
              <Plus className="size-3" /> Create Knowledge Base
            </Button>
          </div>
        ) : docStatus === "loading" && documents.length === 0 ? (
          <div className="flex h-40 items-center justify-center text-xs text-muted-foreground gap-2">
            <Loader2 className="size-4 animate-spin" /> Loading documents...
          </div>
        ) : documents.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center rounded-lg border border-dashed p-6 text-center">
            <div className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground mb-3">
              <UploadCloud className="size-5" />
            </div>
            <p className="text-xs font-semibold text-foreground">No documents yet</p>
            <p className="mt-1 text-[11px] text-muted-foreground max-w-[200px]">
              Upload PDFs, Markdown, TXT or code files to ground the notebook.
            </p>
            <Button
              variant="outline"
              size="xs"
              className="mt-3 text-xs"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="size-3" /> Select Files
            </Button>
          </div>
        ) : (
          <div className="space-y-1.5">
            {documents.map((doc) => {
              const isReady = isDocumentReady(doc.status);
              const isSelected = selectedDocumentIds.includes(doc.id);
              const extension = doc.name.split(".").pop()?.toUpperCase() ?? "DOC";
              const statusClass =
                doc.status?.toLowerCase() === "completed" || doc.status?.toLowerCase() === "ready"
                  ? "text-emerald-600 font-medium"
                  : doc.status?.toLowerCase() === "processing" || doc.status?.toLowerCase() === "queued" || doc.status?.toLowerCase() === "uploaded"
                    ? "text-amber-500 font-medium"
                    : doc.status?.toLowerCase() === "failed"
                      ? "text-red-500 font-medium"
                      : "text-muted-foreground";

              return (
                <div
                  key={doc.id}
                  className={`group flex items-center gap-2.5 rounded-lg border px-2.5 py-2 transition-colors ${isSelected
                      ? "border-primary/30 bg-background hover:bg-accent/40"
                      : "border-transparent bg-background/50 opacity-60 hover:opacity-100 hover:bg-accent/20"
                    } ${!isReady ? "opacity-75" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => toggleSelectDocument(doc.id)}
                    disabled={!isReady}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0 disabled:cursor-not-allowed disabled:opacity-40"
                    title={
                      !isReady
                        ? `${doc.status ?? "Processing"} — wait until this document is ready to use in chat`
                        : isSelected
                          ? "Uncheck to exclude from chat"
                          : "Check to include in chat"
                    }
                  >
                    {isSelected ? (
                      <CheckSquare className="size-3.5 text-primary" />
                    ) : (
                      <Square className="size-3.5" />
                    )}
                  </button>

                  <div className="flex size-7 shrink-0 items-center justify-center rounded border bg-muted/40 text-[10px] font-semibold text-muted-foreground">
                    {extension.slice(0, 3)}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-foreground">
                      {doc.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5 text-[10px] text-muted-foreground">
                      <span>{formatBytes(doc.size_bytes)}</span>
                      <span>•</span>
                      <span className={`capitalize ${statusClass}`}>
                        {doc.status ?? "queued"}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label={`Remove ${doc.name}`}
                    className="p-1 rounded text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                    onClick={() => deleteDocument(projectId, selectedKbId, doc.id)}
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
            })}

            <button
              type="button"
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-[11px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus className="size-3" /> Upload more documents
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
