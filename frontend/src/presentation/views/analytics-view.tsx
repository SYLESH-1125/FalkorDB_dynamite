"use client";

import { useState, type FormEvent } from "react";
import {
  Sparkles, SlidersHorizontal, X, TrendingUp, TrendingDown, Send, RotateCcw,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatNumber } from "@/src/application/services/formatting";
import { SUBSIDIARIES, MINE_TYPES } from "@/src/domain/entities/common";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader, CardBody } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Select, Label } from "../components/ui/field";
import { Skeleton } from "../components/ui/skeleton";
import { KpiCard } from "../components/shared/kpi-card";
import { TrendLineChart, CategoryBarChart, DonutChart, TrendAreaChart } from "../components/charts/charts";
import { cn } from "../components/ui/cn";

const PERIODS = ["FY 2025-26 H1", "FY 2025-26 Q2", "FY 2025-26 Q1", "FY 2024-25 Annual"];
const CATEGORIES = ["All categories", "Statutory", "Operational", "Parliamentary", "Environmental", "Financial"];

const QA_ANSWERS: { match: RegExp; answer: string }[] = [
  { match: /highest|top|best|most/i, answer: "SECL recorded the highest production at 96.1 MT, exceeding its target of 94.0 MT by 2.2%." },
  { match: /lowest|worst|behind|shortfall/i, answer: "BCCL shows the largest shortfall — 24.9 MT against a target of 27.1 MT, a variance of −8.1%." },
  { match: /accuracy|confidence|quality/i, answer: "Mean extraction accuracy across subsidiaries is 93.1%. NCL leads at 97.1%; BCCL trails at 88.2%." },
  { match: /trend|growth|over time|month/i, answer: "Report generation has grown steadily from 72 in March to 138 in February — a 91.7% increase over twelve months." },
];

const FALLBACK_QA = "Aggregate production across all subsidiaries stands at 422.6 MT against a combined target of 421.9 MT — an achievement of 100.2%. Six of eight subsidiaries met or exceeded target.";

export function AnalyticsView() {
  const kpis = useAsync(() => repositories.analytics.kpis(), []);
  const series = useAsync(() => repositories.analytics.timeSeries(), []);
  const categories = useAsync(() => repositories.analytics.categoryBreakdown(), []);
  const performance = useAsync(() => repositories.analytics.subsidiaryPerformance(), []);

  const [period, setPeriod] = useState(PERIODS[0]);
  const [subsidiary, setSubsidiary] = useState("All subsidiaries");
  const [mineType, setMineType] = useState("All mine types");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [railOpen, setRailOpen] = useState(false);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);

  const activeFilters = [
    period !== PERIODS[0] ? ["Period", period] : null,
    subsidiary !== "All subsidiaries" ? ["Subsidiary", subsidiary] : null,
    mineType !== "All mine types" ? ["Mine type", mineType] : null,
    category !== CATEGORIES[0] ? ["Category", category] : null,
  ].filter(Boolean) as [string, string][];

  const rows = (performance.data ?? []).filter(
    (row) => subsidiary === "All subsidiaries" || row.subsidiary === subsidiary,
  );

  function resetFilters() {
    setPeriod(PERIODS[0]);
    setSubsidiary("All subsidiaries");
    setMineType("All mine types");
    setCategory(CATEGORIES[0]);
  }

  function askQuestion(event: FormEvent) {
    event.preventDefault();
    if (!question.trim()) return;
    const matched = QA_ANSWERS.find((qa) => qa.match.test(question));
    setAnswer(matched?.answer ?? FALLBACK_QA);
  }

  // conditional formatting scale for the pivot table
  function heatFor(value: number, min: number, max: number): string {
    const ratio = max === min ? 0.5 : (value - min) / (max - min);
    if (ratio > 0.75) return "bg-success/15 text-success";
    if (ratio > 0.5) return "bg-success/10 text-success";
    if (ratio > 0.25) return "bg-surface-elevated text-ink-0";
    return "bg-danger/10 text-danger";
  }

  const productions = rows.map((r) => r.production);
  const minProd = Math.min(...productions, 0);
  const maxProd = Math.max(...productions, 1);

  return (
    <>
      <PageHeader
        title="Analytics & Insights"
        description="Cross-filterable operational analytics with historical comparison across subsidiaries."
        breadcrumbs={[{ label: "Intelligence" }, { label: "Analytics" }]}
        action={
          <Button variant="secondary" onClick={() => setRailOpen((v) => !v)} className="lg:hidden">
            <SlidersHorizontal className="size-4" aria-hidden />
            Filters
            {activeFilters.length > 0 ? (
              <span className="numeral ml-1 grid size-4 place-items-center rounded-full bg-primary-600 text-[9px] text-white">
                {activeFilters.length}
              </span>
            ) : null}
          </Button>
        }
      />

      <div className="grid min-w-0 gap-5 p-4 sm:p-6 lg:grid-cols-[15rem_1fr] lg:p-8">
        <aside
          className={cn(
            "h-fit card-raise rounded-xl border border-hairline bg-surface-card lg:sticky lg:top-20",
            !railOpen && "hidden lg:block",
          )}
        >
          <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
            <p className="type-caption flex items-center gap-2 text-muted">
              <SlidersHorizontal className="size-3.5" aria-hidden />
              Filters
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="type-caption inline-flex items-center gap-1.5 text-link hover:underline"
            >
              <RotateCcw className="size-3" aria-hidden />
              Reset
            </button>
          </div>

          <div className="space-y-4 p-4">
            <div>
              <Label htmlFor="filter-period">Date range</Label>
              <Select id="filter-period" value={period} onChange={(e) => setPeriod(e.target.value)}>
                {PERIODS.map((p) => <option key={p} value={p}>{p}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-subsidiary">Subsidiary</Label>
              <Select id="filter-subsidiary" value={subsidiary} onChange={(e) => setSubsidiary(e.target.value)}>
                <option>All subsidiaries</option>
                {SUBSIDIARIES.map((s) => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-mine">Mine type</Label>
              <Select id="filter-mine" value={mineType} onChange={(e) => setMineType(e.target.value)}>
                <option>All mine types</option>
                {MINE_TYPES.map((m) => <option key={m} value={m}>{m}</option>)}
              </Select>
            </div>
            <div>
              <Label htmlFor="filter-category">Report category</Label>
              <Select id="filter-category" value={category} onChange={(e) => setCategory(e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
          </div>

          {activeFilters.length > 0 ? (
            <div className="border-t border-hairline p-4">
              <p className="mb-2 text-[10px] font-normal tracking-wider text-muted-soft uppercase">Active</p>
              <div className="flex flex-wrap gap-1.5">
                {activeFilters.map(([label, value]) => (
                  <span key={label} className="inline-flex items-center gap-1 bg-surface-elevated px-2 py-0.5 text-[10px] text-ink-0">
                    {value}
                    <button
                      type="button"
                      aria-label={`Clear ${label} filter`}
                      onClick={() => {
                        if (label === "Period") setPeriod(PERIODS[0]);
                        if (label === "Subsidiary") setSubsidiary("All subsidiaries");
                        if (label === "Mine type") setMineType("All mine types");
                        if (label === "Category") setCategory(CATEGORIES[0]);
                      }}
                    >
                      <X className="size-2.5" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </aside>

        <div className="min-w-0 space-y-5">
          <Card>
            <CardBody className="py-3.5">
              <form onSubmit={askQuestion} className="flex items-center gap-2">
                <Sparkles className="size-4 shrink-0 text-ink-0" aria-hidden />
                <label htmlFor="qa-bar" className="sr-only">Ask a question about this data</label>
                <input
                  id="qa-bar"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about this data — e.g. which subsidiary had the highest production?"
                  className="min-w-0 flex-1 border-0 bg-transparent text-sm text-ink-0 placeholder:text-muted-soft focus:outline-none"
                />
                <Button type="submit" size="sm" disabled={!question.trim()}>
                  <Send className="size-3.5" aria-hidden />
                  <span className="hidden sm:inline">Ask</span>
                </Button>
              </form>
              {answer ? (
                <div className="mt-3 flex items-start gap-2 bg-surface-soft px-3.5 py-2.5">
                  <Sparkles className="mt-0.5 size-3.5 shrink-0 text-ink-0" aria-hidden />
                  <p className="text-[13px] leading-relaxed text-body-strong">{answer}</p>
                  <button
                    type="button"
                    onClick={() => setAnswer(null)}
                    aria-label="Dismiss answer"
                    className="ml-auto shrink-0 text-muted-soft hover:text-body"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>
              ) : null}
            </CardBody>
          </Card>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {kpis.loading
              ? Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-28 " />)
              : kpis.data?.slice(0, 3).map((metric) => <KpiCard key={metric.id} metric={metric} />)}
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Card>
              <CardHeader title="Reports and queries over time" description={period} />
              <CardBody>
                {series.loading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <TrendLineChart
                    data={series.data ?? []}
                    series={[
                      { key: "reports", label: "Reports" },
                      { key: "queries", label: "Queries" },
                    ]}
                  />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Document ingestion volume" description="Monthly documents digitised" />
              <CardBody>
                {series.loading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <TrendAreaChart data={series.data ?? []} dataKey="documents" label="Documents" height={260} />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Production vs target" description="Million tonnes by subsidiary" />
              <CardBody>
                {performance.loading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <CategoryBarChart
                    data={rows}
                    xKey="subsidiary"
                    series={[
                      { key: "production", label: "Production" },
                      { key: "target", label: "Target" },
                    ]}
                  />
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Report mix by category" description="Share of total output" />
              <CardBody>
                {categories.loading ? (
                  <Skeleton className="h-[260px] w-full" />
                ) : (
                  <DonutChart data={categories.data ?? []} />
                )}
              </CardBody>
            </Card>
          </div>

          <Card>
            <CardHeader
              title="Subsidiary matrix"
              description="Conditional formatting highlights performance against the group range"
            />
            <div className="scrollbar-thin overflow-x-auto">
              <table className="w-full min-w-[46rem] text-sm">
                <thead>
                  <tr className="bg-surface-soft/80">
                    {["Subsidiary", "Production (MT)", "Target (MT)", "Variance", "Accuracy", "Reports", "Open queries"].map((h, i) => (
                      <th
                        key={h}
                        scope="col"
                        className={cn(
                          "border-b border-hairline px-3 py-2.5 text-[11px] font-normal tracking-wide text-body uppercase first:pl-4 last:pr-4",
                          i === 0 ? "text-left" : "text-right",
                        )}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => (
                    <tr key={row.subsidiary} className="border-b border-hairline last:border-0">
                      <td className="px-3 py-2.5 pl-4 font-normal text-ink-0">{row.subsidiary}</td>
                      <td className="px-1 py-1.5">
                        <span className={cn("block px-2 py-1.5 text-right tabular-nums", heatFor(row.production, minProd, maxProd))}>
                          {formatNumber(row.production, 1)}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-muted">{formatNumber(row.target, 1)}</td>
                      <td className="px-3 py-2.5 text-right">
                        <span className={cn("inline-flex items-center gap-0.5 text-xs font-normal", row.variance >= 0 ? "text-success" : "text-danger")}>
                          {row.variance >= 0 ? <TrendingUp className="size-3" aria-hidden /> : <TrendingDown className="size-3" aria-hidden />}
                          {row.variance >= 0 ? "+" : ""}{row.variance.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-body">{row.accuracy.toFixed(1)}%</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-body">{row.reports}</td>
                      <td className="px-3 py-2.5 pr-4 text-right">
                        {row.pendingQueries > 6 ? (
                          <Badge tone="danger">{row.pendingQueries}</Badge>
                        ) : (
                          <span className="tabular-nums text-body">{row.pendingQueries}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-surface-soft font-normal">
                    <td className="px-3 py-2.5 pl-4 text-ink-0">Total</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-0">
                      {formatNumber(rows.reduce((s, r) => s + r.production, 0), 1)}
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-body">
                      {formatNumber(rows.reduce((s, r) => s + r.target, 0), 1)}
                    </td>
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5" />
                    <td className="px-3 py-2.5 text-right tabular-nums text-ink-0">
                      {rows.reduce((s, r) => s + r.reports, 0)}
                    </td>
                    <td className="px-3 py-2.5 pr-4 text-right tabular-nums text-ink-0">
                      {rows.reduce((s, r) => s + r.pendingQueries, 0)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
