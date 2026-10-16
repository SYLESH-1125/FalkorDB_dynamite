"use client";

import { useState } from "react";
import {
  Check, ChevronRight, ChevronLeft, FileDown, Loader2, FileText, FileSpreadsheet,
  Sparkles, LayoutTemplate, SlidersHorizontal, Eye,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatDate } from "@/src/application/services/formatting";
import { SUBSIDIARIES } from "@/src/domain/entities/common";
import type { ExportFormat, ReportWizardConfig } from "@/src/domain/entities/report";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader, CardBody } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Label, TextInput, Select, Toggle } from "../components/ui/field";
import { Skeleton } from "../components/ui/skeleton";
import { ReportStatusBadge } from "../components/shared/status-badge";
import { useToast } from "../components/ui/toast";
import { cn } from "../components/ui/cn";

const STEPS = [
  { id: 0, label: "Data sources", icon: FileText },
  { id: 1, label: "Template", icon: LayoutTemplate },
  { id: 2, label: "Parameters", icon: SlidersHorizontal },
  { id: 3, label: "Preview", icon: Eye },
  { id: 4, label: "Export", icon: FileDown },
];

export function ReportsView() {
  const { notify } = useToast();
  const documents = useAsync(() => repositories.documents.list(), []);
  const templates = useAsync(() => repositories.reports.templates(), []);
  const reports = useAsync(() => repositories.reports.list(), []);

  const [step, setStep] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [config, setConfig] = useState<ReportWizardConfig>({
    dataSourceIds: [],
    templateId: "",
    title: "",
    period: "FY 2025-26 Q2",
    subsidiary: "All subsidiaries",
    includeCharts: true,
    includeCitations: true,
    format: "PDF",
  });

  const selectedTemplate = templates.data?.find((t) => t.id === config.templateId);
  const eligible = (documents.data ?? []).filter((d) => d.status === "validated" || d.status === "extracted");

  const canAdvance =
    step === 0 ? config.dataSourceIds.length > 0 :
    step === 1 ? Boolean(config.templateId) :
    step === 2 ? config.title.trim().length > 0 :
    true;

  async function generate() {
    setGenerating(true);
    const report = await repositories.reports.generate(config);
    setGenerating(false);
    reports.reload();
    notify({
      tone: "success",
      title: "Report generated",
      description: `${report.title} · ${report.pageCount} pages · ${config.format}`,
    });
    setStep(0);
    setConfig((prev) => ({ ...prev, dataSourceIds: [], templateId: "", title: "" }));
  }

  function toggleSource(id: string) {
    setConfig((prev) => ({
      ...prev,
      dataSourceIds: prev.dataSourceIds.includes(id)
        ? prev.dataSourceIds.filter((s) => s !== id)
        : [...prev.dataSourceIds, id],
    }));
  }

  return (
    <>
      <PageHeader
        title="Automated Report Generation"
        description="Assemble statutory and operational reports from validated source documents."
        breadcrumbs={[{ label: "Reporting" }, { label: "Report Generation" }]}
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <Card>
          <div className="scrollbar-thin overflow-x-auto border-b border-hairline px-4 py-4 sm:px-5">
            <ol className="flex min-w-max items-center gap-1">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                const done = i < step;
                const active = i === step;
                return (
                  <li key={s.id} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => i <= step && setStep(i)}
                      disabled={i > step}
                      aria-current={active ? "step" : undefined}
                      className={cn(
                        "type-nav flex items-center gap-2.5 px-3 py-2 transition-colors",
                        active && "bg-surface-card text-ink-0",
                        done && "text-success hover:bg-success/10",
                        !active && !done && "text-muted-soft",
                      )}
                    >
                      <span
                        className={cn(
                          "numeral grid size-5 shrink-0 place-items-center text-[10px]",
                          active && "bg-primary-600 text-white",
                          done && "bg-success/15 text-success",
                          !active && !done && "bg-hairline text-muted-soft",
                        )}
                      >
                        {done ? <Check className="size-3" aria-hidden /> : i + 1}
                      </span>
                      <Icon className="hidden size-3.5 sm:block" aria-hidden />
                      <span className="whitespace-nowrap">{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 ? (
                      <ChevronRight className="mx-0.5 size-3.5 shrink-0 text-muted" aria-hidden />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>

          <CardBody>
            {step === 0 ? (
              <div>
                <h3 className="title-sm text-ink-0">Select data sources</h3>
                <p className="mt-1 text-xs text-muted">
                  Only validated and extracted documents can be used as report inputs.
                </p>
                {documents.loading ? (
                  <div className="mt-4 space-y-2">
                    {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                  </div>
                ) : (
                  <ul className="scrollbar-thin mt-4 max-h-80 space-y-1.5 overflow-y-auto pr-1">
                    {eligible.map((doc) => {
                      const checked = config.dataSourceIds.includes(doc.id);
                      return (
                        <li key={doc.id}>
                          <label
                            className={cn(
                              "flex cursor-pointer items-center gap-3 border p-3 transition-colors",
                              checked
                                ? "border-hairline-strong bg-surface-elevated/50"
                                : "border-hairline hover:border-hairline-strong hover:bg-surface-soft/50",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSource(doc.id)}
                              className="size-4 shrink-0 border-hairline-strong accent-ink-0"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-normal text-ink-0">{doc.name}</span>
                              <span className="block text-[11px] text-muted-soft">
                                {doc.subsidiary} · {doc.pageCount} pages · {doc.confidence.toFixed(1)}% confidence
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-3 text-xs text-muted">
                  {config.dataSourceIds.length} document{config.dataSourceIds.length === 1 ? "" : "s"} selected
                </p>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <h3 className="title-sm text-ink-0">Choose a template</h3>
                <p className="mt-1 text-xs text-muted">
                  Templates determine section structure, tone and statutory formatting.
                </p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {templates.data?.map((template) => {
                    const active = template.id === config.templateId;
                    return (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, templateId: template.id }))}
                        className={cn(
                          " border p-4 text-left transition-colors",
                          active
                            ? "border-primary-400 bg-primary-50/50 ring-1 ring-hairline-strong"
                            : "border-hairline hover:border-hairline-strong hover:bg-surface-soft/40",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-normal text-ink-0">{template.name}</p>
                          {active ? <Check className="size-4 shrink-0 text-link" aria-hidden /> : null}
                        </div>
                        <Badge tone="info" className="mt-1.5">{template.category}</Badge>
                        <p className="mt-2 text-xs leading-relaxed text-muted">{template.description}</p>
                        <p className="mt-2 text-[10px] text-muted-soft">
                          {template.sections.filter((s) => s.enabled).length} sections · used {template.usageCount} times
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {step === 2 ? (
              <div>
                <h3 className="title-sm text-ink-0">Configure parameters</h3>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <Label htmlFor="report-title">Report title</Label>
                    <TextInput
                      id="report-title"
                      value={config.title}
                      placeholder="e.g. Annual Production Review FY 2025-26"
                      onChange={(e) => setConfig((prev) => ({ ...prev, title: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="report-period">Reporting period</Label>
                    <Select
                      id="report-period"
                      value={config.period}
                      onChange={(e) => setConfig((prev) => ({ ...prev, period: e.target.value }))}
                    >
                      {["FY 2025-26 Q1", "FY 2025-26 Q2", "FY 2025-26 H1", "FY 2024-25 Annual"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="report-subsidiary">Subsidiary scope</Label>
                    <Select
                      id="report-subsidiary"
                      value={config.subsidiary}
                      onChange={(e) => setConfig((prev) => ({ ...prev, subsidiary: e.target.value }))}
                    >
                      <option>All subsidiaries</option>
                      {SUBSIDIARIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>
                  </div>
                </div>

                <div className="mt-5 space-y-3 border-t border-hairline pt-4">
                  {[
                    ["includeCharts", "Include charts and visualisations", "Embed trend lines and comparison charts in the document"],
                    ["includeCitations", "Include source citations", "Append a page-level annexure tracing every figure to its source"],
                  ].map(([key, label, help]) => (
                    <div key={key} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-normal text-body-strong">{label}</p>
                        <p className="mt-0.5 text-xs text-muted">{help}</p>
                      </div>
                      <Toggle
                        label={label}
                        checked={config[key as "includeCharts" | "includeCitations"]}
                        onChange={(value) => setConfig((prev) => ({ ...prev, [key]: value }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ) : null}

            {step === 3 ? (
              <div>
                <h3 className="title-sm text-ink-0">Preview</h3>
                <p className="mt-1 text-xs text-muted">Review the structure before generating.</p>
                <div className="mt-4 rounded-xl border border-hairline bg-surface-soft/50 p-5 sm:p-8">
                  <p className="text-[10px] tracking-wider text-muted-soft uppercase">
                    BHUMI · Bharat Hub for Unified Mining Intelligence
                  </p>
                  <h4 className="display-sm mt-2 text-ink-0">
                    {config.title || "Untitled Report"}
                  </h4>
                  <p className="mt-1 text-sm text-muted">
                    {config.period} · {config.subsidiary}
                  </p>
                  <div className="mt-5 border-t border-hairline-strong pt-4">
                    <p className="mb-2 text-[10px] font-normal tracking-wider text-muted-soft uppercase">
                      Contents
                    </p>
                    <ol className="space-y-1.5">
                      {selectedTemplate?.sections.filter((s) => s.enabled).map((section, i) => (
                        <li key={section.id} className="flex items-baseline gap-2 text-sm text-body">
                          <span className="text-xs tabular-nums text-muted-soft">{i + 1}.</span>
                          {section.title}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-hairline-strong pt-4 text-xs sm:grid-cols-4">
                    {[
                      ["Sources", `${config.dataSourceIds.length} documents`],
                      ["Template", selectedTemplate?.name ?? "—"],
                      ["Charts", config.includeCharts ? "Included" : "Excluded"],
                      ["Citations", config.includeCitations ? "Included" : "Excluded"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-muted-soft">{label}</dt>
                        <dd className="mt-0.5 truncate font-normal text-body-strong">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div>
                <h3 className="title-sm text-ink-0">Export format</h3>
                <p className="mt-1 text-xs text-muted">Choose the output format and generate.</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  {([
                    ["PDF", FileText, "Portable, print-ready, tamper-evident"],
                    ["DOCX", FileText, "Editable for further departmental review"],
                    ["XLSX", FileSpreadsheet, "Tabular data for further analysis"],
                  ] as [ExportFormat, typeof FileText, string][]).map(([format, Icon, help]) => {
                    const active = config.format === format;
                    return (
                      <button
                        key={format}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, format }))}
                        className={cn(
                          " border p-4 text-left transition-colors",
                          active
                            ? "border-primary-400 bg-primary-50/50 ring-1 ring-hairline-strong"
                            : "border-hairline hover:border-hairline-strong",
                        )}
                      >
                        <Icon className={cn("size-5", active ? "text-link" : "text-muted-soft")} aria-hidden />
                        <p className="mt-2 text-sm font-normal text-ink-0">{format}</p>
                        <p className="mt-0.5 text-[11px] text-muted">{help}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </CardBody>

          <div className="flex items-center justify-between gap-3 border-t border-hairline px-4 py-3.5 sm:px-5">
            <Button
              variant="secondary"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              <ChevronLeft className="size-4" aria-hidden />
              Back
            </Button>

            {step < STEPS.length - 1 ? (
              <Button onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
                Continue
                <ChevronRight className="size-4" aria-hidden />
              </Button>
            ) : (
              <Button variant="accent" onClick={() => void generate()} disabled={generating}>
                {generating ? (
                  <>
                    <Loader2 className="size-4 animate-spin" aria-hidden />
                    Generating…
                  </>
                ) : (
                  <>
                    <Sparkles className="size-4" aria-hidden />
                    Generate report
                  </>
                )}
              </Button>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader title="Recent reports" description="Latest generated documents across all templates" />
          <div className="scrollbar-thin max-h-96 overflow-auto">
            <table className="w-full min-w-[40rem] text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-surface-soft backdrop-blur">
                  {["Report", "Template", "Subsidiary", "Version", "Status", "Updated"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="type-caption border-b border-hairline px-3 py-3 text-left text-muted first:pl-5 last:pr-5"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.data?.slice(0, 8).map((report) => (
                  <tr key={report.id} className="border-b border-hairline last:border-0 hover:bg-surface-elevated/30">
                    <td className="max-w-xs truncate px-3 py-2.5 pl-4 font-normal text-ink-0">{report.title}</td>
                    <td className="px-3 py-2.5 text-body">{report.templateName}</td>
                    <td className="px-3 py-2.5 text-body">{report.subsidiary}</td>
                    <td className="px-3 py-2.5 tabular-nums text-body">v{report.version}</td>
                    <td className="px-3 py-2.5"><ReportStatusBadge status={report.status} /></td>
                    <td className="px-3 py-2.5 pr-4 text-muted">{formatDate(report.updatedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
}
