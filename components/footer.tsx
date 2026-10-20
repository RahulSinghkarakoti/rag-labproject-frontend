"use client";

import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full border-t border-[#2a2a3a] bg-[#0a0a0f]/90 py-3 px-6 sm:px-10 text-xs font-mono text-muted-foreground backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
        {/* Left branding & node status */}
        <div className="flex items-center gap-2 text-[11px] tracking-wider uppercase">
          <span className="inline-block size-1.5 rounded-full bg-accent animate-pulse" />
          <span className="text-accent font-semibold">SYS.NODE</span>
          <span className="text-[#3a3a4c]">//</span>
          <span>© {currentYear} NOTEBOOKLLM-LITE</span>
        </div>

        {/* Right navigation hyperlinks */}
        <nav aria-label="Footer Navigation" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] tracking-wider uppercase">
          <Link
            href="/privacy"
            className="transition-colors hover:text-accent hover:underline underline-offset-4 focus-visible:outline-none focus-visible:text-accent"
          >
            Privacy Policy
          </Link>
          <span className="text-[#3a3a4c]">//</span>
          <Link
            href="/terms"
            className="transition-colors hover:text-accent hover:underline underline-offset-4 focus-visible:outline-none focus-visible:text-accent"
          >
            Terms of Service
          </Link>
          <span className="text-[#3a3a4c]">//</span>
          <Link
            href="/data-policy"
            className="transition-colors hover:text-accent hover:underline underline-offset-4 focus-visible:outline-none focus-visible:text-accent"
          >
            Data Policy
          </Link>
        </nav>
      </div>
    </footer>
  );
}
