import type { ReactNode } from "react";
import { cn } from "../ui/cn";

export function TileGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-flow-dense auto-rows-min grid-cols-2 gap-3 sm:auto-rows-[5.5rem] lg:grid-cols-6 xl:grid-cols-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type TileTone = "paper" | "sand" | "ink" | "clay" | "outline";

const TONES: Record<TileTone, string> = {
  paper: "bg-surface-card border-hairline",
  sand: "bg-surface-soft border-hairline",
  ink: "gradient-navy border-primary-800 text-white",
  clay: "bg-secondary-400 border-secondary-500 text-ink-0",
  outline: "border-hairline-strong border-dashed bg-transparent",
};

export function Tile({
  children, className, tone = "paper", label, hint, action, flush = false,
}: {
  children: ReactNode;
  className?: string;
  tone?: TileTone;
  label?: ReactNode;
  hint?: ReactNode;
  action?: ReactNode;
  flush?: boolean;
}) {
  const dark = tone === "ink" || tone === "clay";
  return (
    <section
      className={cn(
        "relative flex min-w-0 flex-col overflow-hidden rounded-lg border",
        tone !== "outline" && "card-raise",
        TONES[tone],
        className,
      )}
    >
      {label ? (
        <header className="flex items-baseline justify-between gap-3 px-4 pt-3.5">
          <div className="min-w-0">
            <h2
              className={cn(
                "truncate text-[11px] font-semibold tracking-wide uppercase",
                dark ? "text-white/60" : "text-muted",
              )}
            >
              {label}
            </h2>
            {hint ? (
              <p className={cn("mt-1 truncate text-[11.5px]", dark ? "text-white/50" : "text-muted-soft")}>
                {hint}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("min-w-0 flex-1", !flush && (label ? "px-4 pt-2.5 pb-4" : "p-4"))}>{children}</div>
    </section>
  );
}

export function Metric({
  value, caption, delta, positive, className,
}: {
  value: string;
  caption: string;
  delta?: string;
  positive?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex h-full flex-col justify-center", className)}>
      <p className="numeral text-[30px] leading-none text-ink-0">{value}</p>
      <p className="mt-1.5 text-[11.5px] leading-tight text-body">{caption}</p>
      {delta ? (
        <p className={cn("mt-1 text-[11.5px] font-medium", positive ? "text-success" : "text-danger")}>
          {delta}
        </p>
      ) : null}
    </div>
  );
}
