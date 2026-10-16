import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const TONES: Record<BadgeTone, string> = {
  success: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  warning: "bg-clay-50 text-clay-700 ring-clay-600/20",
  danger: "bg-red-50 text-red-700 ring-red-600/20",
  info: "bg-sand-200 text-ink-600 ring-ink-500/20",
  neutral: "bg-slate-100 text-slate-600 ring-slate-500/20",
  accent: "bg-clay-500/10 text-clay-700 ring-clay-500/25",
};

export function Badge({
  tone = "neutral", children, className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone = "neutral" }: { tone?: BadgeTone }) {
  const dot: Record<BadgeTone, string> = {
    success: "bg-emerald-500", warning: "bg-clay-500", danger: "bg-red-500",
    info: "bg-ink-400", neutral: "bg-slate-400", accent: "bg-clay-500",
  };
  return <span className={cn("size-1.5 rounded-full", dot[tone])} aria-hidden />;
}
