"use client";

import { Loader2, TrendingUp, MessageSquareText, Hash } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import type { TopicCluster } from "@/src/domain/entities/topic";
import { Card, CardHeader, CardBody } from "../ui/card";

const CAT_COLOR: Record<string, string> = {
  Operations: "text-primary-700",
  Compliance: "text-secondary-600",
  Social: "text-success",
  Safety: "text-danger",
  Logistics: "text-primary-600",
  Processing: "text-secondary-600",
  Quality: "text-ink-0",
};

function sentiment(value: number): { label: string; cls: string } {
  if (value > 0.15) return { label: "Positive", cls: "bg-tint-leaf text-success" };
  if (value < -0.05) return { label: "Needs watch", cls: "bg-danger/10 text-danger" };
  return { label: "Neutral", cls: "bg-surface-soft text-body" };
}

function ClusterCard({ cluster }: { cluster: TopicCluster }) {
  const s = sentiment(cluster.sentiment);
  return (
    <div className="rounded-2xl border border-hairline bg-surface-card p-4 shadow-sm transition-colors hover:border-hairline-strong">
      <div className="flex items-start justify-between gap-2">
        <h4 className="title-sm text-ink-0">{cluster.label}</h4>
        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${s.cls}`}>{s.label}</span>
      </div>
      <p className="mt-1 flex items-center gap-1 text-[11.5px] text-muted-soft">
        <Hash className="size-3" aria-hidden />
        {cluster.frequency.toLocaleString("en-IN")} documents
      </p>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {cluster.terms.map((term) => (
          <span key={term} className="rounded-full bg-surface-soft px-2 py-0.5 text-[11px] text-body">{term}</span>
        ))}
      </div>
    </div>
  );
}

export function WordCloudPanel({ onAsk }: { onAsk?: () => void }) {
  const terms = useAsync(() => repositories.topics.terms(), []);
  const clusters = useAsync(() => repositories.topics.clusters(), []);

  if (terms.loading || clusters.loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="size-6 animate-spin text-primary-600" aria-hidden />
      </div>
    );
  }

  const maxWeight = Math.max(...(terms.data ?? []).map((t) => t.weight), 1);
  const topClusters = [...(clusters.data ?? [])].sort((a, b) => b.frequency - a.frequency);

  return (
    <div className="scrollbar-thin h-full overflow-y-auto">
      <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
        <Card>
          <CardHeader
            title="Word Cloud — distinctive terms"
            description="Sized by corpus weight, coloured by domain. Grounded in extracted, validated fields."
            action={
              onAsk ? (
                <button
                  type="button"
                  onClick={onAsk}
                  className="flex h-8 items-center gap-1.5 rounded-full bg-primary-600 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-primary-700"
                >
                  <MessageSquareText className="size-3.5" aria-hidden />
                  Ask about these topics
                </button>
              ) : undefined
            }
          />
          <CardBody>
            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 px-2 py-4">
              {(terms.data ?? []).map((term) => {
                const size = 13 + Math.round((term.weight / maxWeight) * 26);
                return (
                  <span
                    key={term.text}
                    title={`${term.documentCount} documents · ${term.category}`}
                    className={`cursor-default font-semibold leading-none transition-opacity hover:opacity-70 ${CAT_COLOR[term.category] ?? "text-body"}`}
                    style={{ fontSize: `${size}px` }}
                  >
                    {term.text}
                  </span>
                );
              })}
            </div>
          </CardBody>
        </Card>

        <div>
          <div className="mb-2 flex items-center gap-1.5">
            <TrendingUp className="size-4 text-primary-600" aria-hidden />
            <h3 className="title-sm text-ink-0">Topic clusters &amp; emerging themes</h3>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {topClusters.map((cluster) => (
              <ClusterCard key={cluster.id} cluster={cluster} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
