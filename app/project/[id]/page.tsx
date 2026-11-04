"use client";

import { use, useEffect, useState } from "react";

import { DocumentsPanel } from "@/components/project/documents-panel";
import { ProjectChat } from "@/components/project/project-chat";
import { RagSettingsPanel } from "@/components/project/rag-settings-panel";
import { ThreadPanel } from "@/components/project/thread-panel";
import { useKnowledgeBaseStore, useProjectStore } from "@/lib/store";
import { useThreadStore } from "@/lib/thread-store";
import { MyRuntimeProvider } from "../../MyRuntimeProvider";

export default function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const selectedThreadId = useThreadStore((state) => state.selectedThreadId);
  const knowledgeBases = useKnowledgeBaseStore((state) => state.knowledgeBases);
  const fetchThreads = useThreadStore((state) => state.fetchThreads);
  const createThread = useThreadStore((state) => state.createThread);
  const currentProject = useProjectStore((state) => state.currentProject);
  const fetchProject = useProjectStore((state) => state.fetchProject);

  const [leftTab, setLeftTab] = useState<"documents" | "threads">("documents");
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [isQuickCreating, setIsQuickCreating] = useState(false);

  const projectName = currentProject?.id === id ? currentProject.name : "PROJECT";
  const chatEnabled = Boolean(selectedThreadId);
  const readyKbs = knowledgeBases.filter((kb) => kb.document_count > 0);
  const canCreateThread = readyKbs.length > 0;
  const canShowSettings = leftTab === "threads" && Boolean(selectedThreadId);
  const isSettingsPanelVisible = canShowSettings && rightPanelVisible;

  useEffect(() => {
    void fetchProject(id).catch(() => undefined);
    void fetchThreads(id);
  }, [fetchProject, fetchThreads, id]);

  const handleQuickCreateThread = async () => {
    if (!canCreateThread || isQuickCreating) return;
    setIsQuickCreating(true);
    try {
      const kbIds = readyKbs.map((kb) => kb.id);
      await createThread(id, kbIds, "Default Session");
    } catch {
      // Handled by store
    } finally {
      setIsQuickCreating(false);
    }
  };

  return (
    <div className="flex h-full min-w-0 overflow-hidden bg-[#0a0a0f] text-[#e0e0e0] font-mono">
        {leftPanelVisible && (
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
        )}
        <div className="flex min-h-0 min-w-0 flex-1 bg-[#0a0a0f]">
          <MyRuntimeProvider
            key={selectedThreadId ?? "new-thread"}
            threadId={selectedThreadId}
          >
            <ProjectChat 
              enabled={chatEnabled} 
              leftPanelOpen={leftPanelVisible}
              rightPanelOpen={isSettingsPanelVisible}
              canCreateThread={canCreateThread}
              isCreatingThread={isQuickCreating}
              onQuickCreateThread={handleQuickCreateThread}
              onToggleLeftPanel={() => setLeftPanelVisible(!leftPanelVisible)}
              onToggleRightPanel={canShowSettings ? () => setRightPanelVisible(!rightPanelVisible) : undefined}
            />
            {isSettingsPanelVisible && selectedThreadId ? (
              <RagSettingsPanel threadId={selectedThreadId} />
            ) : null}
          </MyRuntimeProvider>
        </div>
    </div>
  );
}
