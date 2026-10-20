import Link from "next/link";
import { ArrowLeft, Database } from "lucide-react";
import { Footer } from "@/components/footer";

export default function DataPolicyPage() {
  return (
    <div className="flex min-h-full flex-col justify-between bg-[#0a0a0f] text-[#e0e0e0] font-mono">
      <main className="flex-1">
        <div className="mx-auto max-w-4xl px-6 py-10 sm:px-10 sm:py-16">
          {/* Header */}
          <div className="mb-8 border-b border-[#2a2a3a] pb-6">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-semibold text-accent hover:underline mb-4 uppercase tracking-wider"
            >
              <ArrowLeft className="size-3.5" />
              [ BACK TO SYSTEM PROJECTS ]
            </Link>

            <div className="flex items-center gap-2 mb-2">
              <Database className="size-4 text-accent" />
              <p className="text-xs font-semibold tracking-widest text-accent uppercase">
                SYS.DOCS // DATA_GOVERNANCE
              </p>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-foreground sm:text-4xl">
              DATA POLICY
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Effective Date: October 20, 2026 // System Protocol v1.0
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-xs leading-relaxed text-muted-foreground">
            <section className="cyber-chamfer bg-[#12121a] border border-[#2a2a3a] p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground text-accent">
                1. VECTOR EMBEDDING & CHUNKING
              </h2>
              <p>
                Uploaded documents undergo automated text extraction, chunking, and vector embedding generation. Embedded representation vectors are stored in isolated vector indexes tied specifically to your project workspace node.
              </p>
            </section>

            <section className="cyber-chamfer bg-[#12121a] border border-[#2a2a3a] p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground text-accent">
                2. RETRIEVAL & CONTEXT TRANSMISSION
              </h2>
              <p>
                When a query is initiated within a thread, semantic search identifies relevant document chunks. Only matched context blocks are transmitted to the assistant runtime to formulate the response.
              </p>
            </section>

            <section className="cyber-chamfer bg-[#12121a] border border-[#2a2a3a] p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground text-accent">
                3. ENCRYPTION & SECURITY CONTROLS
              </h2>
              <p>
                All data in transit is protected using TLS 1.3 encryption protocols. Session tokens and authentication context are secured using standard HTTP-only cookie policies and encrypted session keys.
              </p>
            </section>

            <section className="cyber-chamfer bg-[#12121a] border border-[#2a2a3a] p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground text-accent">
                4. DELETION & PERMANENT PURGING
              </h2>
              <p>
                When a user deletes a document or terminates a project node, all corresponding vector embeddings, raw document stores, and conversation step history are purged permanently across database layers.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
