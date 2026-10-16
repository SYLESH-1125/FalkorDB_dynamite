"use client";

import { useState } from "react";
import { Landmark, Clock, ArrowRight, AlertOctagon, CheckCircle2, FileText } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatDate, daysUntil } from "@/src/application/services/formatting";
import type { ParliamentaryQuery, QueryStage, QueryPriority } from "@/src/domain/entities/parliamentary";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge, type BadgeTone } from "../components/ui/badge";
import { Modal } from "../components/ui/modal";
import { Select } from "../components/ui/field";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../components/ui/toast";
import { cn } from "../components/ui/cn";

const STAGES: QueryStage[] = ["received", "assigned", "drafting", "review", "answered"];

const STAGE_LABELS: Record<QueryStage, string> = {
  received: "Received", assigned: "Assigned", drafting: "Drafting",
  review: "Under review", answered: "Answered",
};

const PRIORITY_TONES: Record<QueryPriority, BadgeTone> = {
  critical: "danger", high: "warning", normal: "neutral",
};

function deadlineTone(query: ParliamentaryQuery): { tone: BadgeTone; label: string } {
  if (query.stage === "answered") return { tone: "success", label: "Answered" };
  const days = daysUntil(query.dueAt);
  if (days < 0) return { tone: "danger", label: `${Math.abs(days)}d overdue` };
  if (days <= 3) return { tone: "danger", label: `Due in ${days}d` };
  if (days <= 7) return { tone: "warning", label: `Due in ${days}d` };
  return { tone: "neutral", label: `Due in ${days}d` };
}

export function ParliamentaryView() {
  const { notify } = useToast();
  const { data, loading, setData } = useAsync(() => repositories.parliamentary.list(), []);
  const [priority, setPriority] = useState("all");
  const [stage, setStage] = useState("all");
  const [selected, setSelected] = useState<ParliamentaryQuery | null>(null);

  const queries = data ?? [];
  const visible = queries.filter(
    (q) => (priority === "all" || q.priority === priority) && (stage === "all" || q.stage === stage),
  );

  async function advance(query: ParliamentaryQuery) {
    const updated = await repositories.parliamentary.advanceStage(query.id);
    setData(queries.map((q) => (q.id === query.id ? updated : q)));
    setSelected(updated);
    notify({
      tone: "success",
      title: `Moved to ${STAGE_LABELS[updated.stage]}`,
      description: updated.referenceNo,
    });
  }

  const overdue = queries.filter((q) => q.stage !== "answered" && daysUntil(q.dueAt) < 0).length;
  const critical = queries.filter((q) => q.priority === "critical" && q.stage !== "answered").length;
  const answered = queries.filter((q) => q.stage === "answered").length;

  return (
    <>
      <PageHeader
        title="Parliamentary & High-Priority Query Tracker"
        description="Track questions tabled in Parliament from intake through to a submitted reply."
        breadcrumbs={[{ label: "Reporting" }, { label: "Parliamentary Tracker" }]}
        action={
          <div className="flex gap-2">
            <Select aria-label="Filter by priority" value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 w-auto">
              <option value="all">All priorities</option>
              {["critical", "high", "normal"].map((p) => (
                <option key={p} value={p}>{p[0].toUpperCase() + p.slice(1)}</option>
              ))}
            </Select>
            <Select aria-label="Filter by stage" value={stage} onChange={(e) => setStage(e.target.value)} className="h-9 w-auto">
              <option value="all">All stages</option>
              {STAGES.map((s) => <option key={s} value={s}>{STAGE_LABELS[s]}</option>)}
            </Select>
          </div>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Open queries", queries.length - answered, AlertOctagon, "text-ink-800"],
            ["Critical", critical, AlertOctagon, "text-red-600"],
            ["Overdue", overdue, Clock, "text-red-600"],
            ["Answered", answered, CheckCircle2, "text-emerald-600"],
          ].map(([label, value, Icon, tone]) => {
            const IconComponent = Icon as typeof Clock;
            return (
              <div key={label as string} className="rounded-xl border border-sand-300 bg-white p-4">
                <div className="flex items-center gap-1.5 text-xs text-ink-400">
                  <IconComponent className="size-3.5" aria-hidden />
                  {label as string}
                </div>
                <p className={cn("mt-1.5 font-serif text-2xl font-semibold", tone as string)}>
                  {value as number}
                </p>
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader title="Workflow pipeline" description="Queries by stage" />
          <div className="scrollbar-thin overflow-x-auto p-4 sm:p-5">
            <div className="flex min-w-max gap-3">
              {STAGES.map((s) => {
                const items = visible.filter((q) => q.stage === s);
                return (
                  <div key={s} className="w-56 shrink-0">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-xs font-semibold text-ink-600">{STAGE_LABELS[s]}</p>
                      <span className="rounded-full bg-sand-300 px-1.5 py-0.5 text-[10px] font-medium text-ink-500">
                        {items.length}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {items.map((query) => {
                        const deadline = deadlineTone(query);
                        return (
                          <li key={query.id}>
                            <button
                              type="button"
                              onClick={() => setSelected(query)}
                              className="w-full rounded-lg border border-sand-300 bg-white p-2.5 text-left transition-colors hover:border-clay-300 hover:bg-clay-50/40"
                            >
                              <div className="flex items-center justify-between gap-1.5">
                                <span className="truncate text-[10px] font-medium text-ink-300">{query.referenceNo}</span>
                                <Badge tone={PRIORITY_TONES[query.priority]}>{query.priority}</Badge>
                              </div>
                              <p className="mt-1.5 line-clamp-3 text-[12px] leading-snug text-ink-700">
                                {query.subject}
                              </p>
                              <div className="mt-2 flex items-center justify-between gap-1.5">
                                <span className="truncate text-[10px] text-ink-300">{query.subsidiary}</span>
                                <Badge tone={deadline.tone}>{deadline.label}</Badge>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                      {items.length === 0 ? (
                        <li className="rounded-lg border border-dashed border-sand-300 px-2.5 py-6 text-center text-[11px] text-sand-500">
                          None
                        </li>
                      ) : null}
                    </ul>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <Card>
          <CardHeader title="All queries" description={`${visible.length} of ${queries.length} queries`} />
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : (
            <ul className="divide-y divide-sand-200">
              {visible.map((query) => {
                const deadline = deadlineTone(query);
                return (
                  <li key={query.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(query)}
                      className="flex w-full flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3.5 text-left transition-colors hover:bg-clay-50/30 sm:px-5"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sand-200 text-ink-400">
                        <Landmark className="size-4" aria-hidden />
                      </span>
                      <span className="min-w-0 flex-1 basis-full sm:basis-auto">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[11px] font-medium text-ink-300">{query.referenceNo}</span>
                          <Badge tone={PRIORITY_TONES[query.priority]}>{query.priority}</Badge>
                          <Badge tone="info">{query.house}</Badge>
                        </span>
                        <span className="mt-1 block text-[13px] font-medium text-ink-800">{query.subject}</span>
                        <span className="mt-0.5 block text-[11px] text-ink-300">
                          {query.memberName} · assigned to {query.assignedTo} · {query.subsidiary}
                        </span>
                      </span>
                      <span className="shrink-0"><Badge tone="neutral">{STAGE_LABELS[query.stage]}</Badge></span>
                      <span className="shrink-0"><Badge tone={deadline.tone}>{deadline.label}</Badge></span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.referenceNo ?? ""}
        description={selected?.house}
        footer={
          selected ? (
            <>
              <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
              {selected.stage !== "answered" ? (
                <Button onClick={() => void advance(selected)}>
                  Advance to {STAGE_LABELS[STAGES[STAGES.indexOf(selected.stage) + 1]]}
                  <ArrowRight className="size-4" aria-hidden />
                </Button>
              ) : null}
            </>
          ) : null
        }
      >
        {selected ? (
          <div className="space-y-5">
            <div>
              <p className="text-[10px] font-semibold tracking-wider text-ink-300 uppercase">Subject</p>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-700">{selected.subject}</p>
            </div>

            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Member", selected.memberName],
                ["Assigned to", selected.assignedTo],
                ["Received", formatDate(selected.receivedAt)],
                ["Due", formatDate(selected.dueAt)],
              ].map(([label, value]) => (
                <div key={label} className="rounded-lg bg-sand-200 px-3 py-2">
                  <dt className="text-[10px] text-ink-300">{label}</dt>
                  <dd className="mt-0.5 text-xs font-medium text-ink-700">{value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="mb-2.5 text-[10px] font-semibold tracking-wider text-ink-300 uppercase">Progress</p>
              <ol className="flex items-center">
                {STAGES.map((s, i) => {
                  const reached = STAGES.indexOf(selected.stage) >= i;
                  return (
                    <li key={s} className="flex flex-1 items-center last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <span
                          className={cn(
                            "grid size-6 place-items-center rounded-full text-[10px] font-semibold",
                            reached ? "bg-clay-500 text-white" : "bg-sand-300 text-ink-300",
                          )}
                        >
                          {reached ? <CheckCircle2 className="size-3.5" aria-hidden /> : i + 1}
                        </span>
                        <span className={cn("text-center text-[9px] whitespace-nowrap", reached ? "text-ink-600" : "text-sand-500")}>
                          {STAGE_LABELS[s]}
                        </span>
                      </div>
                      {i < STAGES.length - 1 ? (
                        <span
                          className={cn("mx-1 h-px flex-1", STAGES.indexOf(selected.stage) > i ? "bg-clay-400" : "bg-sand-300")}
                          aria-hidden
                        />
                      ) : null}
                    </li>
                  );
                })}
              </ol>
            </div>

            <div>
              <p className="mb-2 text-[10px] font-semibold tracking-wider text-ink-300 uppercase">Linked reports</p>
              <ul className="space-y-1.5">
                {selected.linkedReportIds.map((id) => (
                  <li key={id} className="flex items-center gap-2 rounded-lg border border-sand-300 bg-sand-200/60 px-3 py-2">
                    <FileText className="size-3.5 shrink-0 text-ink-300" aria-hidden />
                    <span className="truncate text-xs text-ink-500">Report {id}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
