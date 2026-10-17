"use client";

import { useEffect } from "react";
import { CheckCircle2, Loader2, Circle, XCircle, Cpu, Languages, ScanText } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime } from "@/src/application/services/formatting";
import type { PipelineStageStatus } from "@/src/domain/entities/document";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader, CardBody } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { cn } from "../components/ui/cn";

const STAGE_ICONS: Record<PipelineStageStatus, typeof Circle> = {
  complete: CheckCircle2, running: Loader2, failed: XCircle, pending: Circle,
};

const STAGE_COLORS: Record<PipelineStageStatus, string> = {
  complete: "text-success", running: "text-ink-0 animate-spin",
  failed: "text-danger", pending: "text-muted",
};

function formatDuration(ms: number): string {
  if (ms === 0) return "—";
  if (ms < 1000) return `${ms} ms`;
  const seconds = ms / 1000;
  return seconds < 60 ? `${seconds.toFixed(1)}s` : `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}

export function ProcessingView() {
  const { data, loading, setData } = useAsync(() => repositories.documents.jobs(), []);
  const jobs = data ?? [];

  const running = jobs.filter((j) => j.stages.some((s) => s.status === "running")).length;
  const failed = jobs.filter((j) => j.stages.some((s) => s.status === "failed")).length;

  // poll while any job still has an in-flight stage
  useEffect(() => {
    const active = jobs.some((j) => j.stages.some((s) => s.status === "running" || s.status === "pending"));
    if (!active) return;
    const timer = setInterval(() => {
      void repositories.documents.jobs().then(setData);
    }, 2000);
    return () => clearInterval(timer);
  }, [jobs, setData]);

  return (
    <>
      <PageHeader
        title="Data Pre-processing & Digitization"
        description="Stage-by-stage progress of the OCR, extraction and indexing pipeline."
        breadcrumbs={[{ label: "Data Pipeline" }, { label: "Processing Status" }]}
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Active jobs", running, Cpu, "text-link"],
            ["Failed stages", failed, XCircle, "text-danger"],
            ["OCR engine", "Tesseract 5.3", ScanText, "text-ink-0"],
            ["Languages", "Hindi + English", Languages, "text-ink-0"],
          ].map(([label, value, Icon, tone]) => {
            const IconComponent = Icon as typeof Cpu;
            return (
              <div key={label as string} className=" card-raise rounded-xl border border-hairline bg-surface-card p-4">
                <div className="flex items-center gap-1.5 text-xs text-muted">
                  <IconComponent className="size-3.5" aria-hidden />
                  {label as string}
                </div>
                <p className={cn("mt-1.5 truncate numeral text-xl", tone as string)}>
                  {value as string | number}
                </p>
              </div>
            );
          })}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-64 w-full " />)}
          </div>
        ) : jobs.length === 0 ? (
          <Card>
            <EmptyState
              title="No documents in the pipeline"
              description="Upload documents to see their digitisation progress here."
            />
          </Card>
        ) : (
          <div className="space-y-4">
            {jobs.map((job) => {
              const failedStage = job.stages.find((s) => s.status === "failed");
              const completed = job.stages.filter((s) => s.status === "complete").length;
              return (
                <Card key={job.id}>
                  <CardHeader
                    title={<span className="truncate" title={job.documentName}>{job.documentName}</span>}
                    description={`Started ${relativeTime(job.startedAt)} · ${job.ocrEngine} · ${job.language}`}
                    action={
                      failedStage
                        ? <Badge tone="danger">Failed</Badge>
                        : completed === job.stages.length
                          ? <Badge tone="success">Complete</Badge>
                          : <Badge tone="warning">{completed}/{job.stages.length} stages</Badge>
                    }
                  />
                  <CardBody>
                    <ol className="space-y-0">
                      {job.stages.map((stage, index) => {
                        const Icon = STAGE_ICONS[stage.status] ?? Circle;
                        const last = index === job.stages.length - 1;
                        return (
                          <li key={stage.name} className="flex gap-3">
                            <div className="flex flex-col items-center">
                              <Icon className={cn("size-4 shrink-0", STAGE_COLORS[stage.status])} aria-hidden />
                              {!last ? (
                                <span
                                  className={cn(
                                    "my-1 w-px flex-1",
                                    stage.status === "complete" ? "bg-success" : "bg-hairline",
                                  )}
                                  aria-hidden
                                />
                              ) : null}
                            </div>

                            <div className={cn("min-w-0 flex-1", !last && "pb-4")}>
                              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                                <p
                                  className={cn(
                                    "text-sm font-normal",
                                    stage.status === "pending" ? "text-muted-soft" : "text-ink-0",
                                  )}
                                >
                                  {stage.name}
                                </p>
                                <span className="numeral text-[11px] text-muted-soft">
                                  {formatDuration(stage.durationMs)}
                                </span>
                              </div>
                              <p
                                className={cn(
                                  "mt-0.5 text-xs",
                                  stage.status === "failed" ? "text-danger" : "text-muted",
                                )}
                              >
                                {stage.message}
                              </p>
                              {stage.status === "running" ? (
                                <div className="mt-2 h-1 w-full max-w-sm overflow-hidden bg-hairline">
                                  <div
                                    className="h-full rounded-full bg-primary-500"
                                    style={{ width: `${stage.progress}%` }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </li>
                        );
                      })}
                    </ol>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
