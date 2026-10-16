import type { ReactNode } from "react";
import { cn } from "../ui/cn";

export function TileGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "grid grid-flow-dense grid-cols-2 gap-2.5 auto-rows-min sm:auto-rows-[5.5rem] lg:grid-cols-6 xl:grid-cols-12",
        className,
      )}
    >
      {children}
    </div>
  );
}

export type TileTone = "paper" | "sand" | "ink" | "clay" | "outline";

const TONES: Record<TileTone, string> = {
  paper: "bg-sand-50 border-sand-300/70",
  sand: "bg-sand-200/60 border-sand-300",
  ink: "bg-ink-800 border-ink-700 text-sand-100",
  clay: "bg-clay-500 border-clay-600 text-white",
  outline: "bg-transparent border-sand-400 border-dashed",
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
        "relative flex min-w-0 flex-col overflow-hidden rounded-[2px] border",
        tone !== "outline" && "shadow-[0_1px_1px_rgba(28,25,23,0.03),0_12px_28px_-20px_rgba(28,25,23,0.30)]",
        TONES[tone],
        className,
      )}
    >
      {label ? (
        <header className="flex items-baseline justify-between gap-3 px-4 pt-3.5">
          <div className="min-w-0">
            <h2
              className={cn(
                "truncate text-[10px] font-semibold tracking-[0.09em] uppercase",
                dark ? "text-white/55" : "text-ink-300",
              )}
            >
              {label}
            </h2>
            {hint ? (
              <p className={cn("mt-1 truncate text-[11px]", dark ? "text-white/45" : "text-ink-300")}>{hint}</p>
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
      <p className="font-serif text-[30px] leading-none font-semibold tracking-tight text-ink-800">{value}</p>
      <p className="mt-1.5 text-[11px] leading-tight text-ink-400">{caption}</p>
      {delta ? (
        <p className={cn("mt-1 text-[11px] font-medium", positive ? "text-sage-500" : "text-clay-600")}>{delta}</p>
      ) : null}
    </div>
  );
}
