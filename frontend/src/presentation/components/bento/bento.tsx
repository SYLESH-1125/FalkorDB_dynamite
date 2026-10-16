import type { ReactNode } from "react";
import { cn } from "../ui/cn";

export function BentoGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("grid grid-flow-dense grid-cols-1 gap-3 auto-rows-min sm:auto-rows-[7rem] sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6", className)}>
      {children}
    </div>
  );
}

type Tone = "plain" | "cream" | "navy" | "amber";

const TONES: Record<Tone, string> = {
  plain: "bg-white border-navy-100",
  cream: "bg-cream/70 border-cream-dark",
  navy: "bg-navy-900 border-navy-800 text-navy-100",
  amber: "bg-amber-brand-500 border-amber-brand-600 text-white",
};

export function BentoCell({
  children, className, tone = "plain", title, description, action, padded = true,
}: {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  padded?: boolean;
}) {
  const dark = tone === "navy" || tone === "amber";
  return (
    <section
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-2xl border shadow-[0_1px_2px_rgba(11,37,69,0.04),0_10px_30px_-18px_rgba(11,37,69,0.28)]",
        TONES[tone],
        className,
      )}
    >
      {title ? (
        <header className="flex items-start justify-between gap-3 px-4 pt-3.5 pb-2">
          <div className="min-w-0">
            <h2 className={cn("truncate text-[13px] font-semibold tracking-tight", dark ? "text-white" : "text-navy-900")}>
              {title}
            </h2>
            {description ? (
              <p className={cn("mt-0.5 truncate text-[11px]", dark ? "text-white/60" : "text-navy-400")}>
                {description}
              </p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </header>
      ) : null}
      <div className={cn("min-w-0 flex-1", padded && (title ? "px-4 pt-1 pb-4" : "p-4"))}>{children}</div>
    </section>
  );
}
