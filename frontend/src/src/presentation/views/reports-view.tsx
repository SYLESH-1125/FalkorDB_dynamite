"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Sparkles, Send, FileText, LayoutTemplate, Loader2, ChevronDown, Check, Wand2,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatDate } from "@/src/application/services/formatting";
import { SUBSIDIARIES } from "@/src/domain/entities/common";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Select, Label } from "../components/ui/field";
import { ReportStatusBadge } from "../components/shared/status-badge";
import { useToast } from "../components/ui/toast";
import { cn } from "../components/ui/cn";

const REPORT_TYPE_PROMPTS = [
  "Draft a quarterly production and dispatch statement",
  "Prepare a parliamentary question response on rehabilitation progress",
  "Summarise environmental clearance status across pending projects",
  "Generate an annual performance report for this subsidiary",
];

function PickerDropdown<T extends { id: string; name: string }>({
  label, placeholder, options, value, onChange, renderExtra,
}: {
  label: string;
  placeholder: string;
  options: T[];
  value: string;
  onChange: (id: string) => void;
  renderExtra?: (option: T) => string;
}) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.id === value);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex h-9 items-center gap-1.5 rounded-full border border-hairline-strong bg-surface-card px-3 text-[12.5px] font-medium text-body-strong transition-colors hover:bg-surface-soft"
      >
        <LayoutTemplate className="size-3.5 text-muted-soft" aria-hidden />
        {selected ? selected.name : placeholder}
        <ChevronDown className={cn("size-3.5 text-muted-soft transition-transform", open && "rotate-180")} aria-hidden />
      </button>
      {open ? (
        <div className="scrollbar-thin card-raise absolute left-0 top-full z-20 mt-2 max-h-72 w-72 overflow-y-auto rounded-xl border border-hairline bg-surface-card p-1.5">
          <p className="px-2 py-1.5 text-[10.5px] font-semibold tracking-wide text-muted-soft uppercase">{label}</p>
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { onChange(option.id); setOpen(false); }}
              className={cn(
                "flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left text-[12.5px] transition-colors hover:bg-surface-soft",
                option.id === value ? "bg-primary-50 font-semibold text-primary-700" : "text-body",
              )}
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate">{option.name}</span>
                {renderExtra ? <span className="block text-[11px] text-muted-soft">{renderExtra(option)}</span> : null}
              </span>
              {option.id === value ? <Check className="mt-0.5 size-3.5 shrink-0 text-primary-600" aria-hidden /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ReportsView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { notify } = useToast();
  const documents = useAsync(() => repositories.documents.list(), []);
  const templates = useAsync(() => repositories.reports.templates(), []);
  const reports = useAsync(() => repositories.reports.list(), []);

  const [prompt, setPrompt] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [subsidiary, setSubsidiary] = useState("All subsidiaries");
  const [period, setPeriod] = useState("FY 2025-26 Q2");
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [sourcesOpen, setSourcesOpen] = useState(false);
  const [drafting, setDrafting] = useState(false);

  useEffect(() => {
    const fromUrl = searchParams.get("templateId");
    if (fromUrl) setTemplateId(fromUrl);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const eligibleDocs = (documents.data ?? []).filter((d) => d.status === "validated" || d.status === "extracted");
  const effectiveTemplateId = templateId || templates.data?.find((t) => t.isDefault)?.id || templates.data?.[0]?.id || "";

  async function submitPrompt() {
    const trimmed = prompt.trim();
    if (!trimmed || !effectiveTemplateId || drafting) return;

    setDrafting(true);
    try {
      const report = await repositories.reports.draft({
        prompt: trimmed,
        templateId: effectiveTemplateId,
        dataSourceIds: selectedSources,
        subsidiary,
        period,
      });
      router.push(`/reports/${report.id}/edit`);
    } catch (err) {
      notify({
        tone: "error",
        title: "Could not draft the report",
        description: err instanceof Error ? err.message : "Try again in a moment.",
      });
      setDrafting(false);
    }
  }

  function toggleSource(id: string) {
    setSelectedSources((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  return (
    <>
      <PageHeader
        title="Automated Report Generation"
        description="Describe the report you need — BHUMI drafts it from your validated documents, ready to edit."
        breadcrumbs={[{ label: "Reporting" }, { label: "Report Generation" }]}
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <Card className="overflow-visible">
          <div className="p-5 sm:p-7">
            <div className="mx-auto max-w-3xl text-center">
              <span className="relative mx-auto grid size-14 place-items-center rounded-2xl bg-primary-600 text-white shadow-[0_16px_32px_-12px_rgba(18,48,74,0.5)]">
                <Wand2 className="size-7" aria-hidden />
                <span
                  className="pointer-events-none absolute -inset-4 -z-10 rounded-full opacity-70 blur-2xl"
                  style={{ background: "radial-gradient(ellipse, rgba(242,183,5,0.25), transparent 70%)" }}
                  aria-hidden
                />
              </span>
              <h2 className="display-sm mt-5 text-ink-0">What report do you need?</h2>
              <p className="mt-2 text-[13.5px] text-body">
                Describe it in plain language. BHUMI drafts the sections, tables and charts from your selected sources.
              </p>
            </div>

            <div className="mx-auto mt-6 max-w-3xl">
              <div className="rounded-3xl border border-hairline-strong bg-surface-card p-2 shadow-[0_8px_24px_-12px_rgba(18,48,74,0.18)] transition-colors focus-within:border-primary-400">
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submitPrompt();
                    }
                  }}
                  rows={2}
                  placeholder="e.g. Draft a production and safety summary for ECL, FY 2025-26 Q2…"
                  className="max-h-40 min-h-16 w-full resize-none bg-transparent px-3 py-2 text-[15px] text-ink-0 placeholder:text-muted-soft focus:outline-none"
                />
                <div className="flex flex-wrap items-center justify-between gap-2 px-1 pt-1 pb-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <PickerDropdown
                      label="Template"
                      placeholder="Choose a template"
                      options={(templates.data ?? []).map((t) => ({ id: t.id, name: t.name }))}
                      value={effectiveTemplateId}
                      onChange={setTemplateId}
                    />

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setSourcesOpen((v) => !v)}
                        aria-expanded={sourcesOpen}
                        className="flex h-9 items-center gap-1.5 rounded-full border border-hairline-strong bg-surface-card px-3 text-[12.5px] font-medium text-body-strong transition-colors hover:bg-surface-soft"
                      >
                        <FileText className="size-3.5 text-muted-soft" aria-hidden />
                        {selectedSources.length > 0 ? `${selectedSources.length} source${selectedSources.length === 1 ? "" : "s"}` : "Source documents"}
                        <ChevronDown className={cn("size-3.5 text-muted-soft transition-transform", sourcesOpen && "rotate-180")} aria-hidden />
                      </button>
                      {sourcesOpen ? (
                        <div className="scrollbar-thin card-raise absolute left-0 top-full z-20 mt-2 max-h-72 w-80 overflow-y-auto rounded-xl border border-hairline bg-surface-card p-1.5">
                          <p className="px-2 py-1.5 text-[10.5px] font-semibold tracking-wide text-muted-soft uppercase">
                            Validated documents
                          </p>
                          {eligibleDocs.length === 0 ? (
                            <p className="px-2.5 py-3 text-[12px] text-muted-soft">No validated documents yet.</p>
                          ) : (
                            eligibleDocs.map((doc) => {
                              const checked = selectedSources.includes(doc.id);
                              return (
                                <label
                                  key={doc.id}
                                  className="flex cursor-pointer items-start gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors hover:bg-surface-soft"
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleSource(doc.id)}
                                    className="mt-0.5 size-3.5 shrink-0 accent-primary-600"
                                  />
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-[12.5px] text-ink-0">{doc.name}</span>
                                    <span className="block text-[11px] text-muted-soft">{doc.subsidiary} · {doc.pageCount}p</span>
                                  </span>
                                </label>
                              );
                            })
                          )}
                        </div>
                      ) : null}
                    </div>

                    <Select
                      value={subsidiary}
                      onChange={(e) => setSubsidiary(e.target.value)}
                      className="!h-9 w-auto rounded-full border-hairline-strong px-3 py-0 text-[12.5px] font-medium"
                    >
                      <option>All subsidiaries</option>
                      {SUBSIDIARIES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </Select>

                    <Select
                      value={period}
                      onChange={(e) => setPeriod(e.target.value)}
                      className="!h-9 w-auto rounded-full border-hairline-strong px-3 py-0 text-[12.5px] font-medium"
                    >
                      {["FY 2025-26 Q1", "FY 2025-26 Q2", "FY 2025-26 H1", "FY 2024-25 Annual"].map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Select>
                  </div>

                  <button
                    type="button"
                    onClick={() => void submitPrompt()}
                    disabled={!prompt.trim() || !effectiveTemplateId || drafting}
                    aria-label="Generate report"
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-primary-600 text-white transition-all duration-200 enabled:hover:scale-105 enabled:hover:bg-primary-700 disabled:bg-hairline-strong disabled:text-muted-soft"
                  >
                    {drafting ? <Loader2 className="size-4.5 animate-spin" aria-hidden /> : <Send className="size-4.5" aria-hidden />}
                  </button>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {REPORT_TYPE_PROMPTS.map((example) => (
                  <button
                    key={example}
                    type="button"
                    onClick={() => setPrompt(example)}
                    className="rounded-full border border-hairline bg-surface-soft px-3 py-1.5 text-[11.5px] text-body transition-colors hover:border-hairline-strong hover:bg-surface-card"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
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
                  <tr
                    key={report.id}
                    onClick={() => router.push(`/reports/${report.id}/edit`)}
                    className="cursor-pointer border-b border-hairline last:border-0 hover:bg-surface-elevated/30"
                  >
                    <td className="max-w-xs truncate px-3 py-2.5 pl-4 font-normal text-ink-0">
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="size-3 shrink-0 text-secondary-500" aria-hidden />
                        {report.title}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-body">{report.templateName}</td>
                    <td className="px-3 py-2.5 text-body">{report.subsidiary}</td>
                    <td className="px-3 py-2.5 tabular-nums text-body">v{report.version}</td>
                    <td className="px-3 py-2.5"><ReportStatusBadge status={report.status} /></td>
                    <td className="px-3 py-2.5 pr-4 text-muted">{formatDate(report.updatedAt)}</td>
                  </tr>
                ))}
                {reports.data?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-[12.5px] text-muted-soft">
                      No reports yet — describe what you need above to generate your first one.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      {drafting ? (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-ink-0/50 backdrop-blur-sm" aria-hidden />
          <div className="card-float relative flex w-full max-w-sm flex-col items-center rounded-3xl bg-surface-card px-8 py-10 text-center">
            <div className="relative grid size-16 place-items-center">
              <span className="absolute inset-0 animate-spin rounded-full border-2 border-primary-100 border-t-primary-600" aria-hidden />
              <Sparkles className="size-6 text-primary-600" aria-hidden />
            </div>
            <h3 className="title-md mt-5 text-ink-0">Drafting your report…</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-body">
              Reading your source documents, structuring the sections and rendering charts. This usually takes under a minute.
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
