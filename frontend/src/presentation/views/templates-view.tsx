"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LayoutTemplate, Star, Settings2, Plus, GripVertical, FileDown, Wand2 } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatDate } from "@/src/application/services/formatting";
import type { ReportTemplate } from "@/src/domain/entities/report";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardBody } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Modal } from "../components/ui/modal";
import { Toggle, Label, TextInput } from "../components/ui/field";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../components/ui/toast";
import { cn } from "../components/ui/cn";

const CATEGORY_TONES = {
  Statutory: "info", Operational: "success", Parliamentary: "danger",
  Environmental: "accent", Financial: "warning",
} as const;

export function TemplatesView() {
  const router = useRouter();
  const { notify } = useToast();
  const { data, loading, setData } = useAsync(() => repositories.reports.templates(), []);
  const [editing, setEditing] = useState<ReportTemplate | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [openingFile, setOpeningFile] = useState<string | null>(null);

  async function viewFile(template: ReportTemplate) {
    if (!template.hasFile) {
      notify({
        tone: "info",
        title: "No reference file yet",
        description: "A Ministry of Coal PDF hasn't been uploaded for this template yet.",
      });
      return;
    }
    setOpeningFile(template.id);
    try {
      const blob = await repositories.reports.templateFileBlob(template.id);
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (err) {
      notify({ tone: "error", title: "Could not open file", description: err instanceof Error ? err.message : undefined });
    } finally {
      setOpeningFile(null);
    }
  }

  const templates = data ?? [];
  const categories = ["all", ...new Set(templates.map((t) => t.category))];
  const visible = filter === "all" ? templates : templates.filter((t) => t.category === filter);

  async function save() {
    if (!editing) return;
    const saved = await repositories.reports.saveTemplate(editing);
    setData(templates.map((t) => (t.id === saved.id ? saved : t)));
    setEditing(null);
    notify({ tone: "success", title: "Template saved", description: saved.name });
  }

  function toggleSection(sectionId: string) {
    setEditing((prev) =>
      prev
        ? {
            ...prev,
            sections: prev.sections.map((s) =>
              s.id === sectionId ? { ...s, enabled: !s.enabled } : s,
            ),
          }
        : prev,
    );
  }

  return (
    <>
      <PageHeader
        title="Report Templates & Customization"
        description="Define the section structure and formatting rules that drive automated report generation."
        breadcrumbs={[{ label: "Reporting" }, { label: "Report Templates" }]}
        action={
          <Button onClick={() => notify({ tone: "info", title: "New template", description: "Template builder opens here in the full build." })}>
            <Plus className="size-4" aria-hidden />
            New template
          </Button>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              onClick={() => setFilter(category)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 text-xs font-normal whitespace-nowrap transition-colors",
                filter === category
                  ? "bg-surface-card text-ink-0"
                  : "border border-hairline-strong bg-surface-card text-body hover:bg-surface-soft",
              )}
            >
              {category === "all" ? "All templates" : category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-56 w-full " />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardBody className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-9 shrink-0 place-items-center bg-surface-soft text-muted">
                      <LayoutTemplate className="size-4" aria-hidden />
                    </span>
                    {template.isDefault ? (
                      <Badge tone="accent">
                        <Star className="size-2.5" aria-hidden />
                        Default
                      </Badge>
                    ) : null}
                  </div>

                  <h3 className="title-sm mt-3 text-ink-0">{template.name}</h3>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <Badge tone={CATEGORY_TONES[template.category]}>
                      {template.category}
                    </Badge>
                    {template.hasFile ? (
                      <Badge tone="success">
                        <FileDown className="size-2.5" aria-hidden />
                        Reference PDF
                      </Badge>
                    ) : null}
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-muted">{template.description}</p>

                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-hairline pt-3 text-center">
                    {[
                      ["Sections", template.sections.filter((s) => s.enabled).length],
                      ["Used", template.usageCount],
                      ["Updated", formatDate(template.updatedAt).split(" ").slice(0, 2).join(" ")],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="type-caption text-muted-soft">{label as string}</dt>
                        <dd className="mt-0.5 text-xs font-normal text-body-strong">{value as string | number}</dd>
                      </div>
                    ))}
                  </dl>
                </CardBody>

                <div className="flex flex-wrap gap-2 border-t border-hairline px-4 py-3">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/reports?templateId=${template.id}`)}
                  >
                    <Wand2 className="size-3.5" aria-hidden />
                    Use template
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => void viewFile(template)}
                    disabled={openingFile === template.id}
                  >
                    <FileDown className="size-3.5" aria-hidden />
                    {template.hasFile ? "View PDF" : "No PDF"}
                  </Button>
                  <Button variant="ghost" size="sm" aria-label={`Configure ${template.name}`} onClick={() => setEditing(template)}>
                    <Settings2 className="size-3.5" aria-hidden />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={Boolean(editing)}
        onClose={() => setEditing(null)}
        title={editing?.name ?? ""}
        description="Enable, disable and reorder the sections this template generates."
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={() => void save()}>Save changes</Button>
          </>
        }
      >
        {editing ? (
          <div className="space-y-5">
            <div>
              <Label htmlFor="template-name">Template name</Label>
              <TextInput
                id="template-name"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
              />
            </div>

            <div>
              <p className="mb-2 text-xs font-normal text-body">
                Sections · {editing.sections.filter((s) => s.enabled).length} of {editing.sections.length} enabled
              </p>
              <ul className="space-y-2">
                {editing.sections.map((section) => (
                  <li
                    key={section.id}
                    className={cn(
                      "flex items-start gap-3 border p-3 transition-colors",
                      section.enabled ? "border-hairline bg-surface-card" : "border-hairline bg-surface-soft/50",
                    )}
                  >
                    <GripVertical className="mt-0.5 size-4 shrink-0 cursor-grab text-muted" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[13px] font-normal", section.enabled ? "text-ink-0" : "text-muted-soft")}>
                        {section.title}
                      </p>
                      <p className="mt-0.5 text-xs text-muted">{section.description}</p>
                    </div>
                    <Toggle
                      label={`Toggle ${section.title}`}
                      checked={section.enabled}
                      onChange={() => toggleSection(section.id)}
                    />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}
