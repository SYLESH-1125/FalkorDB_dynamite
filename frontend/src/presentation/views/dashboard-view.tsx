"use client";

import Link from "next/link";
import {
  Upload, FileBarChart, CheckSquare, MessageSquareText, Cpu, Landmark,
  FileStack, Gauge, ArrowUpRight, ArrowDownRight, ArrowRight, Clock,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { useSession } from "@/src/application/hooks/use-session";
import { relativeTime, formatNumber, daysUntil } from "@/src/application/services/formatting";
import type { ActivityEvent } from "@/src/domain/entities/analytics";
import { Skeleton } from "../components/ui/skeleton";
import { Tile } from "../components/canvas/tile";
import { Spark } from "../components/canvas/widgets";
import { TrendLineChart, CategoryBarChart } from "../components/charts/charts";
import { Badge } from "../components/ui/badge";
import { cn } from "../components/ui/cn";

const ACTIVITY_ICONS: Record<ActivityEvent["kind"], typeof Upload> = {
  upload: Upload, report: FileBarChart, validation: CheckSquare,
  query: MessageSquareText, system: Cpu,
};

const KPI_ICONS: Record<string, typeof Upload> = {
  k1: FileBarChart, k2: Gauge, k3: FileStack, k4: CheckSquare,
};

function DeltaBadge({ delta }: { delta: number }) {
  const positive = delta >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
        positive ? "bg-success/10 text-success" : "bg-danger/10 text-danger",
      )}
    >
      {positive ? <ArrowUpRight className="size-3" aria-hidden /> : <ArrowDownRight className="size-3" aria-hidden />}
      {Math.abs(delta)}%
    </span>
  );
}

export function DashboardView() {
  const { data, loading } = useAsync(() => repositories.analytics.dashboard(), []);
  const { session } = useSession();
  const firstName = session?.user.name.split(" ")[0] ?? "there";

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-canvas p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-9 w-64" />
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Skeleton className="h-80 lg:col-span-2" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { kpis, timeSeries, performance, activity, pipeline, deadlines, health } = data;
  const pendingValidation = kpis.find((k) => k.id === "k2")?.rawValue ?? 0;
  const storagePct = health.storageTotalGb > 0 ? (health.storageUsedGb / health.storageTotalGb) * 100 : 0;

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-hairline bg-surface-card px-4 py-6 sm:px-6 lg:px-8">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold tracking-[0.1em] text-muted uppercase">
            {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
          <h1 className="display-sm mt-1.5 text-ink-0">Good morning, {firstName}</h1>
          <p className="mt-1.5 max-w-xl text-[13px] leading-relaxed text-body">
            {formatNumber(pendingValidation)} fields need review and {deadlines.length} parliamentary
            replies are due this week.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Link
            href="/upload"
            className="inline-flex h-9.5 items-center gap-2 rounded-md border border-hairline-strong bg-surface-card px-4 text-[13px] font-medium text-body-strong transition-colors hover:bg-surface-soft"
          >
            <Upload className="size-3.5" aria-hidden />
            Upload
          </Link>
          <Link
            href="/reports"
            className="inline-flex h-9.5 items-center gap-2 rounded-md bg-secondary-400 px-4 text-[13px] font-semibold text-ink-0 transition-colors hover:bg-secondary-300"
          >
            <FileBarChart className="size-3.5" aria-hidden />
            Generate report
          </Link>
        </div>
      </div>

      <div className="space-y-4 px-4 py-6 sm:px-6 lg:px-8">
        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((kpi) => {
            const Icon = KPI_ICONS[kpi.id] ?? Gauge;
            const spark = timeSeries.map((t) => t.documents);
            return (
              <div key={kpi.id} className="card-raise rounded-lg border border-hairline-strong bg-surface-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid size-9 shrink-0 place-items-center rounded-md bg-tint-navy text-primary-600">
                    <Icon className="size-4.5" aria-hidden />
                  </span>
                  {kpi.delta !== 0 ? <DeltaBadge delta={kpi.delta} /> : null}
                </div>
                <p className="numeral mt-3 text-[26px] leading-none text-ink-0">{kpi.value}</p>
                <p className="mt-1.5 text-[12px] text-body">{kpi.label}</p>
                {spark.length > 1 ? <Spark values={spark} className="mt-3 h-8" stroke="#1c4693" /> : null}
              </div>
            );
          })}
        </div>

        {/* trend + funnel */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Tile
            className="lg:col-span-2"
            label="Platform activity"
            hint="Reports, queries and documents over time"
            action={
              <Link href="/analytics" className="type-caption inline-flex items-center gap-1 text-link hover:underline">
                Full analytics <ArrowRight className="size-3" aria-hidden />
              </Link>
            }
          >
            <TrendLineChart
              data={timeSeries}
              height={280}
              series={[
                { key: "reports", label: "Reports" },
                { key: "queries", label: "Queries" },
                { key: "documents", label: "Documents", axis: "right" as const },
              ]}
            />
          </Tile>

          <Tile label="Digitisation funnel" hint="Documents surviving each pipeline stage">
            <ul className="flex h-full flex-col justify-between gap-3">
              {pipeline.map((s) => (
                <li key={s.stage}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[12.5px] text-body-strong">{s.stage}</span>
                    <span className="shrink-0 numeral text-[12.5px] text-ink-0">{formatNumber(s.count)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                    <div className="h-full rounded-full bg-primary-500" style={{ width: `${s.share}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Tile>
        </div>

        {/* performance + deadlines */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Tile
            className="lg:col-span-2"
            label="Production against target"
            hint="Million tonnes by subsidiary, current quarter"
          >
            <CategoryBarChart
              data={performance}
              xKey="subsidiary"
              height={260}
              series={[
                { key: "production", label: "Production" },
                { key: "target", label: "Target" },
              ]}
            />
          </Tile>

          <Tile
            label="Due this week"
            hint="Parliamentary replies"
            action={
              <Link href="/parliamentary" className="type-caption text-link hover:underline">
                Tracker
              </Link>
            }
          >
            <ul className="flex h-full flex-col gap-3">
              {deadlines.slice(0, 5).map((d) => {
                const days = daysUntil(d.dueAt);
                const late = days < 0;
                return (
                  <li key={d.id} className="flex items-start gap-2.5">
                    <span
                      className={cn(
                        "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md",
                        d.priority === "critical" ? "bg-danger/10 text-danger" :
                        d.priority === "high" ? "bg-warning/10 text-warning" : "bg-surface-soft text-muted",
                      )}
                    >
                      <Landmark className="size-3" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] font-medium text-body-strong" title={d.subject}>
                        {d.subject}
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted">
                        <span className="truncate">{d.referenceNo}</span>
                        <span aria-hidden>·</span>
                        <span className={cn("shrink-0 font-medium", late && "text-danger")}>
                          {late ? `${Math.abs(days)}d late` : `${days}d left`}
                        </span>
                      </p>
                    </div>
                  </li>
                );
              })}
              {deadlines.length === 0 ? (
                <li className="text-[11.5px] text-muted-soft">Nothing due this week.</li>
              ) : null}
            </ul>
          </Tile>
        </div>

        {/* activity + health */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <Tile className="lg:col-span-2" label="Recent activity" hint="Latest across the platform" flush>
            <ul>
              {activity.slice(0, 6).map((e) => {
                const Icon = ACTIVITY_ICONS[e.kind] ?? Cpu;
                return (
                  <li key={e.id} className="flex items-center gap-3 border-b border-hairline px-4 py-3 last:border-0">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-soft text-muted">
                      <Icon className="size-3.5" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12.5px] leading-snug text-body">
                        <span className="font-medium text-ink-0">{e.actor}</span> {e.action}{" "}
                        <span className="text-body-strong">{e.target}</span>
                      </p>
                    </div>
                    <span className="shrink-0 flex items-center gap-1 text-[11px] text-muted">
                      <Clock className="size-3" aria-hidden />
                      {relativeTime(e.createdAt)}
                    </span>
                  </li>
                );
              })}
              {activity.length === 0 ? (
                <li className="px-4 py-3 text-[11.5px] text-muted-soft">No activity yet.</li>
              ) : null}
            </ul>
          </Tile>

          <Tile tone="sand" label="System health" hint="Live telemetry">
            <div className="flex h-full flex-col justify-between gap-4">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-3">
                {[
                  ["Uptime", `${health.uptimePercent}%`],
                  ["Latency", `${health.avgLatencyMs} ms`],
                  ["OCR queue", `${health.ocrQueueDepth} jobs`],
                  ["Active users", `${health.activeUsers}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[10px] font-medium tracking-wide text-muted uppercase">{k}</dt>
                    <dd className="mt-1 flex items-center gap-1.5">
                      <span className="text-[14px] font-semibold text-ink-0">{v}</span>
                      {k === "Uptime" ? <Badge tone="success">Healthy</Badge> : null}
                    </dd>
                  </div>
                ))}
              </dl>
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[10px] font-medium tracking-wide text-muted uppercase">Storage</span>
                  <span className="text-[11px] font-medium tabular-nums text-body">
                    {health.storageUsedGb} / {formatNumber(health.storageTotalGb)} GB
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-hairline">
                  <div className="h-full rounded-full bg-primary-500" style={{ width: `${storagePct}%` }} />
                </div>
              </div>
            </div>
          </Tile>
        </div>
      </div>
    </div>
  );
}
