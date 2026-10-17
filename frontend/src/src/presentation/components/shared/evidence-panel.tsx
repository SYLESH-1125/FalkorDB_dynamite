import { ShieldCheck, AlertTriangle, Scale, Clock, CheckCircle2, XCircle } from "lucide-react";
import type { EvidenceSummary } from "@/src/domain/entities/query";
import { formatDate } from "@/src/application/services/formatting";

function Chip({ tone, children }: { tone: "leaf" | "danger" | "muted"; children: React.ReactNode }) {
  const cls =
    tone === "leaf"
      ? "bg-tint-leaf text-success"
      : tone === "danger"
        ? "bg-danger/10 text-danger"
        : "bg-surface-soft text-body";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls}`}>
      {children}
    </span>
  );
}

export function EvidencePanel({ evidence }: { evidence: EvidenceSummary }) {
  const complete = evidence.facts >= evidence.factsExpected;
  return (
    <div className="mt-3 space-y-2.5">
      <div className="flex flex-wrap items-center gap-1.5">
        <Chip tone={complete ? "leaf" : "muted"}>
          <CheckCircle2 className="size-3" aria-hidden />
          Facts {evidence.facts}/{evidence.factsExpected}
        </Chip>
        <Chip tone="muted">Sources {evidence.sources}</Chip>
        <Chip tone={evidence.conflicts > 0 ? "danger" : "muted"}>
          {evidence.conflicts > 0 ? <XCircle className="size-3" aria-hidden /> : null}
          Conflicts {evidence.conflicts}
        </Chip>
        {evidence.validated ? (
          <Chip tone="leaf"><ShieldCheck className="size-3" aria-hidden /> Validated</Chip>
        ) : (
          <Chip tone="danger"><AlertTriangle className="size-3" aria-hidden /> Unverified</Chip>
        )}
        {evidence.asOf ? (
          <span className="text-[10.5px] text-muted-soft">true as of {formatDate(evidence.asOf)}</span>
        ) : null}
      </div>

      {evidence.gap ? (
        <div className="flex items-start gap-2 rounded-xl border border-secondary-300 bg-secondary-50 px-3 py-2.5">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-secondary-600" aria-hidden />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-secondary-600">Gap notice — honest &ldquo;not available&rdquo;</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-body">{evidence.gap}</p>
            {evidence.gapOwner ? (
              <p className="mt-1 text-[11px] text-muted-soft">Owner: <span className="font-medium text-body">{evidence.gapOwner}</span></p>
            ) : null}
          </div>
        </div>
      ) : null}

      {evidence.contradiction ? (
        <div className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-3 py-2.5">
          <Scale className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-danger">Contradiction Radar</p>
            <p className="mt-0.5 text-[12px] leading-relaxed text-body">{evidence.contradiction}</p>
          </div>
        </div>
      ) : null}

      {evidence.revisionImpact && evidence.revisionImpact.length > 0 ? (
        <div className="flex items-start gap-2 rounded-xl border border-hairline bg-surface-soft px-3 py-2.5">
          <Clock className="mt-0.5 size-4 shrink-0 text-primary-600" aria-hidden />
          <div className="min-w-0">
            <p className="text-[12px] font-semibold text-ink-0">Revision impact — {evidence.revisionImpact.length} outputs would go stale</p>
            <ul className="mt-1 space-y-0.5">
              {evidence.revisionImpact.map((item) => (
                <li key={item} className="text-[11.5px] text-body">· {item}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
}
