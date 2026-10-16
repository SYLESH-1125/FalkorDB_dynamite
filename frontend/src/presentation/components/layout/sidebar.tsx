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
    <div className="flex h-full flex-col bg-ink-900 text-sand-300">
      <div className={cn("flex items-center gap-2.5 px-4 py-4", collapsed && "justify-center px-2")}>
        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-clay-500 font-serif text-sm font-bold text-white">
          C
        </span>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm leading-tight font-semibold text-white">CMPDI</p>
            <p className="truncate text-[10px] tracking-wide text-sand-500 uppercase">Coal India Limited</p>
          </div>
        ) : null}
      </div>

      <nav aria-label="Main navigation" className="scrollbar-thin flex-1 overflow-y-auto px-2 pb-4">
        {NAV_GROUPS.map((group) => {
          const items = NAV_ITEMS.filter((item) => item.group === group);
          return (
            <div key={group} className="mb-4">
              {!collapsed ? (
                <p className="px-2 pb-1.5 text-[10px] font-semibold tracking-wider text-ink-300 uppercase">
                  {group}
                </p>
              ) : (
                <div className="mx-auto mb-2 h-px w-6 bg-ink-600" aria-hidden />
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
                          "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-clay-500 font-medium text-white"
                            : "text-sand-400 hover:bg-ink-700 hover:text-white",
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
          className="hidden items-center gap-2.5 border-t border-ink-700 px-4 py-3 text-xs text-sand-500 hover:text-white lg:flex"
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
      <div className="absolute inset-0 bg-ink-900/50" onClick={onClose} aria-hidden />
      <div className="relative h-full w-[17rem] max-w-[82vw] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute top-4 -right-11 grid size-9 place-items-center rounded-lg bg-white text-ink-600 shadow"
        >
          <X className="size-4" aria-hidden />
        </button>
        <SidebarContent collapsed={false} onNavigate={onClose} />
      </div>
    </div>
  );
}
