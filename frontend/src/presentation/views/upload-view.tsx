"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  UploadCloud, FileText, FileSpreadsheet, ImageIcon, ScanLine, File as FileIcon,
  RotateCw, Trash2, X,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatBytes, relativeTime } from "@/src/application/services/formatting";
import type { DocumentKind } from "@/src/domain/entities/document";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Select } from "../components/ui/field";
import { TableSkeleton } from "../components/ui/skeleton";
import { DocumentStatusBadge, ConfidenceBar } from "../components/shared/status-badge";
import { useToast } from "../components/ui/toast";
import { SUBSIDIARIES } from "@/src/domain/entities/common";
import { cn } from "../components/ui/cn";

const KIND_ICONS: Record<DocumentKind, typeof FileText> = {
  pdf: FileText, spreadsheet: FileSpreadsheet, image: ImageIcon,
  scan: ScanLine, docx: FileIcon,
};

const ACCEPTED = ".pdf,.xlsx,.xls,.csv,.docx,.doc,.jpg,.jpeg,.png,.tiff";

export function UploadView() {
  const { notify } = useToast();
  const { data, loading, setData } = useAsync(() => repositories.documents.list(), []);
  const [dragging, setDragging] = useState(false);
  const [filter, setFilter] = useState<string>("all");
  const [subsidiary, setSubsidiary] = useState<string>("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const documents = useMemo(() => data ?? [], [data]);

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const created = await repositories.documents.upload(Array.from(files));
      setData([...created, ...documents]);
      notify({
        tone: "success",
        title: `${created.length} file${created.length > 1 ? "s" : ""} queued`,
        description: "Ingestion has begun. Track progress on the Processing Status page.",
      });
    },
    [documents, notify, setData],
  );

  // poll for real pipeline progress while any document is still in flight
  useEffect(() => {
    const active = documents.some((d) => ["uploading", "processing", "queued"].includes(d.status));
    if (!active) return;
    const timer = setInterval(() => {
      void repositories.documents.list().then(setData);
    }, 2000);
    return () => clearInterval(timer);
  }, [documents, setData]);

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    void handleFiles(event.dataTransfer.files);
  }

  async function onRetry(id: string) {
    const updated = await repositories.documents.retry(id);
    setData(documents.map((d) => (d.id === id ? updated : d)));
    notify({ tone: "info", title: "Retrying ingestion", description: updated.name });
  }

  async function onRemove(id: string) {
    await repositories.documents.remove(id);
    setData(documents.filter((d) => d.id !== id));
    notify({ tone: "success", title: "Document removed" });
  }

  const visible = documents.filter(
    (doc) =>
      (filter === "all" || doc.status === filter) &&
      (subsidiary === "all" || doc.subsidiary === subsidiary),
  );

  const counts = {
    total: documents.length,
    processing: documents.filter((d) => ["uploading", "processing", "queued"].includes(d.status)).length,
    validated: documents.filter((d) => d.status === "validated").length,
    errors: documents.filter((d) => d.status === "error").length,
  };

  return (
    <>
      <PageHeader
        title="Document Upload & Ingestion"
        description="Upload PDFs, scanned records, spreadsheets and images for digitisation and indexing."
        breadcrumbs={[{ label: "Data Pipeline" }, { label: "Document Upload" }]}
        action={
          <Button onClick={() => inputRef.current?.click()}>
            <UploadCloud className="size-4" aria-hidden />
            Upload document
          </Button>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED}
          className="sr-only"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          className={cn(
            " border-2 border-dashed p-8 text-center transition-colors sm:p-12",
            dragging
              ? "border-primary-400 bg-primary-50/60"
              : "border-hairline-strong bg-surface-card hover:border-hairline-strong",
          )}
        >
          <span className="mx-auto grid size-12 place-items-center bg-surface-elevated text-link">
            <UploadCloud className="size-6" aria-hidden />
          </span>
          <p className="mt-4 text-base font-normal text-ink-0">
            Drag files here, or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-link underline underline-offset-2 hover:text-ink-0"
            >
              browse your computer
            </button>
          </p>
          <p className="mt-1.5 text-sm text-muted">
            PDF, XLSX, DOCX, JPG, PNG and TIFF supported · up to 200 MB per file
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["Native PDF", "Scanned records", "Spreadsheets", "Photographs", "Hindi + English OCR"].map((tag) => (
              <span key={tag} className=" bg-surface-soft px-2.5 py-1 text-[11px] text-body">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Total documents", counts.total, "text-ink-0"],
            ["In pipeline", counts.processing, "text-link"],
            ["Validated", counts.validated, "text-success"],
            ["Failed", counts.errors, "text-danger"],
          ].map(([label, value, tone]) => (
            <div key={label as string} className=" card-raise rounded-xl border border-hairline bg-surface-card p-4">
              <p className="type-caption text-muted">{label}</p>
              <p className={cn("mt-1 numeral text-2xl", tone as string)}>{value}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader
            title="Upload queue"
            description={`${visible.length} of ${documents.length} documents`}
            action={
              <div className="flex flex-wrap gap-2">
                <Select
                  aria-label="Filter by subsidiary"
                  value={subsidiary}
                  onChange={(e) => setSubsidiary(e.target.value)}
                  className="h-8 w-auto py-0 text-xs"
                >
                  <option value="all">All subsidiaries</option>
                  {SUBSIDIARIES.map((s) => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Select
                  aria-label="Filter by status"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="h-8 w-auto py-0 text-xs"
                >
                  <option value="all">All statuses</option>
                  {["queued", "uploading", "processing", "extracted", "validated", "error"].map((s) => (
                    <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                  ))}
                </Select>
              </div>
            }
          />

          {loading ? (
            <TableSkeleton rows={8} cols={5} />
          ) : visible.length === 0 ? (
            <p className="px-5 py-12 text-center text-sm text-muted-soft">
              No documents match the current filters.
            </p>
          ) : (
            <ul className="divide-y divide-hairline">
              {visible.map((doc) => {
                const Icon = KIND_ICONS[doc.kind] ?? FileIcon;
                const active = doc.status === "uploading" || doc.status === "processing";
                return (
                  <li key={doc.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5">
                    <span className="grid size-9 shrink-0 place-items-center bg-surface-soft text-muted">
                      <Icon className="size-4" aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <p className="truncate text-sm font-normal text-ink-0" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-muted-soft">
                        <span>{formatBytes(doc.sizeBytes)}</span>
                        <span aria-hidden>·</span>
                        <span>{doc.subsidiary}</span>
                        <span aria-hidden>·</span>
                        <span>{relativeTime(doc.uploadedAt)}</span>
                        {doc.pageCount > 0 ? (
                          <>
                            <span aria-hidden>·</span>
                            <span>{doc.pageCount} pages</span>
                          </>
                        ) : null}
                      </p>
                      {active ? (
                        <div className="mt-2 h-1 w-full max-w-xs overflow-hidden bg-hairline">
                          <div
                            className="h-full rounded-full bg-primary-500 transition-[width] duration-500"
                            style={{ width: `${doc.progress}%` }}
                          />
                        </div>
                      ) : null}
                      {doc.errorMessage ? (
                        <p className="mt-1.5 flex items-start gap-1 text-[11px] text-danger">
                          <X className="mt-px size-3 shrink-0" aria-hidden />
                          {doc.errorMessage}
                        </p>
                      ) : null}
                    </div>

                    <div className="hidden w-32 shrink-0 lg:block">
                      {doc.confidence > 0 ? <ConfidenceBar value={doc.confidence} /> : null}
                    </div>

                    <div className="shrink-0">
                      <DocumentStatusBadge status={doc.status} />
                    </div>

                    <div className="flex shrink-0 gap-1">
                      {doc.status === "error" ? (
                        <Button variant="ghost" size="sm" onClick={() => void onRetry(doc.id)}>
                          <RotateCw className="size-3.5" aria-hidden />
                          Retry
                        </Button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => void onRemove(doc.id)}
                        aria-label={`Remove ${doc.name}`}
                        className=" p-1.5 text-muted-soft hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="size-3.5" aria-hidden />
                      </button>
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
