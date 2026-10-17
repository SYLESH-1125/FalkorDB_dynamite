"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "../ui/cn";

export function MarkdownMessage({ content, className }: { content: string; className?: string }) {
  return (
    <div className={cn("markdown-body", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h3 className="title-md mt-4 mb-2 text-ink-0 first:mt-0" {...props} />,
          h2: (props) => <h4 className="title-sm mt-4 mb-1.5 text-ink-0 first:mt-0" {...props} />,
          h3: (props) => <h5 className="mt-3 mb-1 text-[13.5px] font-semibold text-ink-0 first:mt-0" {...props} />,
          p: (props) => <p className="mb-2.5 leading-relaxed last:mb-0" {...props} />,
          ul: (props) => <ul className="mb-2.5 list-disc space-y-1 pl-5 last:mb-0" {...props} />,
          ol: (props) => <ol className="mb-2.5 list-decimal space-y-1 pl-5 last:mb-0" {...props} />,
          li: (props) => <li className="leading-relaxed" {...props} />,
          strong: (props) => <strong className="font-semibold text-ink-0" {...props} />,
          table: (props) => (
            <div className="scrollbar-thin mb-2.5 overflow-x-auto rounded-lg border border-hairline">
              <table className="w-full border-collapse text-[13px]" {...props} />
            </div>
          ),
          thead: (props) => <thead className="bg-surface-soft" {...props} />,
          th: (props) => <th className="border-b border-hairline px-3 py-2 text-left font-semibold text-ink-0" {...props} />,
          td: (props) => <td className="border-b border-hairline px-3 py-2 text-body" {...props} />,
          code: (props) => <code className="rounded bg-surface-soft px-1.5 py-0.5 text-[12.5px] text-primary-600" {...props} />,
          blockquote: (props) => (
            <blockquote className="mb-2.5 border-l-2 border-hairline-strong pl-3 text-body italic last:mb-0" {...props} />
          ),
          a: (props) => <a className="text-primary-600 underline underline-offset-2 hover:text-primary-700" {...props} />,
          hr: () => <hr className="my-3 border-hairline" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
