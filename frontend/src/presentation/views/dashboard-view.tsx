"use client";

import Link from "next/link";
import {
  Upload, FileBarChart, CheckSquare, MessageSquareText, Cpu, ArrowRight, ArrowUpRight,
  ArrowDownRight, Sparkles, Landmark, Clock, Activity, HardDrive, Gauge, Quote,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime, formatNumber, daysUntil } from "@/src/application/services/formatting";
import { CURRENT_USER } from "@/src/infrastructure/mock/data";
import type { ActivityEvent, KpiMetric } from "@/src/domain/entities/analytics";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { BentoGrid, BentoCell } from "../components/bento/bento";
import { Sparkline, RadialGauge, IngestionHeatmap, MiniBars } from "../components/bento/widgets";
import { TrendLineChart, DonutChart, CategoryBarChart } from "../components/charts/charts";
import { cn } from "../components/ui/cn";

const ACTIVITY_ICONS: Record<ActivityEvent["kind"], typeof Upload> = {
  upload: Upload, report: FileBarChart, validation: CheckSquare,
  query: MessageSquareText, system: Cpu,
};

// a falling processing time or backlog is an improvement, so tone is decoupled from direction
const IMPROVES_WHEN_FALLING = new Set(["k2", "k4", "k6"]);

function KpiStat({ metric, series }: { metric: KpiMetric; series?: number[] }) {
  const falling = metric.delta < 0;
  const positive = IMPROVES_WHEN_FALLING.has(metric.id) ? falling : !falling;
  const Icon = falling ? ArrowDownRight : ArrowUpRight;

  return (
    <BentoCell className="col-span-1 sm:row-span-2 justify-between" padded>
      <div>
        <p className="truncate text-[11px] font-medium text-navy-500" title={metric.helpText}>
          {metric.label}
        </p>
        <p className="mt-1.5 font-serif text-[26px] leading-none font-semibold tracking-tight text-navy-900">
          {metric.value}
        </p>
      </div>
      {series ? <Sparkline values={series} className="my-1.5 h-7 opacity-90" /> : null}
      <div className="mt-1.5 flex items-center gap-1.5">
        <span className={cn("inline-flex items-center gap-0.5 text-[11px] font-medium", positive ? "text-emerald-600" : "text-red-600")}>
          <Icon className="size-3" aria-hidden />
          {Math.abs(metric.delta).toFixed(1)}%
        </span>
        <span className="truncate text-[10px] text-navy-400">{metric.unit}</span>
      </div>
    </BentoCell>
  );
}

export function DashboardView() {
  const { data, loading } = useAsync(() => repositories.analytics.dashboard(), []);

  if (loading || !data) {
    return (
      <div className="bento-glow min-h-screen p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-10 w-72 rounded-xl" />
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
          {Array.from({ length: 12 }, (_, i) => (
            <Skeleton key={i} className={cn("h-32 rounded-2xl", i === 0 && "sm:col-span-2 xl:col-span-3 h-44")} />
          ))}
        </div>
      </div>
    );
  }

  const {
    kpis, timeSeries, categories, performance, activity, pipeline,
    heatmap, accuracyTrend, storage, topQueries, deadlines, health, topTerms,
  } = data;

  const reportSeries = timeSeries.map((p) => p.reports);
  const querySeries = timeSeries.map((p) => p.queries);
  const docSeries = timeSeries.map((p) => p.documents);
  const storagePercent = (health.storageUsedGb / health.storageTotalGb) * 100;
  const topPerformer = [...performance]
    .filter((p) => p.production >= 20)
    .sort((a, b) => b.variance - a.variance)[0];

  return (
    <div className="bento-glow min-h-screen">
      <div className="p-4 sm:p-6 lg:p-8">
        <header className="mb-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-medium tracking-wider text-navy-400 uppercase">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            <h1 className="mt-1 font-serif text-[30px] leading-tight font-semibold tracking-tight text-navy-900 sm:text-4xl">
              Good morning, {CURRENT_USER.name.split(" ")[0]}.
            </h1>
            <p className="mt-1 text-sm text-navy-500">
              {formatNumber(health.activeUsers)} officials active · index refreshed {health.indexFreshnessMin} minutes ago
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/upload">
              <Button variant="secondary">
                <Upload className="size-4" aria-hidden />
                Upload
              </Button>
            </Link>
            <Link href="/reports">
              <Button>
                <FileBarChart className="size-4" aria-hidden />
                Generate report
              </Button>
            </Link>
          </div>
        </header>

        <BentoGrid>
          {/* hero: ask-anything entry point */}
          <BentoCell tone="navy" className="sm:row-span-2 sm:col-span-2 xl:col-span-3" padded>
            <div className="flex h-full flex-col justify-between gap-4">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-medium tracking-wider text-amber-brand-300 uppercase">
                  <Sparkles className="size-3" aria-hidden />
                  AI Query
                </span>
                <p className="mt-3.5 font-serif text-2xl leading-snug font-semibold text-white">
                  Ask anything of {formatNumber(18942)} indexed documents.
                </p>
                <p className="mt-2 text-[13px] leading-relaxed text-navy-200">
                  Every answer cites the source document and page it came from.
                </p>
              </div>
              <Link
                href="/query"
                className="group flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 transition-colors hover:bg-white/10"
              >
                <span className="flex-1 truncate text-[13px] text-white/50">
                  e.g. Which mines exceeded their stripping ratio?
                </span>
                <ArrowRight className="size-4 shrink-0 text-amber-brand-400 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </BentoCell>

          {kpis.slice(0, 3).map((metric, i) => (
            <KpiStat
              key={metric.id}
              metric={metric}
              series={i === 0 ? reportSeries : i === 1 ? querySeries : docSeries}
            />
          ))}

          {/* accuracy gauge */}
          <BentoCell tone="amber" className="sm:row-span-3 sm:col-span-1 xl:col-span-1" padded>
            <div className="flex h-full flex-col items-center justify-center py-1">
              <RadialGauge
                value={94.7}
                label="94.7%"
                sublabel="Extraction accuracy"
                size={120}
              />
            </div>
          </BentoCell>

          {/* activity trend */}
          <BentoCell
            className="sm:row-span-3 sm:col-span-2 xl:col-span-3"
            title="Activity trend"
            description="Reports, queries and documents over 12 months"
            action={
              <Link href="/analytics" className="text-[11px] font-medium text-amber-brand-600 hover:underline">
                Analytics
              </Link>
            }
          >
            <TrendLineChart
              data={timeSeries}
              height="100%"
              series={[
                { key: "reports", label: "Reports" },
                { key: "queries", label: "Queries" },
                { key: "documents", label: "Documents", axis: "right" as const },
              ]}
            />
          </BentoCell>

          {/* pipeline funnel */}
          <BentoCell className="sm:row-span-3 sm:col-span-2 xl:col-span-2" title="Digitisation funnel" description="Documents surviving each stage">
            <ul className="space-y-2.5">
              {pipeline.map((stage) => (
                <li key={stage.stage}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11px] text-navy-600">{stage.stage}</span>
                    <span className="shrink-0 text-[11px] font-medium tabular-nums text-navy-900">
                      {formatNumber(stage.count)}
                    </span>
                  </div>
                  <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-navy-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-brand-400 to-amber-brand-600"
                      style={{ width: `${stage.share}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          </BentoCell>

          {/* deadlines */}
          <BentoCell
            className="sm:row-span-4 sm:col-span-2 xl:col-span-2"
            title="Upcoming deadlines"
            description="Parliamentary replies due"
            action={
              <Link href="/parliamentary" className="text-[11px] font-medium text-amber-brand-600 hover:underline">
                Tracker
              </Link>
            }
          >
            <ul className="space-y-2">
              {deadlines.map((item) => {
                const days = daysUntil(item.dueAt);
                const tone = days < 0 ? "danger" : days <= 3 ? "danger" : days <= 7 ? "warning" : "neutral";
                return (
                  <li key={item.id} className="flex items-start gap-2.5 rounded-lg border border-navy-100 bg-cream/30 px-2.5 py-2">
                    <Landmark className="mt-0.5 size-3.5 shrink-0 text-navy-400" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11px] font-medium text-navy-900" title={item.subject}>
                        {item.subject}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-navy-400">
                        {item.referenceNo} · {item.assignedTo}
                      </p>
                    </div>
                    <Badge tone={tone}>
                      {days < 0 ? `${Math.abs(days)}d late` : `${days}d`}
                    </Badge>
                  </li>
                );
              })}
            </ul>
          </BentoCell>

          {/* ingestion heatmap */}
          <BentoCell className="sm:row-span-3 sm:col-span-2 xl:col-span-2" title="Ingestion rhythm" description="Uploads by day and hour">
            <IngestionHeatmap cells={heatmap} />
          </BentoCell>

          {/* report mix donut */}
          <BentoCell className="sm:row-span-3 sm:col-span-1 xl:col-span-2" title="Report mix" description="By template category">
            <DonutChart data={categories} height="100%" />
          </BentoCell>

          {/* accuracy trend */}
          <BentoCell
            className="sm:row-span-2 sm:col-span-1 xl:col-span-2"
            title="Accuracy climbing"
            description="Human corrections falling as models improve"
          >
            <div className="flex items-baseline gap-2">
              <span className="font-serif text-2xl font-semibold text-navy-900">
                {accuracyTrend[accuracyTrend.length - 1].accuracy}%
              </span>
              <span className="text-[11px] font-medium text-emerald-600">
                +{(accuracyTrend[accuracyTrend.length - 1].accuracy - accuracyTrend[0].accuracy).toFixed(1)} pts
              </span>
            </div>
            <Sparkline values={accuracyTrend.map((a) => a.accuracy)} className="mt-3 h-16" />
            <p className="mt-2 text-[10px] text-navy-400">
              {accuracyTrend[accuracyTrend.length - 1].humanCorrections} corrections last month,
              down from {accuracyTrend[0].humanCorrections}
            </p>
          </BentoCell>

          {/* subsidiary performance */}
          <BentoCell
            className="sm:row-span-3 sm:col-span-2 xl:col-span-3"
            title="Production against target"
            description="Million tonnes by subsidiary"
            action={<Badge tone="success">{topPerformer.subsidiary} leads +{topPerformer.variance.toFixed(1)}%</Badge>}
          >
            <CategoryBarChart
              data={performance}
              xKey="subsidiary"
              height="100%"
              series={[
                { key: "production", label: "Production" },
                { key: "target", label: "Target" },
              ]}
            />
          </BentoCell>

          {/* activity feed */}
          <BentoCell
            className="sm:row-span-4 sm:col-span-2 xl:col-span-3"
            title="Recent activity"
            description="Latest actions across the platform"
            padded={false}
          >
            <ul className="scrollbar-thin h-full divide-y divide-navy-50 overflow-y-auto px-4 pb-3">
              {activity.slice(0, 8).map((event) => {
                const Icon = ACTIVITY_ICONS[event.kind];
                return (
                  <li key={event.id} className="flex gap-2.5 py-2">
                    <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-500">
                      <Icon className="size-3" aria-hidden />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] leading-snug text-navy-700">
                        <span className="font-medium text-navy-900">{event.actor}</span> {event.action}{" "}
                        <span className="text-navy-600">{event.target}</span>
                      </p>
                      <p className="mt-0.5 text-[9.5px] text-navy-400">{relativeTime(event.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </BentoCell>

          {/* top queries */}
          <BentoCell
            className="sm:row-span-3 sm:col-span-2 xl:col-span-2"
            title="Most-asked questions"
            description="This week across the platform"
          >
            <ul className="space-y-2">
              {topQueries.slice(0, 3).map((query) => (
                <li key={query.id} className="rounded-lg border border-navy-100 bg-cream/30 px-2.5 py-2">
                  <p className="flex gap-1.5 text-[11px] leading-snug text-navy-800">
                    <Quote className="mt-0.5 size-2.5 shrink-0 text-navy-300" aria-hidden />
                    <span className="line-clamp-2">{query.question}</span>
                  </p>
                  <p className="mt-1 pl-4 text-[9.5px] text-navy-400">
                    {query.citationCount} sources · {(query.responseMs / 1000).toFixed(1)}s · {query.askedBy.split(" ")[0]}
                  </p>
                </li>
              ))}
            </ul>
          </BentoCell>

          {/* corpus terms */}
          <BentoCell
            className="sm:row-span-3 sm:col-span-2 xl:col-span-2"
            title="Dominant themes"
            description="Most frequent terms in the corpus"
            action={
              <Link href="/topics" className="text-[11px] font-medium text-amber-brand-600 hover:underline">
                Explore
              </Link>
            }
          >
            <div className="flex flex-wrap content-start items-baseline gap-x-2.5 gap-y-1.5">
              {topTerms.map((term) => (
                <Link
                  key={term.text}
                  href="/topics"
                  className={cn(
                    "font-serif leading-tight font-semibold transition-colors hover:text-amber-brand-600",
                    term.weight >= 75 ? "text-xl text-navy-900" :
                    term.weight >= 55 ? "text-lg text-navy-800" :
                    term.weight >= 40 ? "text-base text-navy-600" : "text-[13px] text-navy-400",
                  )}
                >
                  {term.text}
                </Link>
              ))}
            </div>
          </BentoCell>

          {/* storage */}
          <BentoCell className="sm:row-span-3 sm:col-span-1 xl:col-span-2" title="Corpus by format" description="Documents and volume">
            <MiniBars items={storage} valueKey="documents" labelKey="kind" />
          </BentoCell>

          {/* system health */}
          <BentoCell tone="cream" className="sm:row-span-2 sm:col-span-2 xl:col-span-4" title="System health" description="Live platform telemetry">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
              {[
                [Gauge, "Uptime", `${health.uptimePercent}%`],
                [Activity, "Avg. latency", `${health.avgLatencyMs} ms`],
                [Cpu, "OCR queue", `${health.ocrQueueDepth} jobs`],
                [Clock, "Index lag", `${health.indexFreshnessMin} min`],
              ].map(([Icon, label, value]) => {
                const IconComponent = Icon as typeof Gauge;
                return (
                  <div key={label as string}>
                    <dt className="flex items-center gap-1 text-[10px] text-navy-400">
                      <IconComponent className="size-3" aria-hidden />
                      {label as string}
                    </dt>
                    <dd className="mt-0.5 text-sm font-semibold text-navy-900">{value as string}</dd>
                  </div>
                );
              })}
            </dl>
            <div className="mt-4 border-t border-cream-dark pt-3">
              <div className="flex items-baseline justify-between gap-2">
                <span className="flex items-center gap-1 text-[10px] text-navy-400">
                  <HardDrive className="size-3" aria-hidden />
                  Storage
                </span>
                <span className="text-[11px] font-medium tabular-nums text-navy-700">
                  {health.storageUsedGb} / {formatNumber(health.storageTotalGb)} GB
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-navy-900" style={{ width: `${storagePercent}%` }} />
              </div>
            </div>
          </BentoCell>

          {/* validation nudge */}
          <BentoCell tone="plain" className="sm:row-span-2 sm:col-span-1 xl:col-span-1" padded>
            <Link href="/validation" className="group flex h-full flex-col justify-between">
              <div>
                <span className="grid size-8 place-items-center rounded-lg bg-amber-brand-50 text-amber-brand-600">
                  <CheckSquare className="size-4" aria-hidden />
                </span>
                <p className="mt-2.5 font-serif text-2xl font-semibold text-navy-900">126</p>
                <p className="mt-0.5 text-[11px] leading-snug text-navy-500">fields awaiting your review</p>
              </div>
              <span className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-amber-brand-600">
                Review queue
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </BentoCell>
        </BentoGrid>
      </div>
    </div>
  );
}
