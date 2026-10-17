"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Share2, Loader2, FileText, FileType } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import type { TiptapContent } from "@/src/domain/entities/report";
import { ReportEditor, useAutosave, AutosaveIndicator } from "../components/shared/report-editor";
import { ShareReportModal } from "../components/shared/share-report-modal";
import { Button } from "../components/ui/button";
import { useToast } from "../components/ui/toast";

function useReportDocument(reportId: string) {
  return useAsync(() => repositories.reports.getDocument(reportId), [reportId]);
}

export function ReportEditorView({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { notify } = useToast();
  const reports = useAsync(() => repositories.reports.list(), []);
  const document = useReportDocument(reportId);
  const report = reports.data?.find((r) => r.id === reportId);

  const [shareOpen, setShareOpen] = useState(false);
  const [exporting, setExporting] = useState<"pdf" | "docx" | null>(null);
  const [downloadMenuOpen, setDownloadMenuOpen] = useState(false);

  const save = useCallback(
    async (content: TiptapContent) => {
      await repositories.reports.saveDocument(reportId, content);
    },
    [reportId],
  );
  const { status, schedule } = useAutosave(reportId, save);

  useEffect(() => {
    function onClick() { setDownloadMenuOpen(false); }
    if (downloadMenuOpen) window.document.addEventListener("click", onClick);
    return () => window.document.removeEventListener("click", onClick);
  }, [downloadMenuOpen]);

  async function download(format: "pdf" | "docx") {
    setExporting(format);
    setDownloadMenuOpen(false);
    try {
      const blob = await repositories.reports.exportBlob(reportId, format);
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = `${report?.title ?? "report"}.${format}`;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      notify({ tone: "error", title: "Export failed", description: err instanceof Error ? err.message : undefined });
    } finally {
      setExporting(null);
    }
  }

  if (document.loading || reports.loading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-primary-600" aria-hidden />
      </div>
    );
  }

  if (document.error || !document.data) {
    return (
      <div className="flex h-full min-h-[60vh] flex-col items-center justify-center gap-3 px-4 text-center">
        <p className="text-[13.5px] text-danger">{document.error ?? "This report has no editable document."}</p>
        <Button variant="secondary" onClick={() => router.push("/reports")}>
          <ArrowLeft className="size-4" aria-hidden />
          Back to Reports
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-surface-card px-3 sm:px-5">
        <button
          type="button"
          onClick={() => router.push("/reports")}
          aria-label="Back to reports"
          className="grid size-9 shrink-0 place-items-center rounded-full text-body transition-colors hover:bg-surface-soft"
        >
          <ArrowLeft className="size-4.5" aria-hidden />
        </button>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-ink-0">{report?.title ?? "Report"}</p>
          <p className="truncate text-[11px] text-muted-soft">{report?.templateName} · {report?.subsidiary}</p>
        </div>

        <AutosaveIndicator status={status} />

        <div className="relative">
          <Button
            variant="secondary" size="sm"
            onClick={(e) => { e.stopPropagation(); setDownloadMenuOpen((v) => !v); }}
            disabled={exporting !== null}
          >
            {exporting ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : <Download className="size-3.5" aria-hidden />}
            Download
          </Button>
          {downloadMenuOpen ? (
            <div
              onClick={(e) => e.stopPropagation()}
              className="card-raise absolute right-0 top-full z-20 mt-2 w-44 overflow-hidden rounded-xl border border-hairline bg-surface-card p-1"
            >
              <button
                type="button"
                onClick={() => void download("pdf")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-body transition-colors hover:bg-surface-soft"
              >
                <FileText className="size-3.5 text-muted-soft" aria-hidden />
                PDF
              </button>
              <button
                type="button"
                onClick={() => void download("docx")}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] text-body transition-colors hover:bg-surface-soft"
              >
                <FileType className="size-3.5 text-muted-soft" aria-hidden />
                Word (.docx)
              </button>
            </div>
          ) : null}
        </div>

        <Button size="sm" onClick={() => setShareOpen(true)}>
          <Share2 className="size-3.5" aria-hidden />
          Share
        </Button>
      </header>

      <div className="min-h-0 flex-1">
        <ReportEditor content={document.data.content} onChange={schedule} />
      </div>

      <ShareReportModal
        open={shareOpen}
        reportId={reportId}
        existingShareUrl={report?.shareUrl ?? null}
        onClose={() => setShareOpen(false)}
        onRevoked={() => reports.reload()}
      />
    </div>
  );
}
