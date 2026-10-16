import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import type { KpiMetric } from "@/src/domain/entities/analytics";
import { cn } from "../ui/cn";

// a falling processing time or query backlog is an improvement, so tone is decoupled from direction
const IMPROVES_WHEN_FALLING = new Set(["k2", "k4", "k6"]);

export function KpiCard({ metric }: { metric: KpiMetric }) {
  const falling = metric.delta < 0;
  const positive = IMPROVES_WHEN_FALLING.has(metric.id) ? falling : !falling;
  const Icon = metric.delta === 0 ? Minus : falling ? ArrowDownRight : ArrowUpRight;

  return (
    <div className="rounded-xl border border-sand-300 bg-white p-4 shadow-[0_1px_2px_rgba(11,37,69,0.04)] transition-shadow hover:shadow-[0_8px_24px_-12px_rgba(11,37,69,0.18)]">
      <p className="truncate text-xs font-medium text-ink-400" title={metric.helpText}>
        {metric.label}
      </p>
      <p className="mt-2 font-serif text-3xl leading-none font-semibold tracking-tight text-ink-800">
        {metric.value}
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-xs font-medium",
            positive ? "text-emerald-600" : "text-red-600",
          )}
        >
          <Icon className="size-3.5" aria-hidden />
          {Math.abs(metric.delta).toFixed(1)}%
        </span>
        <span className="truncate text-[11px] text-ink-300">{metric.unit}</span>
      </div>
    </div>
  );
}
