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
    <div className="card-raise rounded-xl border border-hairline bg-surface-card p-5 transition-shadow hover:card-float">
      <p className="truncate text-[12px] font-medium text-body" title={metric.helpText}>
        {metric.label}
      </p>
      <p className="numeral mt-2.5 text-[30px] leading-none text-ink-0">{metric.value}</p>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
        <span
          className={cn(
            "inline-flex items-center gap-0.5 text-[12px] font-medium",
            positive ? "text-success" : "text-danger",
          )}
        >
          <Icon className="size-3" aria-hidden />
          {Math.abs(metric.delta).toFixed(1)}%
        </span>
        <span className="truncate text-[11.5px] text-muted">{metric.unit}</span>
      </div>
    </div>
  );
}
