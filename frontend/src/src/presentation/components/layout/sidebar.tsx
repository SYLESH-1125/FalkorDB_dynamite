"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import {
  NAV_ITEMS, NAV_GROUPS, ADMIN_ONLY_GROUPS,
  PARLIAMENTARY_ALLOWED_PATHS, PARLIAMENTARY_ONLY_PATHS, DOMAIN_OFFICER_ALLOWED_PATHS,
  DOMAIN_OFFICER_ONLY_PATHS, MINISTRY_ALLOWED_PATHS,
} from "./nav-items";
import { cn } from "../ui/cn";
import bhumiLogo from "@/app/assets/bhumi-logo.png";

export function SidebarContent({
  collapsed, isAdministrator = false, isParliamentary = false, isDomainOfficer = false, isMinistry = false,
  onNavigate, onToggleCollapse,
}: {
  collapsed: boolean;
  isAdministrator?: boolean;
  isParliamentary?: boolean;
  isDomainOfficer?: boolean;
  isMinistry?: boolean;
  onNavigate?: () => void;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const groups = NAV_GROUPS.filter((group) => isAdministrator || !ADMIN_ONLY_GROUPS.has(group));
  const navItems = isParliamentary
    ? NAV_ITEMS.filter((item) => PARLIAMENTARY_ALLOWED_PATHS.has(item.href))
    : isDomainOfficer
      ? NAV_ITEMS.filter((item) => DOMAIN_OFFICER_ALLOWED_PATHS.has(item.href))
      : isMinistry
        ? NAV_ITEMS.filter((item) => MINISTRY_ALLOWED_PATHS.has(item.href))
        : NAV_ITEMS.filter((item) => !PARLIAMENTARY_ONLY_PATHS.has(item.href) && !DOMAIN_OFFICER_ONLY_PATHS.has(item.href));

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className={cn("flex h-16 items-center gap-2.5 border-b border-sidebar-border bg-white px-4", collapsed && "justify-center px-2")}>
        <Image src={bhumiLogo} alt="BHUMI" width={collapsed ? 32 : 120} height={32} className="h-8 w-auto shrink-0 object-contain" priority />
        {!collapsed ? (
          <Link href="/brain" className="min-w-0">
            <p className="truncate text-[11.5px] font-medium text-ink-0">Company Brain</p>
          </Link>
        ) : null}
      </div>

      <nav aria-label="Main navigation" className="scrollbar-thin flex-1 overflow-y-auto px-2.5 pb-4 pt-3">
        {groups.map((group) => {
          const items = navItems.filter((item) => item.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-5">
              {!collapsed ? (
                <p className="px-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-sidebar-text-muted uppercase">
                  {group}
                </p>
              ) : (
                <div className="mx-auto mb-2 h-px w-5 bg-sidebar-border" aria-hidden />
              )}
              <ul className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href
                    || (pathname.startsWith(`${item.href}/`) && !navItems.some((other) => other.href === pathname));
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        aria-current={active ? "page" : undefined}
                        title={collapsed ? item.label : undefined}
                        className={cn(
                          "type-nav flex items-center gap-2.5 rounded-md px-2.5 py-2 transition-colors",
                          collapsed && "justify-center px-0",
                          active
                            ? "bg-sidebar-active-bg font-semibold text-sidebar-active-text"
                            : "text-sidebar-text hover:bg-sidebar-raised hover:text-white",
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
          className="hidden items-center gap-2.5 border-t border-sidebar-border px-4 py-3 text-[12.5px] font-medium text-sidebar-text-muted transition-colors hover:text-white lg:flex"
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

export function MobileSidebar({
  open, isAdministrator, isParliamentary, isDomainOfficer, isMinistry, onClose,
}: {
  open: boolean;
  isAdministrator?: boolean;
  isParliamentary?: boolean;
  isDomainOfficer?: boolean;
  isMinistry?: boolean;
  onClose: () => void;
}) {
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
        <SidebarContent
          collapsed={false}
          isAdministrator={isAdministrator}
          isParliamentary={isParliamentary}
          isDomainOfficer={isDomainOfficer}
          isMinistry={isMinistry}
          onNavigate={onClose}
        />
      </div>
    </div>
  );
}
