export type DocumentItem = {
  id: string;
  knowledge_base_id: string;
  name: string;
  mime_type?: string | null;
  size_bytes?: number | null;
  status: string;
  checksum?: string | null;
  chunk_count?: number;
  embedded_count?: number;
  total_chunks?: number;
  error?: string | null;
  created_at?: string;
  updated_at?: string;
};

export function isDocumentReady(status?: string | null): boolean {
  const normalized = (status ?? "").trim().toLowerCase();
  return normalized === "completed" || normalized === "ready";
}
