"use client";

import "@assistant-ui/react-markdown/styles/dot.css";

import {
  type CodeHeaderProps,
  MarkdownTextPrimitive,
  unstable_memoizeMarkdownComponents as memoizeMarkdownComponents,
  useIsMarkdownCodeBlock,
} from "@assistant-ui/react-markdown";
import remarkGfm from "remark-gfm";
import { type FC, memo, useMemo, useRef } from "react";
import type { TextMessagePartProps } from "@assistant-ui/react";
import { CheckIcon, CopyIcon } from "lucide-react";

import { TooltipIconButton } from "@/components/assistant-ui/elements/tooltip-icon-button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { cn } from "@/lib/utils";

type MarkdownTextProps = Partial<TextMessagePartProps> & {
  components?: Parameters<typeof memoizeMarkdownComponents>[0];
};

const preprocessMarkdown = (text: string) => {
  const normalized = text
    .replace(/([^\n])\s+([-*])\s+(?=\*\*)/g, "$1\n$2 ")
    .replace(/([^\n])\s+(\d+\.)\s+(?=\*\*)/g, "$1\n$2 ");
  return normalized.replace(/(?<!\[)\[(\d+(?:\s*,\s*\d+)*)\](?!\]\()/g, (_, nums) => {
    return nums
      .split(/\s*,\s*/)
      .map((n: string) => `[${n}](#citation-${n})`)
      .join(" ");
  });
};

const useShallowStable = <T extends Record<string, unknown> | undefined>(
  value: T,
): T => {
  const ref = useRef(value);
  if (value !== ref.current) {
    const prev = ref.current;
    const stable =
      value !== undefined &&
      prev !== undefined &&
      Object.keys(prev).length === Object.keys(value).length &&
      Object.keys(value).every((key) => prev[key] === value[key]);
    if (!stable) ref.current = value;
  }
  return ref.current;
};

const MarkdownTextImpl: FC<MarkdownTextProps> = ({ components }) => {
  const stableComponents = useShallowStable(components);
  const markdownComponents = useMemo(() => {
    if (!stableComponents) return defaultComponents;
    return {
      ...defaultComponents,
      ...memoizeMarkdownComponents(stableComponents),
    };
  }, [stableComponents]);

  return (
    <MarkdownTextPrimitive
      remarkPlugins={[remarkGfm]}
      preprocess={preprocessMarkdown}
      className="aui-md text-xs font-mono"
      components={markdownComponents}
      defer
    />
  );
};

export const MarkdownText = memo(MarkdownTextImpl);

const CodeHeader: FC<CodeHeaderProps> = ({ language, code }) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();
  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="aui-code-header-root border-[#2a2a3a] bg-[#12121a] mt-3 flex items-center justify-between cyber-chamfer-sm border border-b-0 px-3.5 py-1.5 text-xs font-mono">
      <span className="aui-code-header-language text-accent font-bold uppercase text-[10px]">
        {language || "code"}
      </span>
      <TooltipIconButton tooltip="Copy" onClick={onCopy} className="hover:text-accent">
        {!isCopied && (
          <CopyIcon className="animate-in zoom-in-75 fade-in duration-150" />
        )}
        {isCopied && (
          <CheckIcon className="animate-in zoom-in-50 fade-in duration-200 ease-out text-accent" />
        )}
      </TooltipIconButton>
    </div>
  );
};

const defaultComponents = memoizeMarkdownComponents({
  h1: ({ className, ...props }) => (
    <h1
      className={cn(
        "aui-md-h1 mt-5 mb-2 text-base font-bold uppercase text-accent tracking-wider first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn(
        "aui-md-h2 mt-4 mb-2 text-sm font-bold uppercase text-accent tracking-wider first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn(
        "aui-md-h3 mt-3 mb-1.5 text-xs font-bold uppercase text-accent tracking-wider first:mt-0 last:mb-0",
        className,
      )}
      {...props}
    />
  ),
  p: ({ className, ...props }) => (
    <p
      className={cn(
        "aui-md-p my-2.5 leading-relaxed first:mt-0 last:mb-0 text-foreground font-mono text-xs",
        className,
      )}
      {...props}
    />
  ),
  a: ({ className, href, children, ...props }) => {
    if (href?.startsWith("#citation-")) {
      const docNum = href.replace("#citation-", "");
      return (
        <a
          href={href}
          className="inline-flex items-center mx-0.5 px-1.5 py-0.5 align-baseline cyber-chamfer-sm text-[10px] font-mono font-bold bg-accent/10 text-accent hover:bg-accent/20 border border-accent/40 transition-none no-underline select-none"
          title={`Source document ${docNum}`}
          {...props}
        >
          [{children}]
        </a>
      );
    }
    return (
      <a
        className={cn(
          "aui-md-a text-accent hover:underline font-mono font-bold",
          className,
        )}
        href={href}
        {...props}
      />
    );
  },
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        "aui-md-blockquote border-accent/50 bg-[#12121a] text-muted-foreground my-2.5 border-s-2 ps-3 py-1 font-mono text-xs",
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul
      className={cn(
        "aui-md-ul marker:text-accent my-2.5 ms-5 list-disc [&>li]:mt-1 font-mono text-xs",
        className,
      )}
      {...props}
    />
  ),
  ol: ({ className, ...props }) => (
    <ol
      className={cn(
        "aui-md-ol marker:text-accent my-2.5 ms-5 list-decimal [&>li]:mt-1 font-mono text-xs",
        className,
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="aui-md-table-wrapper my-3 overflow-x-auto font-mono text-xs">
      <table
        className={cn(
          "aui-md-table w-full border-collapse border border-[#2a2a3a]",
          className,
        )}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        "aui-md-th bg-[#12121a] border border-[#2a2a3a] px-3 py-1.5 text-start font-bold uppercase text-accent",
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn(
        "aui-md-td border border-[#2a2a3a] bg-[#0a0a0f] px-3 py-1.5 text-start text-foreground",
        className,
      )}
      {...props}
    />
  ),
  pre: ({ className, ...props }) => (
    <pre
      className={cn(
        "aui-md-pre border-[#2a2a3a] bg-[#12121a] overflow-x-auto cyber-chamfer-sm border border-t-0 p-3.5 text-xs font-mono text-foreground leading-relaxed",
        className,
      )}
      {...props}
    />
  ),
  code: function Code({ className, ...props }) {
    const isCodeBlock = useIsMarkdownCodeBlock();
    return (
      <code
        className={cn(
          !isCodeBlock &&
            "aui-md-inline-code bg-[#12121a] border border-[#2a2a3a] text-accent cyber-chamfer-sm px-1.5 py-0.5 font-mono text-[0.85em]",
          className,
        )}
        {...props}
      />
    );
  },
  CodeHeader,
});
