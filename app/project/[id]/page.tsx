"use client";

import { use, useEffect, useState } from "react";

import { DocumentsPanel } from "@/components/project/documents-panel";
import { ProjectChat } from "@/components/project/project-chat";
import { RagSettingsPanel } from "@/components/project/rag-settings-panel";
import { ThreadPanel } from "@/components/project/thread-panel";
import { useKnowledgeBaseStore } from "@/lib/store";
import { useThreadStore } from "@/lib/thread-store";
import { MyRuntimeProvider } from "../../MyRuntimeProvider";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const selectedThreadId = useThreadStore((state) => state.selectedThreadId);
  const knowledgeBases = useKnowledgeBaseStore((state) => state.knowledgeBases);
  const fetchThreads = useThreadStore((state) => state.fetchThreads);
  const [leftTab, setLeftTab] = useState<"documents" | "threads">("documents");
  const projectName = id.replace(/[-_]/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  const chatEnabled = Boolean(selectedThreadId);
  const canCreateThread = knowledgeBases.some((kb) => kb.document_count > 0);

  useEffect(() => { void fetchThreads(id); }, [fetchThreads, id]);

  return (
    <div className="flex h-svh min-w-[1100px] overflow-hidden bg-[#0a0a0f] text-[#e0e0e0] font-mono">
        <div className="flex min-h-0 w-80 shrink-0 flex-col border-r border-[#2a2a3a] bg-[#0a0a0f]">
          <div className="flex border-b border-[#2a2a3a] px-3 pt-3 bg-[#12121a]">
            <button
              type="button"
              onClick={() => setLeftTab("documents")}
              className={`flex-1 border-b-2 pb-2 text-xs font-bold uppercase tracking-wider transition-none ${
                leftTab === "documents"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              [ DOCS ]
            </button>
            <button
              type="button"
              onClick={() => setLeftTab("threads")}
              className={`flex-1 border-b-2 pb-2 text-xs font-bold uppercase tracking-wider transition-none ${
                leftTab === "threads"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              [ THREADS ]
            </button>
          </div>
          {leftTab === "documents" ? <DocumentsPanel projectId={id} projectName={projectName} /> : <ThreadPanel projectId={id} canCreate={canCreateThread} />}
        </div>
        <div className="flex min-h-0 min-w-0 flex-1 bg-[#0a0a0f]">
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
