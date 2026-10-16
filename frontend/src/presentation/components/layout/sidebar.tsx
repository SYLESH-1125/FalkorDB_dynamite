"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { NAV_ITEMS, NAV_GROUPS } from "./nav-items";
import { cn } from "../ui/cn";

export function SidebarContent({
  collapsed, onNavigate, onToggleCollapse,
}: {
  collapsed: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex h-full flex-col border-r border-hairline bg-surface-soft">
      <div className={cn("flex h-16 items-center gap-2.5 px-4", collapsed && "justify-center px-2")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-600 text-[13px] font-semibold text-white">
          C
        </span>
        {!collapsed ? (
          <Link href="/dashboard" className="min-w-0">
            <p className="type-wordmark truncate text-ink-0">BHUMI</p>
            <p className="truncate text-[11.5px] text-muted">Unified Mining Intelligence</p>
          </Link>
        ) : null}
      </div>

      <nav aria-label="Main navigation" className="scrollbar-thin flex-1 overflow-y-auto px-2.5 pb-4">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group);
          return (
            <div key={group} className="mb-5">
              {!collapsed ? (
                <p className="px-2.5 pb-1.5 text-[11px] font-medium tracking-wide text-muted-soft uppercase">
                  {group}
                </p>
              ) : (
                <div className="mx-auto mb-2 h-px w-5 bg-hairline-strong" aria-hidden />
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "type-nav flex items-center gap-2.5 rounded-lg px-2.5 py-2 transition-colors",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-primary-100 font-semibold text-primary-700"
                            : "text-body hover:bg-surface-card hover:text-ink-0",
                        )}
                      >
                        <Icon className="size-4 shrink-0" aria-hidden />
                        {!collapsed ? <span className="truncate">{item.label}</span> : null}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {onToggleCollapse ? (
        <button
          type="button"
          onClick={onToggleCollapse}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden items-center gap-2.5 border-t border-hairline px-4 py-3 text-[12.5px] font-medium text-muted transition-colors hover:text-ink-0 lg:flex"
        >
          {collapsed ? (
            <PanelLeftOpen className="size-4" aria-hidden />
          ) : (
            <>
              <PanelLeftClose className="size-4" aria-hidden />
              <span>Collapse</span>
            </>
          )}
        </button>
      ) : null}
    </div>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-80 lg:hidden">
      <div className="absolute inset-0 bg-ink-0/25" onClick={onClose} aria-hidden />
      <div className="relative h-full w-[17rem] max-w-[82vw] card-float">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="card-raise absolute top-4 -right-11 grid size-9 place-items-center rounded-lg bg-surface-card text-body"
        >
          <X className="size-4" aria-hidden />
        </button>
        <SidebarContent collapsed={false} onNavigate={onClose} />
      </div>
    </div>
  );
}
