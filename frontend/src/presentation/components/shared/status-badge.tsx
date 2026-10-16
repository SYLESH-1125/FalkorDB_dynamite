import { Badge, type BadgeTone } from "../ui/badge";
import type { DocumentStatus } from "@/src/domain/entities/document";
import type { ReportStatus } from "@/src/domain/entities/report";
import type { FieldStatus } from "@/src/domain/entities/validation";

const DOCUMENT_TONES: Record<DocumentStatus, BadgeTone> = {
  validated: "success", extracted: "info", processing: "warning",
  uploading: "warning", queued: "neutral", error: "danger",
};

const DOCUMENT_LABELS: Record<DocumentStatus, string> = {
  validated: "Validated", extracted: "Extracted", processing: "Processing",
  uploading: "Uploading", queued: "Queued", error: "Error",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  return <Badge tone={DOCUMENT_TONES[status]}>{DOCUMENT_LABELS[status]}</Badge>;
}

const REPORT_TONES: Record<ReportStatus, BadgeTone> = {
  published: "success", draft: "neutral", generating: "warning", archived: "info",
};

export function ReportStatusBadge({ status }: { status: ReportStatus }) {
  return <Badge tone={REPORT_TONES[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

const FIELD_TONES: Record<FieldStatus, BadgeTone> = {
  validated: "success", pending: "warning", error: "danger",
};

export function FieldStatusBadge({ status }: { status: FieldStatus }) {
  return <Badge tone={FIELD_TONES[status]}>{status[0].toUpperCase() + status.slice(1)}</Badge>;
}

export function ConfidenceBar({ value }: { value: number }) {
  const tone = value >= 88 ? "bg-success" : value >= 75 ? "bg-primary-500" : "bg-danger";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-soft" role="img" aria-label={`Confidence ${value}%`}>
        <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.min(value, 100)}%` }} />
      </div>
      <span className="numeral text-[11.5px] text-body">{value.toFixed(1)}%</span>
    </div>
  );
}
