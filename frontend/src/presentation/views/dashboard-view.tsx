"use client";

import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, Upload, FileBarChart, CheckSquare,
  MessageSquareText, Cpu, Landmark, Quote,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime, formatNumber, daysUntil } from "@/src/application/services/formatting";
import { CURRENT_USER } from "@/src/infrastructure/mock/data";
import type { ActivityEvent } from "@/src/domain/entities/analytics";
import { Skeleton } from "../components/ui/skeleton";
import { TileGrid, Tile, Metric } from "../components/canvas/tile";
import { Spark, Dial, Heatmap, Bars } from "../components/canvas/widgets";
import { TrendLineChart, DonutChart, CategoryBarChart } from "../components/charts/charts";
import { cn } from "../components/ui/cn";

const ACTIVITY_ICONS: Record<ActivityEvent["kind"], typeof Upload> = {
  upload: Upload, report: FileBarChart, validation: CheckSquare,
  query: MessageSquareText, system: Cpu,
};

export function DashboardView() {
  const { data, loading } = useAsync(() => repositories.analytics.dashboard(), []);

  if (loading || !data) {
    return (
      <div className="min-h-screen bg-sand-100 p-4 sm:p-6 lg:p-8">
        <Skeleton className="h-9 w-64 rounded-lg" />
        <div className="mt-8 grid grid-cols-2 gap-2.5 lg:grid-cols-6 xl:grid-cols-12">
          {[6, 3, 3, 4, 4, 4, 8, 4, 6, 6].map((span, i) => (
            <Skeleton key={i} className={cn("h-40 rounded-[14px]", `col-span-2 xl:col-span-${span}`)} />
          ))}
        </div>
      </div>
    );
  }

  const {
    kpis, timeSeries, categories, performance, activity, pipeline,
    heatmap, accuracyTrend, storage, topQueries, deadlines, health, topTerms,
  } = data;

  const latestAccuracy = accuracyTrend[accuracyTrend.length - 1];
  const accuracyGain = latestAccuracy.accuracy - accuracyTrend[0].accuracy;
  const leader = [...performance].filter((p) => p.production >= 20).sort((a, b) => b.variance - a.variance)[0];
  const storagePct = (health.storageUsedGb / health.storageTotalGb) * 100;

  return (
    <div className="min-h-screen bg-sand-100">
      <div className="gradient-hero px-4 pt-8 pb-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div className="min-w-0">
            <p className="text-[10px] font-semibold tracking-[0.14em] text-ink-300 uppercase">
              {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
            </p>
            <h1 className="mt-2 font-serif text-[34px] leading-[1.05] font-semibold tracking-tight text-ink-800 sm:text-[42px]">
              Good morning, {CURRENT_USER.name.split(" ")[0]}
            </h1>
            <p className="mt-2 max-w-xl text-[13px] leading-relaxed text-ink-400">
              {formatNumber(126)} fields need review and {deadlines.length} parliamentary replies
              are due this week. The index last refreshed {health.indexFreshnessMin} minutes ago.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/upload"
              className="inline-flex h-9 items-center gap-1.5 rounded-full border border-sand-400 bg-sand-50 px-4 text-[13px] font-medium text-ink-700 transition-colors hover:bg-white"
            >
              <Upload className="size-3.5" aria-hidden />
              Upload
            </Link>
            <Link
              href="/reports"
              className="inline-flex h-9 items-center gap-1.5 rounded-full bg-ink-800 px-4 text-[13px] font-medium text-sand-50 transition-colors hover:bg-ink-700"
            >
              <FileBarChart className="size-3.5" aria-hidden />
              Generate report
            </Link>
          </div>
        </div>
      </div>

      <div className="px-4 pb-10 sm:px-6 lg:px-8">
        <TileGrid>
          {/* ─────────── row 1: hero + accuracy dial + two metrics ─────────── */}
          <Tile tone="ink" className="col-span-2 sm:row-span-3 lg:col-span-4 xl:col-span-5" flush>
            <Link href="/query" className="group flex h-full flex-col justify-between p-5">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.14em] text-clay-300 uppercase">
                  AI Query
                </p>
                <p className="mt-4 font-serif text-[26px] leading-[1.15] font-semibold text-white sm:text-[30px]">
                  Ask anything of {formatNumber(18942)} indexed documents.
                </p>
                <p className="mt-3 max-w-sm text-[13px] leading-relaxed text-white/55">
                  Every answer cites the source document and the page it came from.
                </p>
              </div>
              <span className="mt-5 flex items-center gap-2 rounded-full border border-white/12 bg-white/5 px-4 py-2.5">
                <span className="flex-1 truncate text-[12.5px] text-white/40">
                  Which mines exceeded their stripping ratio?
                </span>
                <ArrowRight className="size-4 shrink-0 text-clay-300 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </Tile>

          <Tile tone="clay" className="col-span-2 sm:row-span-3 lg:col-span-2 xl:col-span-3">
            <Dial value={latestAccuracy.accuracy} display={`${latestAccuracy.accuracy}%`} caption="Extraction accuracy" />
          </Tile>

          <Tile className="col-span-1 sm:row-span-2 xl:col-span-2" label="Reports">
            <Metric
              value={kpis[0].value}
              caption={kpis[0].unit}
              delta={`↑ ${kpis[0].delta}% this quarter`}
              positive
            />
          </Tile>

          <Tile className="col-span-1 sm:row-span-2 xl:col-span-2" label="Documents">
            <Metric
              value={formatNumber(18942)}
              caption="indexed and query-ready"
              delta="↑ 7.8% cumulative"
              positive
            />
          </Tile>

          <Tile className="col-span-2 sm:row-span-1 xl:col-span-4" label="Throughput" flush>
            <div className="flex h-full items-center gap-4 px-4 pb-3">
              <div className="shrink-0">
                <p className="font-serif text-xl leading-none font-semibold text-ink-800">{kpis[1].value}</p>
                <p className="mt-1 text-[10px] text-ink-300">avg. per document</p>
              </div>
              <Spark values={timeSeries.map((t) => t.documents)} className="h-8 flex-1" />
            </div>
          </Tile>

          {/* ─────────── row 2: activity trend (wide) + funnel ─────────── */}
          <Tile
            className="col-span-2 sm:row-span-4 lg:col-span-4 xl:col-span-8"
            label="Activity"
            hint="Reports, queries and documents over twelve months"
            action={
              <Link href="/analytics" className="text-[11px] font-medium text-clay-600 hover:underline">
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
          </Tile>

          <Tile className="col-span-2 sm:row-span-4 lg:col-span-2 xl:col-span-4" label="Digitisation funnel" hint="Documents surviving each stage">
            <ul className="flex h-full flex-col justify-between">
              {pipeline.map((s) => (
                <li key={s.stage}>
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-[11.5px] text-ink-500">{s.stage}</span>
                    <span className="shrink-0 text-[11.5px] font-medium tabular-nums text-ink-800">
                      {formatNumber(s.count)}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-sand-300">
                    <div className="h-full rounded-full bg-clay-500" style={{ width: `${s.share}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          </Tile>

          {/* ─────────── row 3: deadlines + heatmap + donut ─────────── */}
          <Tile
            className="col-span-2 sm:row-span-4 lg:col-span-3 xl:col-span-4"
            label="Due this week"
            hint="Parliamentary replies"
            action={
              <Link href="/parliamentary" className="text-[11px] font-medium text-clay-600 hover:underline">
                Tracker
              </Link>
            }
          >
            <ul className="flex h-full flex-col justify-between gap-1.5">
              {deadlines.slice(0, 5).map((d) => {
                const days = daysUntil(d.dueAt);
                const late = days < 0;
                const soon = days >= 0 && days <= 3;
                return (
                  <li key={d.id} className="flex items-start gap-2.5">
                    <Landmark className="mt-0.5 size-3 shrink-0 text-ink-300" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[11.5px] font-medium text-ink-700" title={d.subject}>
                        {d.subject}
                      </p>
                      <p className="mt-0.5 truncate text-[10px] text-ink-300">{d.referenceNo}</p>
                    </div>
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[9.5px] font-semibold tabular-nums",
                        late || soon ? "bg-clay-100 text-clay-700" : "bg-sand-300 text-ink-500",
                      )}
                    >
                      {late ? `${Math.abs(days)}d late` : `${days}d`}
                    </span>
                  </li>
                );
              })}
            </ul>
          </Tile>

          <Tile className="col-span-2 sm:row-span-4 lg:col-span-3 xl:col-span-4" label="Ingestion rhythm" hint="Uploads by day and hour">
            <Heatmap cells={heatmap} />
          </Tile>

          <Tile className="col-span-2 sm:row-span-4 lg:col-span-3 xl:col-span-4" label="Report mix" hint="By template category">
            <DonutChart data={categories} height="100%" />
          </Tile>

          {/* ─────────── row 4: production + activity feed ─────────── */}
          <Tile
            className="col-span-2 sm:row-span-4 lg:col-span-3 xl:col-span-7"
            label="Production against target"
            hint="Million tonnes by subsidiary"
            action={
              <span className="rounded-full bg-sage-400/15 px-2 py-0.5 text-[10px] font-medium text-sage-500">
                {leader.subsidiary} +{leader.variance.toFixed(1)}%
              </span>
            }
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
          </Tile>

          <Tile
            className="col-span-2 sm:row-span-4 lg:col-span-3 xl:col-span-5"
            label="Activity"
            hint="Latest across the platform"
            flush
          >
            <ul className="scrollbar-thin h-full overflow-y-auto px-4 pt-2 pb-3">
              {activity.slice(0, 7).map((e) => {
                const Icon = ACTIVITY_ICONS[e.kind];
                return (
                  <li key={e.id} className="flex gap-2.5 border-b border-sand-200 py-2 last:border-0">
                    <Icon className="mt-0.5 size-3 shrink-0 text-ink-300" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="text-[11.5px] leading-snug text-ink-500">
                        <span className="font-medium text-ink-800">{e.actor}</span> {e.action}{" "}
                        <span className="text-ink-600">{e.target}</span>
                      </p>
                      <p className="mt-0.5 text-[9.5px] text-ink-300">{relativeTime(e.createdAt)}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </Tile>

          {/* ─────────── row 5: themes + review + accuracy + queries ─────────── */}
          <Tile
            className="col-span-2 sm:row-span-3 lg:col-span-3 xl:col-span-5"
            label="Dominant themes"
            hint="Most frequent terms in the corpus"
            action={
              <Link href="/topics" className="text-[11px] font-medium text-clay-600 hover:underline">
                Explore
              </Link>
            }
          >
            <div className="flex flex-wrap content-start items-baseline gap-x-2.5 gap-y-1">
              {topTerms.slice(0, 12).map((t) => (
                <Link
                  key={t.text}
                  href="/topics"
                  className={cn(
                    "font-serif leading-tight font-semibold transition-colors hover:text-clay-600",
                    t.weight >= 75 ? "text-lg text-ink-800" :
                    t.weight >= 55 ? "text-base text-ink-600" :
                    t.weight >= 40 ? "text-[13px] text-ink-500" : "text-[12px] text-ink-300",
                  )}
                >
                  {t.text}
                </Link>
              ))}
            </div>
          </Tile>

          <Tile tone="sand" className="col-span-1 sm:row-span-3 lg:col-span-3 xl:col-span-3">
            <Link href="/validation" className="group flex h-full flex-col justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.09em] text-ink-400 uppercase">Review queue</p>
                <p className="mt-4 font-serif text-[56px] leading-[0.9] font-semibold text-ink-800">126</p>
                <p className="mt-2.5 text-[12px] leading-snug text-ink-400">
                  low-confidence fields awaiting a human decision
                </p>
              </div>
              <span className="mt-3 inline-flex items-center gap-1 text-[11.5px] font-medium text-clay-600">
                Open queue
                <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </span>
            </Link>
          </Tile>

          <Tile className="col-span-1 sm:row-span-3 lg:col-span-3 xl:col-span-4" label="Accuracy climbing" hint="Corrections falling as models improve">
            <div className="flex h-full flex-col justify-between">
              <div className="flex items-baseline gap-2">
                <span className="font-serif text-[26px] leading-none font-semibold text-ink-800">
                  {latestAccuracy.accuracy}%
                </span>
                <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-sage-500">
                  <ArrowUpRight className="size-3" aria-hidden />
                  {accuracyGain.toFixed(1)} pts
                </span>
              </div>
              <Spark values={accuracyTrend.map((a) => a.accuracy)} className="h-12" />
              <p className="text-[10px] text-ink-300">
                {latestAccuracy.humanCorrections} corrections last month, from {accuracyTrend[0].humanCorrections}
              </p>
            </div>
          </Tile>

          {/* ─────────── row 6: queries + storage + health ─────────── */}
          <Tile className="col-span-2 sm:row-span-3 lg:col-span-3 xl:col-span-5" label="Most-asked" hint="Across the platform this week">
            <ul className="flex h-full flex-col justify-between gap-1.5">
              {topQueries.slice(0, 4).map((q) => (
                <li key={q.id} className="flex gap-1.5">
                  <Quote className="mt-1 size-2.5 shrink-0 text-sand-500" aria-hidden />
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-[11.5px] leading-snug text-ink-600">{q.question}</p>
                    <p className="mt-0.5 text-[9.5px] text-ink-300">
                      {q.citationCount} sources · {(q.responseMs / 1000).toFixed(1)}s
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Tile>

          <Tile className="col-span-1 sm:row-span-3 lg:col-span-3 xl:col-span-3" label="Corpus" hint="By document format">
            <Bars items={storage} valueKey="documents" labelKey="kind" />
          </Tile>

          <Tile tone="sand" className="col-span-1 sm:row-span-3 lg:col-span-6 xl:col-span-4" label="System health" hint="Live telemetry">
            <div className="flex h-full flex-col justify-between">
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2.5">
                {[
                  ["Uptime", `${health.uptimePercent}%`],
                  ["Latency", `${health.avgLatencyMs} ms`],
                  ["OCR queue", `${health.ocrQueueDepth} jobs`],
                  ["Index lag", `${health.indexFreshnessMin} min`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[9.5px] tracking-wide text-ink-300 uppercase">{k}</dt>
                    <dd className="mt-0.5 text-[13px] font-semibold text-ink-800">{v}</dd>
                  </div>
                ))}
              </dl>
              <div>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[9.5px] tracking-wide text-ink-300 uppercase">Storage</span>
                  <span className="text-[10.5px] font-medium tabular-nums text-ink-500">
                    {health.storageUsedGb} / {formatNumber(health.storageTotalGb)} GB
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-sand-50">
                  <div className="h-full rounded-full bg-ink-700" style={{ width: `${storagePct}%` }} />
                </div>
              </div>
            </div>
          </Tile>
        </TileGrid>
      </div>
    </div>
  );
}
