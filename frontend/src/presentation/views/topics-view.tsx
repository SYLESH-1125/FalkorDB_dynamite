"use client";

import { useMemo, useState } from "react";
import { Cloud, TrendingUp, TrendingDown, Minus, FileSearch } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import type { TopicTerm } from "@/src/domain/entities/topic";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader, CardBody } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select } from "../components/ui/field";
import { Skeleton } from "../components/ui/skeleton";
import { CategoryBarChart } from "../components/charts/charts";
import { cn } from "../components/ui/cn";

// map term weight onto a discrete type scale so the cloud stays legible
function sizeFor(weight: number): string {
  if (weight >= 80) return "text-4xl sm:text-5xl";
  if (weight >= 60) return "text-3xl sm:text-4xl";
  if (weight >= 45) return "text-2xl sm:text-3xl";
  if (weight >= 30) return "text-xl sm:text-2xl";
  if (weight >= 20) return "text-lg";
  return "text-sm";
}

function toneFor(weight: number): string {
  if (weight >= 70) return "text-clay-600";
  if (weight >= 45) return "text-ink-800";
  if (weight >= 25) return "text-ink-500";
  return "text-ink-300";
}

export function TopicsView() {
  const terms = useAsync(() => repositories.topics.terms(), []);
  const clusters = useAsync(() => repositories.topics.clusters(), []);
  const [category, setCategory] = useState("all");
  const [selected, setSelected] = useState<TopicTerm | null>(null);

  const allTerms = useMemo(() => terms.data ?? [], [terms.data]);
  const categories = useMemo(
    () => ["all", ...new Set(allTerms.map((t) => t.category))],
    [allTerms],
  );

  const visible = category === "all" ? allTerms : allTerms.filter((t) => t.category === category);

  // shuffle deterministically so the cloud does not read as a sorted list
  const scattered = useMemo(() => {
    return [...visible].sort((a, b) => (a.text.length % 7) - (b.text.length % 7) || b.weight - a.weight);
  }, [visible]);

  return (
    <>
      <PageHeader
        title="Word Cloud & Topic Identification"
        description="Dominant terms and thematic clusters extracted across the indexed corpus."
        breadcrumbs={[{ label: "Intelligence" }, { label: "Word Cloud & Topics" }]}
        action={
          <Select
            aria-label="Filter by category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="h-9 w-auto"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>
            ))}
          </Select>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Unique terms", allTerms.length],
            ["Topic clusters", clusters.data?.length ?? 0],
            ["Documents analysed", "18,942"],
            ["Dominant theme", "Production & Output"],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border border-sand-300 bg-white p-4">
              <p className="text-xs text-ink-400">{label as string}</p>
              <p className="mt-1 truncate font-serif text-xl font-semibold text-ink-800">
                {value as string | number}
              </p>
            </div>
          ))}
        </div>

        <div className="grid gap-5 xl:grid-cols-5">
          <Card className="xl:col-span-3">
            <CardHeader
              title="Term cloud"
              description="Size and colour reflect frequency across the corpus — select a term to inspect it"
              action={<Cloud className="size-4 text-clay-500" aria-hidden />}
            />
            <CardBody>
              {terms.loading ? (
                <Skeleton className="h-80 w-full" />
              ) : (
                <div className="flex min-h-80 flex-wrap items-center justify-center gap-x-4 gap-y-2 p-2">
                  {scattered.map((term) => (
                    <button
                      key={term.text}
                      type="button"
                      onClick={() => setSelected(term)}
                      title={`${term.text} — ${term.documentCount} documents`}
                      className={cn(
                        "rounded px-1 font-serif leading-tight font-semibold transition-all hover:scale-105",
                        sizeFor(term.weight),
                        toneFor(term.weight),
                        selected?.text === term.text && "bg-clay-100 ring-2 ring-clay-400",
                      )}
                    >
                      {term.text}
                    </button>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>

          <div className="space-y-5 xl:col-span-2">
            <Card>
              <CardHeader title="Term frequency" description="Top 12 terms by weighted occurrence" />
              <CardBody>
                {terms.loading ? (
                  <Skeleton className="h-[320px] w-full" />
                ) : (
                  <CategoryBarChart
                    data={visible.slice(0, 12)}
                    xKey="text"
                    layout="vertical"
                    height={320}
                    series={[{ key: "weight", label: "Weight" }]}
                  />
                )}
              </CardBody>
            </Card>

            {selected ? (
              <Card>
                <CardHeader title="Selected term" action={<Badge tone="accent">{selected.category}</Badge>} />
                <CardBody>
                  <p className="font-serif text-2xl font-semibold text-ink-800">{selected.text}</p>
                  <dl className="mt-4 grid grid-cols-2 gap-3">
                    {[
                      ["Weight", selected.weight],
                      ["Documents", selected.documentCount],
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-lg bg-sand-200 px-3 py-2">
                        <dt className="text-[10px] text-ink-300">{label as string}</dt>
                        <dd className="mt-0.5 text-sm font-semibold text-ink-800">{value as number}</dd>
                      </div>
                    ))}
                  </dl>
                  <button
                    type="button"
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-clay-600 hover:underline"
                  >
                    <FileSearch className="size-3.5" aria-hidden />
                    View source documents
                  </button>
                </CardBody>
              </Card>
            ) : null}
          </div>
        </div>

        <Card>
          <CardHeader
            title="Topic clusters"
            description="Thematic groupings with document frequency and sentiment orientation"
          />
          {clusters.loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <ul className="divide-y divide-sand-200">
              {clusters.data?.map((cluster) => {
                const Icon = cluster.sentiment > 0.2 ? TrendingUp : cluster.sentiment < -0.1 ? TrendingDown : Minus;
                const tone = cluster.sentiment > 0.2 ? "text-emerald-600" : cluster.sentiment < -0.1 ? "text-red-600" : "text-ink-300";
                const max = clusters.data?.[0]?.frequency ?? 1;
                return (
                  <li key={cluster.id} className="px-4 py-3.5 sm:px-5">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <p className="text-sm font-medium text-ink-800">{cluster.label}</p>
                      <span className={cn("inline-flex items-center gap-1 text-xs", tone)}>
                        <Icon className="size-3.5" aria-hidden />
                        {cluster.sentiment > 0 ? "+" : ""}{cluster.sentiment.toFixed(2)}
                      </span>
                      <span className="ml-auto text-xs tabular-nums text-ink-400">
                        {cluster.frequency} mentions
                      </span>
                    </div>

                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-[2px] bg-sand-300">
                      <div
                        className="h-full rounded-[2px] bg-clay-500"
                        style={{ width: `${(cluster.frequency / max) * 100}%` }}
                      />
                    </div>

                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {cluster.terms.map((term) => (
                        <span key={term} className="rounded-[2px] bg-sand-200 px-2 py-0.5 text-[11px] text-ink-500">
                          {term}
                        </span>
                      ))}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
