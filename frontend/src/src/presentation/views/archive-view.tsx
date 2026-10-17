"use client";

import { useState } from "react";
import { Download, History, Search, FileText } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatDate, formatDateTime } from "@/src/application/services/formatting";
import { SUBSIDIARIES } from "@/src/domain/entities/common";
import type { Report, ReportVersion } from "@/src/domain/entities/report";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Modal } from "../components/ui/modal";
import { Select, TextInput } from "../components/ui/field";
import { TableSkeleton } from "../components/ui/skeleton";
import { DataTable, type Column } from "../components/ui/data-table";
import { ReportStatusBadge } from "../components/shared/status-badge";
import { useToast } from "../components/ui/toast";

export function ArchiveView() {
  const { notify } = useToast();
  const { data, loading } = useAsync(() => repositories.reports.list(), []);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [subsidiary, setSubsidiary] = useState("all");
  const [selected, setSelected] = useState<Report | null>(null);
  const [versions, setVersions] = useState<ReportVersion[]>([]);

  const reports = data ?? [];
  const visible = reports.filter(
    (r) =>
      (status === "all" || r.status === status) &&
      (subsidiary === "all" || r.subsidiary === subsidiary) &&
      (search === "" || r.title.toLowerCase().includes(search.toLowerCase())),
  );

  async function openHistory(report: Report) {
    setSelected(report);
    setVersions(await repositories.reports.versions(report.id));
  }

  const columns: Column<Report>[] = [
    {
      key: "title",
      header: "Report",
      sortValue: (r) => r.title,
      render: (r) => (
        <div className="min-w-0">
          <p className="truncate font-normal text-ink-0" title={r.title}>{r.title}</p>
          <p className="mt-0.5 text-[11px] text-muted-soft">{r.templateName}</p>
        </div>
      ),
    },
    { key: "subsidiary", header: "Subsidiary", sortValue: (r) => r.subsidiary, render: (r) => r.subsidiary },
    {
      key: "version", header: "Version", align: "right", sortValue: (r) => r.version,
      render: (r) => <span className="tabular-nums">v{r.version}</span>,
    },
    { key: "pages", header: "Pages", align: "right", sortValue: (r) => r.pageCount, render: (r) => r.pageCount },
    {
      key: "formats", header: "Formats",
      render: (r) => (
        <div className="flex gap-1">
          {r.formats.map((f) => <Badge key={f} tone="neutral">{f}</Badge>)}
        </div>
      ),
    },
    { key: "status", header: "Status", sortValue: (r) => r.status, render: (r) => <ReportStatusBadge status={r.status} /> },
    { key: "createdBy", header: "Created by", sortValue: (r) => r.createdBy, render: (r) => <span className="text-body">{r.createdBy}</span> },
    {
      key: "updatedAt", header: "Updated", sortValue: (r) => r.updatedAt,
      render: (r) => <span className="whitespace-nowrap text-muted">{formatDate(r.updatedAt)}</span>,
    },
    {
      key: "actions", header: "", align: "right",
      render: (r) => (
        <div className="flex justify-end gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); void openHistory(r); }}
            aria-label={`Version history for ${r.title}`}
            className=" p-1.5 text-muted-soft hover:bg-surface-soft hover:text-body"
          >
            <History className="size-3.5" aria-hidden />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              notify({ tone: "success", title: "Download started", description: `${r.title}.pdf` });
            }}
            aria-label={`Download ${r.title}`}
            className=" p-1.5 text-muted-soft hover:bg-surface-soft hover:text-body"
          >
            <Download className="size-3.5" aria-hidden />
          </button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Report History & Version Archive"
        description="Every published report is retained immutably, so any figure can be traced to the version that produced it."
        breadcrumbs={[{ label: "Reporting" }, { label: "Report Archive" }]}
        action={
          <Button
            variant="secondary"
            onClick={() => notify({ tone: "success", title: "Bulk export queued", description: `${visible.length} reports` })}
          >
            <Download className="size-4" aria-hidden />
            Export selection
          </Button>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Total reports", reports.length],
            ["Published", reports.filter((r) => r.status === "published").length],
            ["Archived", reports.filter((r) => r.status === "archived").length],
            ["Retention", "7 years"],
          ].map(([label, value]) => (
            <div key={label as string} className=" card-raise rounded-xl border border-hairline bg-surface-card p-4">
              <p className="type-caption text-muted">{label as string}</p>
              <p className="mt-1 numeral text-2xl text-ink-0">{value as string | number}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader
            title="Archive"
            description={`${visible.length} of ${reports.length} reports`}
            action={
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-soft" aria-hidden />
                  <TextInput
                    aria-label="Search reports"
                    placeholder="Search reports…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-44 py-0 pl-8 text-xs"
                  />
                </div>
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
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="h-8 w-auto py-0 text-xs"
                >
                  <option value="all">All statuses</option>
                  {["published", "draft", "generating", "archived"].map((s) => (
                    <option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
                  ))}
                </Select>
              </div>
            }
          />
          {loading ? (
            <TableSkeleton rows={8} cols={6} />
          ) : (
            <DataTable
              columns={columns}
              rows={visible}
              onRowClick={(r) => void openHistory(r)}
              caption="Archived reports with version history"
              emptyMessage="No reports match the current filters."
            />
          )}
        </Card>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title ?? ""}
        description="Immutable version history — each entry can be retrieved exactly as published."
        footer={
          <>
            <Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>
            <Button onClick={() => {
              notify({ tone: "success", title: "Download started", description: `${selected?.title}.pdf` });
              setSelected(null);
            }}>
              <Download className="size-4" aria-hidden />
              Download latest
            </Button>
          </>
        }
      >
        {selected ? (
          <div className="space-y-5">
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ["Template", selected.templateName],
                ["Subsidiary", selected.subsidiary],
                ["Pages", String(selected.pageCount)],
                ["Created", formatDate(selected.createdAt)],
              ].map(([label, value]) => (
                <div key={label} className=" bg-surface-soft px-3 py-2">
                  <dt className="type-caption text-muted-soft">{label}</dt>
                  <dd className="mt-0.5 truncate text-xs font-normal text-body-strong" title={value}>{value}</dd>
                </div>
              ))}
            </dl>

            <div>
              <p className="mb-2.5 text-xs font-normal text-body">
                Version history · {versions.length} version{versions.length === 1 ? "" : "s"}
              </p>
              <ol className="space-y-0">
                {versions.map((version, i) => (
                  <li key={version.version} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <span className="grid size-6 shrink-0 place-items-center bg-surface-card text-[10px] font-normal text-ink-0">
                        {version.version}
                      </span>
                      {i < versions.length - 1 ? (
                        <span className="my-1 w-px flex-1 bg-hairline" aria-hidden />
                      ) : null}
                    </div>
                    <div className={i < versions.length - 1 ? "pb-4" : ""}>
                      <p className="text-[13px] font-normal text-ink-0">{version.summary}</p>
                      <p className="mt-0.5 text-[11px] text-muted-soft">
                        {version.changedBy} · {formatDateTime(version.changedAt)}
                      </p>
                      <button
                        type="button"
                        className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-normal text-link hover:underline"
                      >
                        <FileText className="size-3" aria-hidden />
                        View this version
                      </button>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
