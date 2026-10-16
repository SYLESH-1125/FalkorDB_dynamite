"use client";

import Link from "next/link";
import {
  Upload, FileBarChart, CheckSquare, MessageSquareText, Cpu, ArrowRight, AlertTriangle,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime, formatNumber } from "@/src/application/services/formatting";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader, CardBody } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { CardSkeleton, Skeleton } from "../components/ui/skeleton";
import { KpiCard } from "../components/shared/kpi-card";
import { TrendLineChart, CategoryBarChart, DonutChart } from "../components/charts/charts";
import type { ActivityEvent } from "@/src/domain/entities/analytics";

const ACTIVITY_ICONS: Record<ActivityEvent["kind"], typeof Upload> = {
  upload: Upload, report: FileBarChart, validation: CheckSquare,
  query: MessageSquareText, system: Cpu,
};

export function DashboardView() {
  const kpis = useAsync(() => repositories.analytics.kpis(), []);
  const series = useAsync(() => repositories.analytics.timeSeries(), []);
  const categories = useAsync(() => repositories.analytics.categoryBreakdown(), []);
  const performance = useAsync(() => repositories.analytics.subsidiaryPerformance(), []);
  const activity = useAsync(() => repositories.analytics.activity(), []);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Platform-wide overview of ingestion, validation and reporting activity."
        breadcrumbs={[{ label: "Dashboard" }]}
        action={
          <>
            <Link href="/upload">
              <Button variant="secondary" size="md">
                <Upload className="size-4" aria-hidden />
                Upload document
              </Button>
            </Link>
            <Link href="/reports">
              <Button size="md">
                <FileBarChart className="size-4" aria-hidden />
                Generate report
              </Button>
            </Link>
          </>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <section aria-label="Key performance indicators">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {kpis.loading
              ? Array.from({ length: 6 }, (_, i) => <CardSkeleton key={i} />)
              : kpis.data?.map((metric) => <KpiCard key={metric.id} metric={metric} />)}
          </div>
        </section>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Activity trend"
              description="Reports generated, documents ingested and queries raised over the last 12 months"
            />
            <CardBody>
              {series.loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <TrendLineChart
                  data={series.data ?? []}
                  series={[
                    { key: "reports", label: "Reports" },
                    { key: "queries", label: "Queries" },
                    { key: "documents", label: "Documents", axis: "right" as const },
                  ]}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Reports by category" description="Distribution across template types" />
            <CardBody>
              {categories.loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <DonutChart data={categories.data ?? []} />
              )}
            </CardBody>
          </Card>
        </div>

        <div className="grid gap-5 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader
              title="Subsidiary performance"
              description="Production against target, in million tonnes"
              action={
                <Link href="/analytics" className="inline-flex items-center gap-1 text-xs font-medium text-amber-brand-600 hover:underline">
                  Full analytics <ArrowRight className="size-3" aria-hidden />
                </Link>
              }
            />
            <CardBody>
              {performance.loading ? (
                <Skeleton className="h-[260px] w-full" />
              ) : (
                <CategoryBarChart
                  data={performance.data ?? []}
                  xKey="subsidiary"
                  series={[
                    { key: "production", label: "Production (MT)" },
                    { key: "target", label: "Target (MT)" },
                  ]}
                />
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader
              title="Recent activity"
              description="Latest actions across the platform"
            />
            <div className="scrollbar-thin max-h-[19rem] overflow-y-auto">
              {activity.loading ? (
                <div className="space-y-3 p-4">
                  {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : (
                <ul className="divide-y divide-navy-50">
                  {activity.data?.map((event) => {
                    const Icon = ACTIVITY_ICONS[event.kind];
                    return (
                      <li key={event.id} className="flex gap-3 px-4 py-2.5">
                        <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-500">
                          <Icon className="size-3.5" aria-hidden />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] leading-snug text-navy-700">
                            <span className="font-medium text-navy-900">{event.actor}</span>{" "}
                            {event.action}{" "}
                            <span className="text-navy-600">{event.target}</span>
                          </p>
                          <p className="mt-0.5 text-[10px] text-navy-400">{relativeTime(event.createdAt)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader
            title="Attention required"
            description="Items blocking pipeline throughput or approaching a deadline"
            action={
              <Link href="/validation">
                <Button variant="secondary" size="sm">Review queue</Button>
              </Link>
            }
          />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            {[
              ["126 fields awaiting validation", "Low-confidence extractions across 6 documents", "warning" as const, "/validation"],
              ["2 documents failed ingestion", "OCR could not process scanned survey files", "danger" as const, "/upload"],
              ["4 parliamentary queries due", "Replies required within the next 7 days", "danger" as const, "/parliamentary"],
            ].map(([title, body, tone, href]) => (
              <Link
                key={title}
                href={href}
                className="flex gap-3 rounded-xl border border-navy-100 bg-cream/40 p-3.5 transition-colors hover:border-amber-brand-200 hover:bg-amber-brand-50/40"
              >
                <AlertTriangle
                  className={`mt-0.5 size-4 shrink-0 ${tone === "danger" ? "text-red-500" : "text-amber-brand-500"}`}
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-navy-900">{title}</p>
                  <p className="mt-0.5 text-xs text-navy-500">{body}</p>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Subsidiary summary" description="Reports produced and open queries by subsidiary" />
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[38rem] text-sm">
              <thead>
                <tr className="bg-navy-50/80">
                  {["Subsidiary", "Production (MT)", "Target (MT)", "Variance", "Accuracy", "Reports", "Open queries"].map((h, i) => (
                    <th
                      key={h}
                      scope="col"
                      className={`border-b border-navy-100 px-3 py-2.5 text-[11px] font-semibold tracking-wide text-navy-600 uppercase first:pl-4 last:pr-4 ${i === 0 ? "text-left" : "text-right"}`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {performance.data?.map((row) => (
                  <tr key={row.subsidiary} className="border-b border-navy-50 last:border-0">
                    <td className="px-3 py-2.5 pl-4 font-medium text-navy-900">{row.subsidiary}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-navy-700">{formatNumber(row.production, 1)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-navy-500">{formatNumber(row.target, 1)}</td>
                    <td className="px-3 py-2.5 text-right">
                      <Badge tone={row.variance >= 0 ? "success" : "danger"}>
                        {row.variance >= 0 ? "+" : ""}{row.variance.toFixed(1)}%
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-navy-700">{row.accuracy.toFixed(1)}%</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-navy-700">{row.reports}</td>
                    <td className="px-3 py-2.5 pr-4 text-right tabular-nums text-navy-700">{row.pendingQueries}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
