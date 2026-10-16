"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, Bell, ChevronDown, LogOut, User as UserIcon, Settings } from "lucide-react";
import { CURRENT_USER } from "@/src/infrastructure/mock/data";
import { NOTIFICATIONS } from "@/src/infrastructure/mock/data";
import { relativeTime } from "@/src/application/services/formatting";
import { cn } from "../ui/cn";
import { StatusDot } from "../ui/badge";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapper.current?.contains(e.target as Node)) {
        setNotifOpen(false);
        setProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const unread = NOTIFICATIONS.filter((n) => !n.read);

  return (
    <header className="sticky top-0 z-70 border-b border-sand-300 bg-white/85 backdrop-blur">
      <div className="flex h-14 items-center gap-3 px-3 sm:px-5">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="grid size-9 shrink-0 place-items-center rounded-lg text-ink-500 hover:bg-sand-200 lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>

        <Link href="/dashboard" className="shrink-0 lg:hidden">
          <span className="font-serif text-base font-semibold text-ink-800">CMPDI</span>
        </Link>

        <div className="mx-auto hidden w-full max-w-xl md:block">
          <label htmlFor="global-search" className="sr-only">Search documents, reports and queries</label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-sand-500" aria-hidden />
            <input
              id="global-search"
              type="search"
              placeholder="Search documents, reports, queries…"
              className="h-9 w-full rounded-[2px] border border-sand-400 bg-sand-200/70 pr-3 pl-9 text-sm text-ink-800 placeholder:text-sand-500 focus:border-clay-400 focus:bg-white"
            />
          </div>
        </div>

        <div ref={wrapper} className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            className="grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-sand-200 md:hidden"
          >
            <Search className="size-4.5" aria-hidden />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              aria-label={`Notifications, ${unread.length} unread`}
              aria-expanded={notifOpen}
              className="relative grid size-9 place-items-center rounded-lg text-ink-500 hover:bg-sand-200"
            >
              <Bell className="size-4.5" aria-hidden />
              {unread.length > 0 ? (
                <span className="absolute top-1.5 right-1.5 grid size-4 place-items-center rounded-[2px] bg-clay-500 text-[9px] font-bold text-white">
                  {unread.length}
                </span>
              ) : null}
            </button>

            {notifOpen ? (
              <div className="absolute right-0 mt-2 w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-xl border border-sand-300 bg-white shadow-xl">
                <div className="flex items-center justify-between border-b border-sand-300 px-4 py-2.5">
                  <p className="text-sm font-semibold text-ink-800">Notifications</p>
                  <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-xs text-clay-600 hover:underline">
                    View all
                  </Link>
                </div>
                <ul className="scrollbar-thin max-h-80 overflow-y-auto">
                  {NOTIFICATIONS.slice(0, 5).map((n) => (
                    <li key={n.id} className="border-b border-sand-200 last:border-0">
                      <Link
                        href={n.link ?? "/notifications"}
                        onClick={() => setNotifOpen(false)}
                        className={cn("block px-4 py-2.5 hover:bg-sand-200", !n.read && "bg-clay-50/40")}
                      >
                        <div className="flex items-center gap-1.5">
                          <StatusDot tone={n.severity === "critical" ? "danger" : n.severity === "warning" ? "warning" : n.severity === "success" ? "success" : "info"} />
                          <p className="truncate text-[13px] font-medium text-ink-800">{n.title}</p>
                        </div>
                        <p className="mt-0.5 line-clamp-2 pl-3 text-xs text-ink-400">{n.body}</p>
                        <p className="mt-1 pl-3 text-[10px] text-sand-500">{relativeTime(n.createdAt)}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <div className="relative">
            <button
              type="button"
              onClick={() => { setProfileOpen((v) => !v); setNotifOpen(false); }}
              aria-expanded={profileOpen}
              aria-label="Account menu"
              className="flex items-center gap-2 rounded-lg py-1 pr-1.5 pl-1 hover:bg-sand-200"
            >
              <span className="grid size-7 place-items-center rounded-[2px] bg-ink-800 text-[11px] font-semibold text-white">
                {CURRENT_USER.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-32 truncate text-xs font-medium text-ink-800">{CURRENT_USER.name}</span>
                <span className="block text-[10px] text-ink-300">{CURRENT_USER.role}</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-ink-300 sm:block" aria-hidden />
            </button>

            {profileOpen ? (
              <div className="absolute right-0 mt-2 w-60 overflow-hidden rounded-xl border border-sand-300 bg-white shadow-xl">
                <div className="border-b border-sand-300 px-4 py-3">
                  <p className="text-sm font-medium text-ink-800">{CURRENT_USER.name}</p>
                  <p className="truncate text-xs text-ink-300">{CURRENT_USER.email}</p>
                  <p className="mt-1 text-[11px] text-ink-400">{CURRENT_USER.designation}</p>
                </div>
                <ul className="py-1 text-sm">
                  <li>
                    <Link href="/users" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-ink-600 hover:bg-sand-200">
                      <UserIcon className="size-4" aria-hidden /> My profile
                    </Link>
                  </li>
                  <li>
                    <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-ink-600 hover:bg-sand-200">
                      <Settings className="size-4" aria-hidden /> Settings
                    </Link>
                  </li>
                  <li className="border-t border-sand-300">
                    <Link href="/login" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50">
                      <LogOut className="size-4" aria-hidden /> Sign out
                    </Link>
                  </li>
                </ul>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
