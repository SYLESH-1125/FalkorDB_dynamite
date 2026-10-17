"use client";

import Image from "next/image";
import { ShieldCheck, Loader2, AlertTriangle } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatDate } from "@/src/application/services/formatting";
import { ReportEditor } from "../components/shared/report-editor";
import bhumiLogo from "@/app/assets/bhumi-logo.png";

export function SharedReportView({ token }: { token: string }) {
  const { data, loading, error } = useAsync(() => repositories.reports.getSharedReport(token), [token]);

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-canvas">
        <Loader2 className="size-6 animate-spin text-primary-600" aria-hidden />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-canvas px-4 text-center">
        <span className="grid size-14 place-items-center rounded-2xl bg-tint-red text-danger">
          <AlertTriangle className="size-7" aria-hidden />
        </span>
        <h1 className="title-md text-ink-0">This link isn&apos;t available</h1>
        <p className="max-w-sm text-[13px] text-body">
          {error ?? "The report you're looking for may have been unshared or the link has expired."}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-hairline bg-surface-card px-4 sm:px-6">
        <Image src={bhumiLogo} alt="BHUMI" className="h-7 w-auto" priority />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[14px] font-semibold text-ink-0">{data.title}</p>
          <p className="truncate text-[11px] text-muted-soft">
            {data.templateName} · {data.subsidiary} · Updated {formatDate(data.updatedAt)}
          </p>
        </div>
        <span className="hidden items-center gap-1.5 rounded-full bg-tint-leaf px-2.5 py-1 text-[11px] font-semibold text-success sm:inline-flex">
          <ShieldCheck className="size-3.5" aria-hidden />
          View only
        </span>
      </header>

      <div className="min-h-0 flex-1">
        <ReportEditor content={data.content} editable={false} />
      </div>

      <footer className="shrink-0 border-t border-hairline bg-surface-card px-4 py-3 text-center text-[11px] text-muted-soft sm:px-6">
        Shared from BHUMI — Bharat Hub for Unified Mining Intelligence, by {data.createdBy}
      </footer>
    </div>
  );
}
