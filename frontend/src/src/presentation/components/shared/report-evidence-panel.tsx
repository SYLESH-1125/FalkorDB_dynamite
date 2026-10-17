"use client";

import { useState } from "react";
import { ShieldCheck, Lock, Check, AlertTriangle, Calculator, Stamp, Clock } from "lucide-react";
import type { ApprovalState, ReportEvidence } from "@/src/domain/entities/report";
import { formatDate } from "@/src/application/services/formatting";
import { cn } from "../ui/cn";

export function ReportEvidencePanel({ evidence }: { evidence: ReportEvidence }) {
  const [state, setState] = useState<ApprovalState>(evidence.approval.state);
  const gates = state === "draft" ? evidence.assayGatesPassed : evidence.assayGatesTotal;

  const officer = state === evidence.approval.state ? evidence.approval.officer : "You";
  const stampedAt = state === evidence.approval.state ? evidence.approval.at : undefined;

  return (
    <aside className="scrollbar-thin flex h-full w-full flex-col gap-4 overflow-y-auto border-l border-hairline bg-surface-card/60 p-4">
      {/* Assay gates */}
      <section>
        <div className="flex items-center gap-1.5">
          <ShieldCheck className="size-4 text-primary-600" aria-hidden />
          <h3 className="text-[12.5px] font-semibold text-ink-0">The Assay · {gates}/{evidence.assayGatesTotal} gates</h3>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed text-muted-soft">Seven gates before a number becomes a fact — units, net ≤ gross, source authority, conflicts.</p>
        <div className="mt-2 flex gap-1">
          {Array.from({ length: evidence.assayGatesTotal }).map((_, i) => (
            <span key={i} className={cn("h-1.5 flex-1 rounded-full", i < gates ? "bg-success" : "bg-hairline-strong")} aria-hidden />
          ))}
        </div>
      </section>

      {/* Officer approval */}
      <section className="rounded-xl border border-hairline bg-surface-card p-3">
        <div className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-0">
            <Stamp className="size-3.5 text-primary-600" aria-hidden />
            Officer approval
          </span>
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize",
              state === "frozen" ? "bg-primary-100 text-primary-700" : state === "approved" ? "bg-tint-leaf text-success" : "bg-surface-soft text-body",
            )}
          >
            {state}
          </span>
        </div>
        {state === "frozen" ? (
          <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-soft">
            <Lock className="size-3" aria-hidden />
            Locked by {officer ?? "—"}{stampedAt ? ` · ${formatDate(stampedAt)}` : ""}. Hash sealed, write-once.
          </p>
        ) : state === "approved" ? (
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-muted-soft">Approved by {officer ?? "—"}. Freeze to seal the record with a hash.</p>
            <button
              type="button"
              onClick={() => setState("frozen")}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 text-[12px] font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Lock className="size-3.5" aria-hidden />
              Freeze record
            </button>
          </div>
        ) : (
          <div className="mt-2 space-y-2">
            <p className="text-[11px] text-muted-soft">{gates < evidence.assayGatesTotal ? `${evidence.assayGatesTotal - gates} gate(s) pending — approving passes the final check.` : "All gates passed. Ready for officer sign-off."}</p>
            <button
              type="button"
              onClick={() => setState("approved")}
              className="flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 text-[12px] font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Check className="size-3.5" aria-hidden />
              Approve report
            </button>
          </div>
        )}
      </section>

      {/* Computed figures with source trace */}
      <section>
        <div className="flex items-center gap-1.5">
          <Calculator className="size-4 text-primary-600" aria-hidden />
          <h3 className="text-[12.5px] font-semibold text-ink-0">Computed figures</h3>
        </div>
        <p className="mt-1 text-[11px] text-muted-soft">Approved formulas supply the numbers; AI only writes around them.</p>
        <ul className="mt-2 space-y-2">
          {evidence.figures.map((f) => (
            <li key={f.label} className="rounded-xl border border-hairline bg-surface-card p-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11.5px] text-body">{f.label}</span>
                <span className={cn("shrink-0 text-[12px] font-semibold", f.status === "gap" ? "text-secondary-600" : "text-ink-0")}>{f.value}</span>
              </div>
              {f.status === "gap" ? (
                <p className="mt-1 flex items-center gap-1 text-[10.5px] text-secondary-600">
                  <AlertTriangle className="size-3" aria-hidden /> declared gap — {f.source}
                </p>
              ) : (
                <>
                  <p className="mt-1 font-mono text-[10px] text-muted-soft">= {f.formula}</p>
                  <p className="mt-1 flex flex-wrap items-center gap-1 text-[10px] font-medium text-muted-soft">
                    <span className="text-primary-600">Trace</span>
                    <span aria-hidden>›</span> <span className="truncate">{f.source}</span>
                    <span aria-hidden>›</span> p.{f.page} <span aria-hidden>›</span> {f.table} <span aria-hidden>›</span> {f.cell}
                  </p>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      {/* Gap notices */}
      {evidence.gaps.length > 0 ? (
        <section>
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="size-4 text-secondary-600" aria-hidden />
            <h3 className="text-[12.5px] font-semibold text-ink-0">Coverage gaps</h3>
          </div>
          <ul className="mt-2 space-y-2">
            {evidence.gaps.map((g) => (
              <li key={g.fact} className="rounded-xl border border-secondary-300 bg-secondary-50 p-2.5">
                <p className="text-[11.5px] font-medium text-body">{g.fact}</p>
                <p className="mt-1 text-[10.5px] text-muted-soft">Owner: {g.owner} · <span className="capitalize">{g.priority}</span> · due {formatDate(g.dueAt)}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {/* Revision impact */}
      {evidence.revisionImpact && evidence.revisionImpact.length > 0 ? (
        <section className="rounded-xl border border-hairline bg-surface-soft p-3">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold text-ink-0">
            <Clock className="size-3.5 text-primary-600" aria-hidden />
            Revision impact
          </p>
          <p className="mt-1 text-[11px] text-muted-soft">If a figure here is revised, these downstream outputs go stale:</p>
          <ul className="mt-1.5 space-y-0.5">
            {evidence.revisionImpact.map((r) => (
              <li key={r} className="text-[11px] text-body">· {r}</li>
            ))}
          </ul>
        </section>
      ) : null}
    </aside>
  );
}
