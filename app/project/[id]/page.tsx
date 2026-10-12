"use client";

import { use, useEffect, useState } from "react";

import { DocumentsPanel } from "@/components/project/documents-panel";
import { ProjectChat } from "@/components/project/project-chat";
import { RagSettingsPanel } from "@/components/project/rag-settings-panel";
import { ThreadPanel } from "@/components/project/thread-panel";
import { useDocumentStore, useKnowledgeBaseStore } from "@/lib/store";
import { useThreadStore } from "@/lib/thread-store";
import { MyRuntimeProvider } from "../../MyRuntimeProvider";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const selectedThreadId = useThreadStore((state) => state.selectedThreadId);
  const selectedKbId = useKnowledgeBaseStore((state) => state.selectedKnowledgeBaseId);
  const documents = useDocumentStore((state) =>
    Array.isArray(state?.documents) ? state.documents : []
  );
  const fetchThreads = useThreadStore((state) => state.fetchThreads);
  const [leftTab, setLeftTab] = useState<"documents" | "threads">("documents");
  const projectName = id.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const chatEnabled = Boolean(selectedThreadId);
  const canCreateThread = Boolean(selectedKbId && documents.length > 0);

  useEffect(() => { void fetchThreads(id); }, [fetchThreads, id]);

  return (
    <div className="flex h-svh min-w-[1100px] overflow-hidden bg-background">
        <div className="flex min-h-0 w-80 shrink-0 flex-col border-r bg-muted/10">
          <div className="flex border-b px-3 pt-3">
            <button type="button" onClick={() => setLeftTab("documents")} className={`flex-1 border-b-2 pb-2 text-xs font-medium ${leftTab === "documents" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Documents</button>
            <button type="button" onClick={() => setLeftTab("threads")} className={`flex-1 border-b-2 pb-2 text-xs font-medium ${leftTab === "threads" ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>Threads</button>
          </div>
          {leftTab === "documents" ? <DocumentsPanel projectId={id} projectName={projectName} /> : <ThreadPanel projectId={id} canCreate={canCreateThread} />}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1">
          <MyRuntimeProvider
            key={selectedThreadId ?? "new-thread"}
            threadId={selectedThreadId}
          >
            <ProjectChat enabled={chatEnabled} />
            {selectedThreadId ? (
              <RagSettingsPanel threadId={selectedThreadId} />
            ) : null}
          </MyRuntimeProvider>
        </div>
    </div>
  );
}
