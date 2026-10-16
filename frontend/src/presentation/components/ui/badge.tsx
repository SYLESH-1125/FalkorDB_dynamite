import type { ReactNode } from "react";
import { cn } from "./cn";

export type BadgeTone = "success" | "warning" | "danger" | "info" | "neutral" | "accent";

const TONES: Record<BadgeTone, string> = {
  success: "bg-success/10 text-success ring-success/20",
  warning: "bg-warning/10 text-warning ring-warning/20",
  danger: "bg-danger/10 text-danger ring-danger/20",
  info: "bg-tint-navy text-body-strong ring-hairline-strong/60",
  neutral: "bg-surface-soft text-body ring-hairline",
  accent: "bg-primary-50 text-primary-600 ring-primary-200/70",
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
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset whitespace-nowrap",
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
    success: "bg-success", warning: "bg-warning", danger: "bg-danger",
    info: "bg-primary-400", neutral: "bg-muted-soft", accent: "bg-primary-500",
  };
  return <span className={cn("size-1.5 shrink-0 rounded-full", dot[tone])} aria-hidden />;
}
