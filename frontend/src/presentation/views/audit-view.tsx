"use client";

import { useState } from "react";
import { ShieldCheck, Search, Download, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatDateTime } from "@/src/application/services/formatting";
import type { AuditEntry, AuditOutcome } from "@/src/domain/entities/audit";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge, type BadgeTone } from "../components/ui/badge";
import { Modal } from "../components/ui/modal";
import { Select, TextInput } from "../components/ui/field";
import { TableSkeleton } from "../components/ui/skeleton";
import { DataTable, type Column } from "../components/ui/data-table";
import { useToast } from "../components/ui/toast";

const OUTCOME_TONES: Record<AuditOutcome, BadgeTone> = {
  success: "success", warning: "warning", failure: "danger",
};

const OUTCOME_ICONS: Record<AuditOutcome, typeof CheckCircle2> = {
  success: CheckCircle2, warning: AlertTriangle, failure: XCircle,
};

export function AuditView() {
  const { notify } = useToast();
  const { data, loading } = useAsync(() => repositories.audit.list(), []);
  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState("all");
  const [action, setAction] = useState("all");
  const [selected, setSelected] = useState<AuditEntry | null>(null);

  const entries = data ?? [];
  const actions = [...new Set(entries.map((e) => e.action))].sort();

  const visible = entries.filter(
    (e) =>
      (outcome === "all" || e.outcome === outcome) &&
      (action === "all" || e.action === action) &&
      (search === "" ||
        e.actor.toLowerCase().includes(search.toLowerCase()) ||
        e.resourceId.toLowerCase().includes(search.toLowerCase())),
  );

  const columns: Column<AuditEntry>[] = [
    {
      key: "timestamp", header: "Timestamp", sortValue: (e) => e.timestamp,
      render: (e) => <span className="whitespace-nowrap tabular-nums text-body">{formatDateTime(e.timestamp)}</span>,
    },
    {
      key: "actor", header: "Actor", sortValue: (e) => e.actor,
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate font-normal text-ink-0">{e.actor}</p>
          <p className="text-[11px] text-muted-soft">{e.actorRole}</p>
        </div>
      ),
    },
    {
      key: "action", header: "Action", sortValue: (e) => e.action,
      render: (e) => <code className="bg-surface-soft px-1.5 py-0.5 text-[11px] text-body">{e.action}</code>,
    },
    {
      key: "resource", header: "Resource", sortValue: (e) => e.resource,
      render: (e) => (
        <div className="min-w-0">
          <p className="truncate text-body">{e.resource}</p>
          <p className="text-[11px] text-muted-soft">{e.resourceId}</p>
        </div>
      ),
    },
    { key: "ip", header: "IP address", render: (e) => <span className="tabular-nums text-muted">{e.ipAddress}</span> },
    {
      key: "outcome", header: "Outcome", sortValue: (e) => e.outcome,
      render: (e) => {
        const Icon = OUTCOME_ICONS[e.outcome];
        return (
          <Badge tone={OUTCOME_TONES[e.outcome]}>
            <Icon className="size-2.5" aria-hidden />
            {e.outcome}
          </Badge>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Audit Log & Traceability"
        description="Immutable record of every action taken on the platform. Retained for seven years and modifiable by no role."
        breadcrumbs={[{ label: "Administration" }, { label: "Audit Log" }]}
        action={
          <Button
            variant="secondary"
            onClick={() => notify({ tone: "success", title: "Export queued", description: `${visible.length} entries · CSV` })}
          >
            <Download className="size-4" aria-hidden />
            Export log
          </Button>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="flex items-start gap-3 card-raise rounded-xl border border-hairline bg-surface-card p-4 text-body">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-ink-0" aria-hidden />
          <div>
            <p className="text-sm font-normal text-ink-0">Tamper-evident record</p>
            <p className="mt-0.5 text-xs text-muted-soft">
              Entries are append-only and cryptographically chained. Any modification breaks the chain
              and is surfaced during statutory audit.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Total entries", entries.length],
            ["Successful", entries.filter((e) => e.outcome === "success").length],
            ["Warnings", entries.filter((e) => e.outcome === "warning").length],
            ["Failures", entries.filter((e) => e.outcome === "failure").length],
          ].map(([label, value]) => (
            <div key={label as string} className=" card-raise rounded-xl border border-hairline bg-surface-card p-4">
              <p className="type-caption text-muted">{label as string}</p>
              <p className="mt-1 numeral text-2xl text-ink-0">{value as number}</p>
            </div>
          ))}
        </div>

        <Card>
          <CardHeader
            title="Audit entries"
            description={`${visible.length} of ${entries.length} records`}
            action={
              <div className="flex flex-wrap gap-2">
                <div className="relative">
                  <Search className="absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-soft" aria-hidden />
                  <TextInput
                    aria-label="Search audit log"
                    placeholder="Actor or resource ID…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 w-44 py-0 pl-8 text-xs"
                  />
                </div>
                <Select
                  aria-label="Filter by action"
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  className="h-8 w-auto py-0 text-xs"
                >
                  <option value="all">All actions</option>
                  {actions.map((a) => <option key={a} value={a}>{a}</option>)}
                </Select>
                <Select
                  aria-label="Filter by outcome"
                  value={outcome}
                  onChange={(e) => setOutcome(e.target.value)}
                  className="h-8 w-auto py-0 text-xs"
                >
                  <option value="all">All outcomes</option>
                  {["success", "warning", "failure"].map((o) => (
                    <option key={o} value={o}>{o[0].toUpperCase() + o.slice(1)}</option>
                  ))}
                </Select>
              </div>
            }
          />
          {loading ? (
            <TableSkeleton rows={10} cols={6} />
          ) : (
            <DataTable
              columns={columns}
              rows={visible}
              onRowClick={setSelected}
              caption="Platform audit trail"
              emptyMessage="No entries match the current filters."
            />
          )}
        </Card>
      </div>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.action ?? ""}
        description={selected ? formatDateTime(selected.timestamp) : undefined}
        size="sm"
        footer={<Button variant="secondary" onClick={() => setSelected(null)}>Close</Button>}
      >
        {selected ? (
          <dl className="space-y-3">
            {[
              ["Entry ID", selected.id],
              ["Actor", `${selected.actor} (${selected.actorRole})`],
              ["Resource", `${selected.resource} · ${selected.resourceId}`],
              ["IP address", selected.ipAddress],
              ["Outcome", selected.outcome],
              ["Details", selected.details],
            ].map(([label, value]) => (
              <div key={label} className="border-b border-hairline pb-2.5 last:border-0">
                <dt className="text-[10px] font-normal tracking-wider text-muted-soft uppercase">{label}</dt>
                <dd className="mt-1 text-sm text-body-strong">{value}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </Modal>
    </>
  );
}
