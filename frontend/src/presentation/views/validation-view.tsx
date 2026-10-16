"use client";

import { useState } from "react";
import { Check, X, Pencil, FileCheck2, ChevronLeft } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime } from "@/src/application/services/formatting";
import type { ValidationRecord, ExtractedField } from "@/src/domain/entities/validation";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { TextInput } from "../components/ui/field";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { FieldStatusBadge, ConfidenceBar } from "../components/shared/status-badge";
import { useToast } from "../components/ui/toast";
import { cn } from "../components/ui/cn";

export function ValidationView() {
  const { notify } = useToast();
  const { data, loading, setData } = useAsync(() => repositories.validation.list(), []);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [cleared, setCleared] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const records = data ?? [];
  // fall back to the first record rather than syncing selection through an effect
  const selectedId = chosenId ?? (cleared ? null : (records[0]?.id ?? null));
  const selected = records.find((r) => r.id === selectedId) ?? null;

  function selectRecord(id: string | null) {
    setChosenId(id);
    setCleared(id === null);
  }

  function startEdit(field: ExtractedField) {
    setEditingId(field.id);
    setDraft(field.correctedValue ?? field.extractedValue);
  }

  async function saveField(record: ValidationRecord, field: ExtractedField) {
    const updated = await repositories.validation.saveField(record.id, {
      ...field,
      correctedValue: draft === field.extractedValue ? null : draft,
    });
    setData(records.map((r) => (r.id === record.id ? updated : r)));
    setEditingId(null);
    notify({ tone: "success", title: "Field validated", description: field.label });
  }

  async function approveAll(record: ValidationRecord) {
    const updated = await repositories.validation.approve(record.id);
    setData(records.map((r) => (r.id === record.id ? updated : r)));
    notify({
      tone: "success",
      title: "Record approved",
      description: `All ${record.fields.length} fields marked validated.`,
    });
  }

  function pendingCount(record: ValidationRecord) {
    return record.fields.filter((f) => f.status !== "validated").length;
  }

  const totalPending = records.reduce((sum, r) => sum + pendingCount(r), 0);

  return (
    <>
      <PageHeader
        title="Data Validation & Correction"
        description="Review low-confidence extractions and apply corrections before records are indexed."
        breadcrumbs={[{ label: "Data Pipeline" }, { label: "Data Validation" }]}
        action={
          selected ? (
            <Button onClick={() => void approveAll(selected)} disabled={pendingCount(selected) === 0}>
              <FileCheck2 className="size-4" aria-hidden />
              Approve all fields
            </Button>
          ) : null
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Records in queue", records.length],
            ["Fields pending", totalPending],
            ["Avg. confidence", "86.4%"],
            ["Corrections today", 34],
          ].map(([label, value]) => (
            <div key={label as string} className="rounded-xl border border-sand-300 bg-white p-4">
              <p className="text-xs text-ink-400">{label as string}</p>
              <p className="mt-1 font-serif text-2xl font-semibold text-ink-800">{value as string | number}</p>
            </div>
          ))}
        </div>

        <div className="grid min-w-0 gap-5 lg:grid-cols-[19rem_1fr]">
          <Card className={cn("min-w-0", selected && "hidden lg:block")}>
            <CardHeader title="Review queue" description={`${records.length} records awaiting review`} />
            {loading ? (
              <div className="space-y-2 p-4">
                {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full" />)}
              </div>
            ) : (
              <ul className="scrollbar-thin max-h-[34rem] divide-y divide-sand-200 overflow-y-auto">
                {records.map((record) => {
                  const pending = pendingCount(record);
                  return (
                    <li key={record.id}>
                      <button
                        type="button"
                        onClick={() => selectRecord(record.id)}
                        aria-current={record.id === selectedId ? "true" : undefined}
                        className={cn(
                          "w-full px-4 py-3 text-left transition-colors hover:bg-sand-200",
                          record.id === selectedId && "border-l-2 border-clay-500 bg-clay-50/40",
                        )}
                      >
                        <p className="truncate text-[13px] font-medium text-ink-800" title={record.documentName}>
                          {record.documentName}
                        </p>
                        <p className="mt-0.5 text-[11px] text-ink-300">
                          {record.subsidiary} · {relativeTime(record.submittedAt)}
                        </p>
                        <div className="mt-1.5">
                          {pending > 0 ? (
                            <Badge tone="warning">{pending} pending</Badge>
                          ) : (
                            <Badge tone="success">Validated</Badge>
                          )}
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          {selected ? (
            <Card className="min-w-0">
              <CardHeader
                title={
                  <span className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => selectRecord(null)}
                      aria-label="Back to queue"
                      className="rounded p-0.5 text-ink-300 hover:text-ink-600 lg:hidden"
                    >
                      <ChevronLeft className="size-4" aria-hidden />
                    </button>
                    <span className="truncate">{selected.documentName}</span>
                  </span>
                }
                description={`Assigned to ${selected.assignedTo} · ${selected.fields.length} extracted fields`}
              />

              <div className="scrollbar-thin max-h-[34rem] overflow-auto">
                <table className="w-full min-w-[44rem] text-sm">
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-sand-200/90 backdrop-blur">
                      {["Field", "Extracted value", "Confidence", "Source", "Status", ""].map((h) => (
                        <th
                          key={h}
                          scope="col"
                          className="border-b border-sand-300 px-3 py-2.5 text-left text-[11px] font-semibold tracking-wide text-ink-500 uppercase first:pl-4 last:pr-4"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {selected.fields.map((field) => {
                      const editing = editingId === field.id;
                      const value = field.correctedValue ?? field.extractedValue;
                      return (
                        <tr
                          key={field.id}
                          className={cn(
                            "border-b border-sand-200 last:border-0",
                            field.status === "error" && !editing && "bg-red-50/40",
                          )}
                        >
                          <td className="px-3 py-2.5 pl-4 font-medium text-ink-700">{field.label}</td>
                          <td className="px-3 py-2.5">
                            {editing ? (
                              <TextInput
                                value={draft}
                                onChange={(e) => setDraft(e.target.value)}
                                aria-label={`Correct value for ${field.label}`}
                                autoFocus
                                className="h-8 py-1 text-[13px]"
                              />
                            ) : (
                              <span className="text-ink-600">
                                {value}
                                {field.correctedValue ? (
                                  <span className="ml-2 text-[10px] text-clay-600">corrected</span>
                                ) : null}
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2.5"><ConfidenceBar value={field.confidence} /></td>
                          <td className="px-3 py-2.5 text-[11px] text-ink-300">{field.boundingBoxHint}</td>
                          <td className="px-3 py-2.5"><FieldStatusBadge status={field.status} /></td>
                          <td className="px-3 py-2.5 pr-4">
                            {editing ? (
                              <div className="flex gap-1">
                                <button
                                  type="button"
                                  onClick={() => void saveField(selected, field)}
                                  aria-label="Save correction"
                                  className="rounded-md p-1.5 text-emerald-600 hover:bg-emerald-50"
                                >
                                  <Check className="size-3.5" aria-hidden />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  aria-label="Cancel"
                                  className="rounded-md p-1.5 text-ink-300 hover:bg-sand-200"
                                >
                                  <X className="size-3.5" aria-hidden />
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEdit(field)}
                                aria-label={`Edit ${field.label}`}
                                className="rounded-md p-1.5 text-ink-300 hover:bg-sand-200 hover:text-ink-600"
                              >
                                <Pencil className="size-3.5" aria-hidden />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          ) : (
            <Card>
              <EmptyState
                title="Select a record to review"
                description="Choose a document from the review queue to inspect its extracted fields."
              />
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
