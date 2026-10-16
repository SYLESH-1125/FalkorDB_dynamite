"use client";

import { useState } from "react";
import { Plug, RefreshCw, Loader2, Globe, Bell, Palette, Database, Check } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime, formatNumber } from "@/src/application/services/formatting";
import type { Integration, IntegrationStatus } from "@/src/domain/entities/integration";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader, CardBody } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge, type BadgeTone, StatusDot } from "../components/ui/badge";
import { Select, Toggle, Label, TextInput } from "../components/ui/field";
import { Skeleton } from "../components/ui/skeleton";
import { useToast } from "../components/ui/toast";
import { cn } from "../components/ui/cn";

const STATUS_TONES: Record<IntegrationStatus, BadgeTone> = {
  connected: "success", degraded: "warning", disconnected: "danger",
};

const TABS = [
  { id: "integrations", label: "Integrations", icon: Plug },
  { id: "preferences", label: "Preferences", icon: Palette },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "data", label: "Data & retention", icon: Database },
];

export function SettingsView() {
  const { notify } = useToast();
  const { data, loading, setData } = useAsync(() => repositories.integrations.list(), []);
  const [tab, setTab] = useState("integrations");
  const [syncing, setSyncing] = useState<string | null>(null);

  const [prefs, setPrefs] = useState({
    emailDigest: true,
    criticalAlerts: true,
    weeklyReport: false,
    autoValidate: true,
    language: "English",
    density: "Comfortable",
    timezone: "Asia/Kolkata (IST)",
  });

  const integrations = data ?? [];

  async function sync(integration: Integration) {
    setSyncing(integration.id);
    const updated = await repositories.integrations.sync(integration.id);
    setData(integrations.map((i) => (i.id === integration.id ? updated : i)));
    setSyncing(null);
    notify({
      tone: "success",
      title: "Sync complete",
      description: `${updated.name} · ${formatNumber(updated.recordsSynced)} records`,
    });
  }

  return (
    <>
      <PageHeader
        title="Integration & Settings"
        description="Connect CIL subsidiary systems and configure platform behaviour."
        breadcrumbs={[{ label: "Administration" }, { label: "Settings" }]}
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="scrollbar-thin mb-5 flex min-w-0 gap-1 overflow-x-auto border-b border-navy-100 pb-px">
          {TABS.map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex shrink-0 items-center gap-1.5 border-b-2 px-3.5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                  active
                    ? "border-amber-brand-500 text-navy-900"
                    : "border-transparent text-navy-400 hover:text-navy-700",
                )}
              >
                <Icon className="size-4" aria-hidden />
                {item.label}
              </button>
            );
          })}
        </div>

        {tab === "integrations" ? (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {[
                ["Connected", integrations.filter((i) => i.status === "connected").length, "text-emerald-600"],
                ["Degraded", integrations.filter((i) => i.status === "degraded").length, "text-amber-brand-600"],
                ["Disconnected", integrations.filter((i) => i.status === "disconnected").length, "text-red-600"],
                ["Records synced", formatNumber(integrations.reduce((s, i) => s + i.recordsSynced, 0)), "text-navy-900"],
              ].map(([label, value, tone]) => (
                <div key={label as string} className="rounded-xl border border-navy-100 bg-white p-4">
                  <p className="text-xs text-navy-500">{label as string}</p>
                  <p className={cn("mt-1 font-serif text-2xl font-semibold", tone as string)}>
                    {value as string | number}
                  </p>
                </div>
              ))}
            </div>

            {loading ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
              </div>
            ) : (
              <div className="grid min-w-0 gap-4 lg:grid-cols-2">
                {integrations.map((integration) => (
                  <Card key={integration.id} className="min-w-0">
                    <CardBody className="min-w-0">
                      <div className="flex min-w-0 items-start justify-between gap-3">
                        <div className="flex min-w-0 gap-3">
                          <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-navy-50 text-navy-500">
                            <Globe className="size-4" aria-hidden />
                          </span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-navy-900">{integration.name}</p>
                            <p className="text-[11px] text-navy-400">{integration.subsidiary}</p>
                          </div>
                        </div>
                        <Badge tone={STATUS_TONES[integration.status]}>
                          <StatusDot tone={STATUS_TONES[integration.status]} />
                          {integration.status}
                        </Badge>
                      </div>

                      <p className="mt-3 text-xs leading-relaxed text-navy-500">{integration.description}</p>

                      <code className="mt-3 block overflow-hidden rounded-md bg-navy-50 px-2.5 py-1.5 text-[11px] text-ellipsis whitespace-nowrap text-navy-600">
                        {integration.endpoint}
                      </code>

                      <dl className="mt-3 grid grid-cols-3 gap-2 border-t border-navy-100 pt-3">
                        {[
                          ["Last sync", integration.status === "disconnected" ? "Failed" : relativeTime(integration.lastSyncAt)],
                          ["Records", formatNumber(integration.recordsSynced)],
                          ["Interval", integration.syncIntervalMinutes >= 60
                            ? `${Math.round(integration.syncIntervalMinutes / 60)}h`
                            : `${integration.syncIntervalMinutes}m`],
                        ].map(([label, value]) => (
                          <div key={label}>
                            <dt className="text-[10px] text-navy-400">{label}</dt>
                            <dd className="mt-0.5 truncate text-xs font-medium text-navy-800">{value}</dd>
                          </div>
                        ))}
                      </dl>
                    </CardBody>

                    <div className="flex gap-2 border-t border-navy-100 px-4 py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="flex-1"
                        disabled={syncing === integration.id}
                        onClick={() => void sync(integration)}
                      >
                        {syncing === integration.id ? (
                          <>
                            <Loader2 className="size-3.5 animate-spin" aria-hidden />
                            Syncing…
                          </>
                        ) : (
                          <>
                            <RefreshCw className="size-3.5" aria-hidden />
                            Sync now
                          </>
                        )}
                      </Button>
                      <Button variant="ghost" size="sm">Configure</Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        ) : null}

        {tab === "preferences" ? (
          <Card className="max-w-2xl">
            <CardHeader title="Display preferences" description="Applies to your account only" />
            <CardBody className="space-y-4">
              <div>
                <Label htmlFor="pref-language">Interface language</Label>
                <Select
                  id="pref-language"
                  value={prefs.language}
                  onChange={(e) => setPrefs({ ...prefs, language: e.target.value })}
                >
                  {["English", "हिन्दी (Hindi)", "বাংলা (Bengali)", "ଓଡ଼ିଆ (Odia)"].map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pref-density">Table density</Label>
                <Select
                  id="pref-density"
                  value={prefs.density}
                  onChange={(e) => setPrefs({ ...prefs, density: e.target.value })}
                >
                  {["Comfortable", "Compact"].map((d) => <option key={d} value={d}>{d}</option>)}
                </Select>
              </div>
              <div>
                <Label htmlFor="pref-timezone">Timezone</Label>
                <Select
                  id="pref-timezone"
                  value={prefs.timezone}
                  onChange={(e) => setPrefs({ ...prefs, timezone: e.target.value })}
                >
                  <option>Asia/Kolkata (IST)</option>
                  <option>UTC</option>
                </Select>
              </div>
              <div className="flex items-start justify-between gap-4 border-t border-navy-100 pt-4">
                <div>
                  <p className="text-[13px] font-medium text-navy-800">Auto-validate high-confidence fields</p>
                  <p className="mt-0.5 text-xs text-navy-500">
                    Fields extracted above 95% confidence bypass manual review
                  </p>
                </div>
                <Toggle
                  label="Auto-validate high-confidence fields"
                  checked={prefs.autoValidate}
                  onChange={(v) => setPrefs({ ...prefs, autoValidate: v })}
                />
              </div>
              <div className="flex justify-end border-t border-navy-100 pt-4">
                <Button onClick={() => notify({ tone: "success", title: "Preferences saved" })}>
                  <Check className="size-4" aria-hidden />
                  Save changes
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {tab === "notifications" ? (
          <Card className="max-w-2xl">
            <CardHeader title="Notification preferences" description="Choose what reaches your inbox" />
            <CardBody className="space-y-4">
              {[
                ["emailDigest", "Daily email digest", "A morning summary of pipeline activity and pending items"],
                ["criticalAlerts", "Critical alerts", "Immediate notification for overdue parliamentary queries and failed integrations"],
                ["weeklyReport", "Weekly performance report", "Subsidiary metrics and accuracy trends every Monday"],
              ].map(([key, label, help]) => (
                <div key={key} className="flex items-start justify-between gap-4 border-b border-navy-50 pb-4 last:border-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[13px] font-medium text-navy-800">{label}</p>
                    <p className="mt-0.5 text-xs text-navy-500">{help}</p>
                  </div>
                  <Toggle
                    label={label}
                    checked={prefs[key as "emailDigest" | "criticalAlerts" | "weeklyReport"]}
                    onChange={(v) => setPrefs({ ...prefs, [key]: v })}
                  />
                </div>
              ))}
              <div className="flex justify-end border-t border-navy-100 pt-4">
                <Button onClick={() => notify({ tone: "success", title: "Notification settings saved" })}>
                  Save changes
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : null}

        {tab === "data" ? (
          <Card className="max-w-2xl">
            <CardHeader title="Data & retention" description="Statutory retention and processing configuration" />
            <CardBody className="space-y-4">
              <div>
                <Label htmlFor="retention-docs">Document retention period</Label>
                <Select id="retention-docs" defaultValue="Permanent">
                  {["Permanent", "10 years", "7 years", "5 years"].map((r) => <option key={r} value={r}>{r}</option>)}
                </Select>
                <p className="mt-1.5 text-[11px] text-navy-400">
                  Source documents are retained permanently under CIL records policy.
                </p>
              </div>
              <div>
                <Label htmlFor="retention-audit">Audit log retention</Label>
                <Select id="retention-audit" defaultValue="7 years" disabled>
                  <option>7 years</option>
                </Select>
                <p className="mt-1.5 text-[11px] text-navy-400">
                  Fixed by statute — cannot be reduced by any role.
                </p>
              </div>
              <div>
                <Label htmlFor="ocr-threshold">OCR confidence threshold for auto-acceptance</Label>
                <TextInput id="ocr-threshold" type="number" defaultValue={95} min={70} max={100} />
                <p className="mt-1.5 text-[11px] text-navy-400">
                  Fields below this threshold are routed to human validation.
                </p>
              </div>
              <div className="flex justify-end border-t border-navy-100 pt-4">
                <Button onClick={() => notify({ tone: "success", title: "Data settings saved" })}>
                  Save changes
                </Button>
              </div>
            </CardBody>
          </Card>
        ) : null}
      </div>
    </>
  );
}
