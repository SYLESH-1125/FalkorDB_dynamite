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
          <div className="scrollbar-thin overflow-x-auto border-b border-navy-100 px-4 py-4 sm:px-5">
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
                        "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors",
                        active && "bg-navy-900 text-white",
                        done && "text-emerald-600 hover:bg-emerald-50",
                        !active && !done && "text-navy-300",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-5 shrink-0 place-items-center rounded-full text-[10px]",
                          active && "bg-amber-brand-500 text-white",
                          done && "bg-emerald-100 text-emerald-700",
                          !active && !done && "bg-navy-100 text-navy-400",
                        )}
                      >
                        {done ? <Check className="size-3" aria-hidden /> : i + 1}
                      </span>
                      <Icon className="hidden size-3.5 sm:block" aria-hidden />
                      <span className="whitespace-nowrap">{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 ? (
                      <ChevronRight className="mx-0.5 size-3.5 shrink-0 text-navy-200" aria-hidden />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </div>

          <CardBody>
            {step === 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Select data sources</h3>
                <p className="mt-1 text-xs text-navy-500">
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
                              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
                              checked
                                ? "border-amber-brand-300 bg-amber-brand-50/50"
                                : "border-navy-100 hover:border-navy-200 hover:bg-navy-50/50",
                            )}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleSource(doc.id)}
                              className="size-4 shrink-0 rounded border-navy-300 accent-amber-brand-500"
                            />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-[13px] font-medium text-navy-900">{doc.name}</span>
                              <span className="block text-[11px] text-navy-400">
                                {doc.subsidiary} · {doc.pageCount} pages · {doc.confidence.toFixed(1)}% confidence
                              </span>
                            </span>
                          </label>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="mt-3 text-xs text-navy-500">
                  {config.dataSourceIds.length} document{config.dataSourceIds.length === 1 ? "" : "s"} selected
                </p>
              </div>
            ) : null}

            {step === 1 ? (
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Choose a template</h3>
                <p className="mt-1 text-xs text-navy-500">
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
                          "rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-amber-brand-400 bg-amber-brand-50/50 ring-1 ring-amber-brand-200"
                            : "border-navy-100 hover:border-navy-200 hover:bg-navy-50/40",
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-navy-900">{template.name}</p>
                          {active ? <Check className="size-4 shrink-0 text-amber-brand-600" aria-hidden /> : null}
                        </div>
                        <Badge tone="info" className="mt-1.5">{template.category}</Badge>
                        <p className="mt-2 text-xs leading-relaxed text-navy-500">{template.description}</p>
                        <p className="mt-2 text-[10px] text-navy-400">
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
                <h3 className="text-sm font-semibold text-navy-900">Configure parameters</h3>
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

                <div className="mt-5 space-y-3 border-t border-navy-100 pt-4">
                  {[
                    ["includeCharts", "Include charts and visualisations", "Embed trend lines and comparison charts in the document"],
                    ["includeCitations", "Include source citations", "Append a page-level annexure tracing every figure to its source"],
                  ].map(([key, label, help]) => (
                    <div key={key} className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-navy-800">{label}</p>
                        <p className="mt-0.5 text-xs text-navy-500">{help}</p>
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
                <h3 className="text-sm font-semibold text-navy-900">Preview</h3>
                <p className="mt-1 text-xs text-navy-500">Review the structure before generating.</p>
                <div className="mt-4 rounded-xl border border-navy-100 bg-cream/30 p-5 sm:p-8">
                  <p className="text-[10px] tracking-wider text-navy-400 uppercase">
                    Central Mine Planning &amp; Design Institute Limited
                  </p>
                  <h4 className="mt-2 font-serif text-2xl font-semibold text-navy-900">
                    {config.title || "Untitled Report"}
                  </h4>
                  <p className="mt-1 text-sm text-navy-500">
                    {config.period} · {config.subsidiary}
                  </p>
                  <div className="mt-5 border-t border-navy-200 pt-4">
                    <p className="mb-2 text-[10px] font-semibold tracking-wider text-navy-400 uppercase">
                      Contents
                    </p>
                    <ol className="space-y-1.5">
                      {selectedTemplate?.sections.filter((s) => s.enabled).map((section, i) => (
                        <li key={section.id} className="flex items-baseline gap-2 text-sm text-navy-700">
                          <span className="text-xs tabular-nums text-navy-400">{i + 1}.</span>
                          {section.title}
                        </li>
                      ))}
                    </ol>
                  </div>
                  <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-navy-200 pt-4 text-xs sm:grid-cols-4">
                    {[
                      ["Sources", `${config.dataSourceIds.length} documents`],
                      ["Template", selectedTemplate?.name ?? "—"],
                      ["Charts", config.includeCharts ? "Included" : "Excluded"],
                      ["Citations", config.includeCitations ? "Included" : "Excluded"],
                    ].map(([label, value]) => (
                      <div key={label}>
                        <dt className="text-navy-400">{label}</dt>
                        <dd className="mt-0.5 truncate font-medium text-navy-800">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            ) : null}

            {step === 4 ? (
              <div>
                <h3 className="text-sm font-semibold text-navy-900">Export format</h3>
                <p className="mt-1 text-xs text-navy-500">Choose the output format and generate.</p>
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
                          "rounded-xl border p-4 text-left transition-colors",
                          active
                            ? "border-amber-brand-400 bg-amber-brand-50/50 ring-1 ring-amber-brand-200"
                            : "border-navy-100 hover:border-navy-200",
                        )}
                      >
                        <Icon className={cn("size-5", active ? "text-amber-brand-600" : "text-navy-400")} aria-hidden />
                        <p className="mt-2 text-sm font-medium text-navy-900">{format}</p>
                        <p className="mt-0.5 text-[11px] text-navy-500">{help}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </CardBody>

          <div className="flex items-center justify-between gap-3 border-t border-navy-100 px-4 py-3.5 sm:px-5">
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
                <tr className="bg-navy-50/90 backdrop-blur">
                  {["Report", "Template", "Subsidiary", "Version", "Status", "Updated"].map((h) => (
                    <th
                      key={h}
                      scope="col"
                      className="border-b border-navy-100 px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-navy-600 uppercase first:pl-4 last:pr-4"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reports.data?.slice(0, 8).map((report) => (
                  <tr key={report.id} className="border-b border-navy-50 last:border-0 hover:bg-amber-brand-50/30">
                    <td className="max-w-xs truncate px-3 py-2.5 pl-4 font-medium text-navy-900">{report.title}</td>
                    <td className="px-3 py-2.5 text-navy-600">{report.templateName}</td>
                    <td className="px-3 py-2.5 text-navy-600">{report.subsidiary}</td>
                    <td className="px-3 py-2.5 tabular-nums text-navy-600">v{report.version}</td>
                    <td className="px-3 py-2.5"><ReportStatusBadge status={report.status} /></td>
                    <td className="px-3 py-2.5 pr-4 text-navy-500">{formatDate(report.updatedAt)}</td>
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
