"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import {
  UploadCloud, FileText, FileSpreadsheet, ImageIcon, ScanLine, File as FileIcon,
  RotateCw, Trash2, X,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatBytes, relativeTime } from "@/src/application/services/formatting";
import type { IngestedDocument, DocumentKind } from "@/src/domain/entities/document";
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
      const payload = Array.from(files).map((file) => ({ name: file.name, sizeBytes: file.size }));
      const created = await repositories.documents.upload(payload);
      setData([...created, ...documents]);
      notify({
        tone: "success",
        title: `${created.length} file${created.length > 1 ? "s" : ""} queued`,
        description: "Ingestion has begun. Track progress on the Processing Status page.",
      });
    },
    [documents, notify, setData],
  );

  // simulate pipeline advancement for freshly uploaded files
  useEffect(() => {
    const active = documents.some((d) => d.status === "uploading" || d.status === "processing");
    if (!active) return;
    const timer = setInterval(() => {
      setData(
        documents.map((doc): IngestedDocument => {
          if (doc.status === "uploading") {
            const progress = Math.min(doc.progress + 18, 100);
            return progress >= 100
              ? { ...doc, status: "processing", progress: 8 }
              : { ...doc, progress };
          }
          if (doc.status === "processing") {
            const progress = Math.min(doc.progress + 12, 100);
            return progress >= 100
              ? { ...doc, status: "extracted", progress: 100, confidence: 91.4, pageCount: 24 }
              : { ...doc, progress };
          }
          return doc;
        }),
      );
    }, 900);
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
            "rounded-2xl border-2 border-dashed p-8 text-center transition-colors sm:p-12",
            dragging
              ? "border-clay-400 bg-clay-50/60"
              : "border-sand-400 bg-white hover:border-clay-300",
          )}
        >
          <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-clay-50 text-clay-600">
            <UploadCloud className="size-6" aria-hidden />
          </span>
          <p className="mt-4 text-base font-medium text-ink-800">
            Drag files here, or{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="text-clay-600 underline underline-offset-2 hover:text-clay-700"
            >
              browse your computer
            </button>
          </p>
          <p className="mt-1.5 text-sm text-ink-400">
            PDF, XLSX, DOCX, JPG, PNG and TIFF supported · up to 200 MB per file
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {["Native PDF", "Scanned records", "Spreadsheets", "Photographs", "Hindi + English OCR"].map((tag) => (
              <span key={tag} className="rounded-[2px] bg-sand-200 px-2.5 py-1 text-[11px] text-ink-500">
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Total documents", counts.total, "text-ink-800"],
            ["In pipeline", counts.processing, "text-clay-600"],
            ["Validated", counts.validated, "text-emerald-600"],
            ["Failed", counts.errors, "text-red-600"],
          ].map(([label, value, tone]) => (
            <div key={label as string} className="rounded-xl border border-sand-300 bg-white p-4">
              <p className="text-xs text-ink-400">{label}</p>
              <p className={cn("mt-1 font-serif text-2xl font-semibold", tone as string)}>{value}</p>
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
            <p className="px-5 py-12 text-center text-sm text-ink-300">
              No documents match the current filters.
            </p>
          ) : (
            <ul className="divide-y divide-sand-200">
              {visible.map((doc) => {
                const Icon = KIND_ICONS[doc.kind];
                const active = doc.status === "uploading" || doc.status === "processing";
                return (
                  <li key={doc.id} className="flex flex-wrap items-center gap-3 px-4 py-3 sm:flex-nowrap sm:px-5">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sand-200 text-ink-400">
                      <Icon className="size-4" aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1 basis-full sm:basis-auto">
                      <p className="truncate text-sm font-medium text-ink-800" title={doc.name}>
                        {doc.name}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-ink-300">
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
                        <div className="mt-2 h-1 w-full max-w-xs overflow-hidden rounded-[2px] bg-sand-300">
                          <div
                            className="h-full rounded-[2px] bg-clay-500 transition-[width] duration-500"
                            style={{ width: `${doc.progress}%` }}
                          />
                        </div>
                      ) : null}
                      {doc.errorMessage ? (
                        <p className="mt-1.5 flex items-start gap-1 text-[11px] text-red-600">
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
                        className="rounded-md p-1.5 text-sand-500 hover:bg-red-50 hover:text-red-600"
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
