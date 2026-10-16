"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCheck, Info, CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime, formatLabel } from "@/src/application/services/formatting";
import type { NotificationSeverity } from "@/src/domain/entities/notification";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge, type BadgeTone } from "../components/ui/badge";
import { Skeleton } from "../components/ui/skeleton";
import { EmptyState } from "../components/ui/empty-state";
import { useToast } from "../components/ui/toast";
import { cn } from "../components/ui/cn";

const SEVERITY_TONES: Record<NotificationSeverity, BadgeTone> = {
  critical: "danger", warning: "warning", success: "success", info: "info",
};

const SEVERITY_ICONS: Record<NotificationSeverity, typeof Info> = {
  critical: AlertOctagon, warning: AlertTriangle, success: CheckCircle2, info: Info,
};

const FILTERS = ["all", "unread", "critical", "warning", "success", "info"];

export function NotificationsView() {
  const { notify } = useToast();
  const { data, loading, setData } = useAsync(() => repositories.notifications.list(), []);
  const [filter, setFilter] = useState("all");

  const notifications = data ?? [];
  const unread = notifications.filter((n) => !n.read).length;

  const visible = notifications.filter((n) => {
    if (filter === "all") return true;
    if (filter === "unread") return !n.read;
    return n.severity === filter;
  });

  async function markRead(id: string) {
    setData(await repositories.notifications.markRead(id));
  }

  async function markAllRead() {
    setData(await repositories.notifications.markAllRead());
    notify({ tone: "success", title: "All notifications marked as read" });
  }

  return (
    <>
      <PageHeader
        title="Notifications & Alerts"
        description="Pipeline events, deadlines and system messages requiring your attention."
        breadcrumbs={[{ label: "Administration" }, { label: "Notifications" }]}
        action={
          <Button variant="secondary" onClick={() => void markAllRead()} disabled={unread === 0}>
            <CheckCheck className="size-4" aria-hidden />
            Mark all read
          </Button>
        }
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            ["Unread", unread, "text-link"],
            ["Critical", notifications.filter((n) => n.severity === "critical").length, "text-danger"],
            ["Warnings", notifications.filter((n) => n.severity === "warning").length, "text-link"],
            ["Total", notifications.length, "text-ink-0"],
          ].map(([label, value, tone]) => (
            <div key={label as string} className=" card-raise rounded-xl border border-hairline bg-surface-card p-4">
              <p className="type-caption text-muted">{label as string}</p>
              <p className={cn("mt-1 numeral text-2xl", tone as string)}>{value as number}</p>
            </div>
          ))}
        </div>

        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "shrink-0 px-3.5 py-1.5 text-xs font-normal whitespace-nowrap transition-colors",
                filter === item
                  ? "bg-surface-card text-ink-0"
                  : "border border-hairline-strong bg-surface-card text-body hover:bg-surface-soft",
              )}
            >
              {item === "all" ? "All" : item[0].toUpperCase() + item.slice(1)}
              {item === "unread" && unread > 0 ? (
                <span className="numeral ml-2 rounded-full bg-primary-600 px-1.5 text-[10px] text-white">{unread}</span>
              ) : null}
            </button>
          ))}
        </div>

        <Card>
          <CardHeader title="Inbox" description={`${visible.length} notification${visible.length === 1 ? "" : "s"}`} />
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : visible.length === 0 ? (
            <EmptyState title="Nothing here" description="No notifications match the selected filter." />
          ) : (
            <ul className="divide-y divide-hairline">
              {visible.map((item) => {
                const Icon = SEVERITY_ICONS[item.severity];
                return (
                  <li
                    key={item.id}
                    className={cn("flex gap-3 px-4 py-3.5 sm:px-5", !item.read && "bg-surface-elevated/30")}
                  >
                    <span
                      className={cn(
                        "mt-0.5 grid size-8 shrink-0 place-items-center ",
                        item.severity === "critical" && "bg-danger/10 text-danger",
                        item.severity === "warning" && "bg-surface-elevated text-link",
                        item.severity === "success" && "bg-success/10 text-success",
                        item.severity === "info" && "bg-surface-soft text-muted",
                      )}
                    >
                      <Icon className="size-4" aria-hidden />
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn("text-[13px]", item.read ? "font-normal text-body" : "font-normal text-ink-0")}>
                          {item.title}
                        </p>
                        <Badge tone={SEVERITY_TONES[item.severity]}>{formatLabel(item.severity)}</Badge>
                        {!item.read ? <span className="size-1.5 rounded-full bg-primary-600" aria-label="Unread" /> : null}
                      </div>
                      <p className="mt-1 text-xs leading-relaxed text-muted">{item.body}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span className="type-caption text-muted-soft">
                          {item.source} · {relativeTime(item.createdAt)}
                        </span>
                        {item.link ? (
                          <Link
                            href={item.link}
                            className="inline-flex items-center gap-0.5 text-[11px] font-normal text-link hover:underline"
                          >
                            View
                            <ArrowRight className="size-3" aria-hidden />
                          </Link>
                        ) : null}
                        {!item.read ? (
                          <button
                            type="button"
                            onClick={() => void markRead(item.id)}
                            className="type-caption text-muted transition-colors hover:text-ink-0"
                          >
                            Mark as read
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
