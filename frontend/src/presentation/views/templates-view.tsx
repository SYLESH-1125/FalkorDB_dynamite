"use client";

import { useState } from "react";
import { LayoutTemplate, Star, Copy, Settings2, Plus, GripVertical } from "lucide-react";
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
  const { notify } = useToast();
  const { data, loading, setData } = useAsync(() => repositories.reports.templates(), []);
  const [editing, setEditing] = useState<ReportTemplate | null>(null);
  const [filter, setFilter] = useState<string>("all");

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
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                filter === category
                  ? "bg-ink-800 text-white"
                  : "border border-sand-400 bg-white text-ink-500 hover:bg-sand-200",
              )}
            >
              {category === "all" ? "All templates" : category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-56 w-full rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((template) => (
              <Card key={template.id} className="flex flex-col">
                <CardBody className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-sand-200 text-ink-400">
                      <LayoutTemplate className="size-4" aria-hidden />
                    </span>
                    {template.isDefault ? (
                      <Badge tone="accent">
                        <Star className="size-2.5" aria-hidden />
                        Default
                      </Badge>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-ink-800">{template.name}</h3>
                  <Badge tone={CATEGORY_TONES[template.category]} className="mt-1.5">
                    {template.category}
                  </Badge>
                  <p className="mt-2.5 text-xs leading-relaxed text-ink-400">{template.description}</p>

                  <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-sand-300 pt-3 text-center">
                    {[
                      ["Sections", template.sections.filter((s) => s.enabled).length],
                      ["Used", template.usageCount],
                      ["Updated", formatDate(template.updatedAt).split(" ").slice(0, 2).join(" ")],
                    ].map(([label, value]) => (
                      <div key={label as string}>
                        <dt className="text-[10px] text-ink-300">{label as string}</dt>
                        <dd className="mt-0.5 text-xs font-medium text-ink-700">{value as string | number}</dd>
                      </div>
                    ))}
                  </dl>
                </CardBody>

                <div className="flex gap-2 border-t border-sand-300 px-4 py-3">
                  <Button variant="secondary" size="sm" className="flex-1" onClick={() => setEditing(template)}>
                    <Settings2 className="size-3.5" aria-hidden />
                    Configure
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    aria-label={`Duplicate ${template.name}`}
                    onClick={() => notify({ tone: "success", title: "Template duplicated", description: `${template.name} (copy)` })}
                  >
                    <Copy className="size-3.5" aria-hidden />
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
              <p className="mb-2 text-xs font-medium text-ink-500">
                Sections · {editing.sections.filter((s) => s.enabled).length} of {editing.sections.length} enabled
              </p>
              <ul className="space-y-2">
                {editing.sections.map((section) => (
                  <li
                    key={section.id}
                    className={cn(
                      "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                      section.enabled ? "border-sand-300 bg-white" : "border-sand-300 bg-sand-200/50",
                    )}
                  >
                    <GripVertical className="mt-0.5 size-4 shrink-0 cursor-grab text-sand-400" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className={cn("text-[13px] font-medium", section.enabled ? "text-ink-800" : "text-ink-300")}>
                        {section.title}
                      </p>
                      <p className="mt-0.5 text-xs text-ink-400">{section.description}</p>
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
