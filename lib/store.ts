export {
  defaultThreadConfig,
  useThreadConfigStore,
  type ThreadConfig,
} from "@/lib/config-store";

export * from "@/lib/types/project";
export * from "@/lib/types/knowledge-base";
export * from "@/lib/types/document";

export {
  useProjectStore,
  type ProjectStore,
} from "@/lib/stores/project-store";

export {
  useKnowledgeBaseStore,
  type KnowledgeBaseStore,
} from "@/lib/stores/knowledge-base-store";

export {
  useDocumentStore,
  type DocumentStore,
} from "@/lib/stores/document-store";

import { useThreadConfigStore } from "@/lib/config-store";
export const useProjectConfigStore = useThreadConfigStore;
