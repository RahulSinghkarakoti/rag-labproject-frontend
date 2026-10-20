import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";
import { Footer } from "@/components/footer";

export default function PrivacyPage() {
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
              <Shield className="size-4 text-accent" />
              <p className="text-xs font-semibold tracking-widest text-accent uppercase">
                SYS.DOCS // GOVERNANCE
              </p>
            </div>
            <h1 className="text-3xl font-black uppercase tracking-wider text-foreground sm:text-4xl">
              PRIVACY POLICY
            </h1>
            <p className="mt-2 text-xs text-muted-foreground">
              Last Updated: October 20, 2026 // System Protocol v1.0
            </p>
          </div>

          {/* Content */}
          <div className="space-y-8 text-xs leading-relaxed text-muted-foreground">
            <section className="cyber-chamfer bg-[#12121a] border border-[#2a2a3a] p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground text-accent">
                1. INFORMATION COLLECTION
              </h2>
              <p>
                NOTEBOOKLLM-LITE collects necessary workspace parameters and authentication tokens required to operate system project nodes.
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2">
                <li><strong className="text-foreground">Authentication Data:</strong> User identity provided via configured OAuth providers (e.g. Google).</li>
                <li><strong className="text-foreground">Uploaded Documents:</strong> Files uploaded to project knowledge bases for index creation and vector embedding.</li>
                <li><strong className="text-foreground">Interaction Telemetry:</strong> Session metadata and RAG query queries used strictly for response generation.</li>
              </ul>
            </section>

            <section className="cyber-chamfer bg-[#12121a] border border-[#2a2a3a] p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground text-accent">
                2. DATA USAGE & AI PROCESSING
              </h2>
              <p>
                Documents and query payloads submitted to active nodes are processed strictly for context retrieval and response generation. Your workspace data is isolated to your assigned projects and is never used to train global public AI models.
              </p>
            </section>

            <section className="cyber-chamfer bg-[#12121a] border border-[#2a2a3a] p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground text-accent">
                3. NODE ISOLATION & STORAGE
              </h2>
              <p>
                Knowledge base indexes, document chunks, and chat execution steps remain sandboxed within project boundaries. Access control policies ensure that node state is accessible only to authenticated workspace owners.
              </p>
            </section>

            <section className="cyber-chamfer bg-[#12121a] border border-[#2a2a3a] p-6 space-y-3">
              <h2 className="text-sm font-bold uppercase tracking-wider text-foreground text-accent">
                4. USER RIGHTS & PURGING
              </h2>
              <p>
                You retain complete control over your project nodes. Terminating a project node permanently destroys associated vector indexes, document stores, and execution logs from system storage.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
