"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Menu, Search, Bell, ChevronDown, LogOut, User as UserIcon, Settings } from "lucide-react";
import { useSession } from "@/src/application/hooks/use-session";
import { useAsync } from "@/src/application/hooks/use-async";
import { repositories } from "@/src/application/services/container";
import { relativeTime } from "@/src/application/services/formatting";
import { cn } from "../ui/cn";
import { StatusDot } from "../ui/badge";
import bhumiLogo from "@/app/assets/bhumi-logo.png";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { session } = useSession();
  const user = session?.user;
  const { data: notifications } = useAsync(
    () => (user ? repositories.notifications.list() : Promise.resolve([])),
    [user?.id],
  );

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

  const notificationList = notifications ?? [];
  const unread = notificationList.filter((n) => !n.read);

  return (
    <header className="sticky top-0 z-70 border-b border-hairline bg-surface-card">
      <div className="flex h-16 items-center gap-3 px-3 sm:px-5">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation"
          className="grid size-9 shrink-0 place-items-center rounded-md text-body transition-colors hover:bg-surface-soft hover:text-ink-0 lg:hidden"
        >
          <Menu className="size-5" aria-hidden />
        </button>

        <Link href="/dashboard" className="shrink-0 lg:hidden">
          <Image src={bhumiLogo} alt="BHUMI" className="h-7 w-auto" priority />
        </Link>

        <div className="mx-auto hidden w-full max-w-xl md:block">
          <label htmlFor="global-search" className="sr-only">Search documents, reports and queries</label>
          <div className="relative">
            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-soft" aria-hidden />
            <input
              id="global-search"
              type="search"
              autoComplete="off"
              placeholder="Search documents, reports, queries…"
              className="h-9 w-full rounded-md border border-hairline bg-surface-soft pr-3 pl-9 text-[13.5px] text-ink-0 placeholder:text-muted-soft focus:border-primary-400 focus:bg-surface-card focus:outline-none"
            />
          </div>
        </div>

        <div ref={wrapper} className="ml-auto flex items-center gap-1">
          <button
            type="button"
            aria-label="Search"
            className="grid size-9 place-items-center rounded-md text-body transition-colors hover:bg-surface-soft hover:text-ink-0 md:hidden"
          >
            <Search className="size-4.5" aria-hidden />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => { setNotifOpen((v) => !v); setProfileOpen(false); }}
              aria-label={`Notifications, ${unread.length} unread`}
              aria-expanded={notifOpen}
              className="relative grid size-9 place-items-center rounded-md text-body transition-colors hover:bg-surface-soft hover:text-ink-0"
            >
              <Bell className="size-4.5" aria-hidden />
              {unread.length > 0 ? (
                <span className="absolute top-1 right-1 grid size-4 place-items-center rounded-full bg-danger text-[9px] font-semibold text-white">
                  {unread.length}
                </span>
              ) : null}
            </button>

            {notifOpen ? (
              <div className="card-raise absolute right-0 mt-2 w-[min(21rem,calc(100vw-1.5rem))] overflow-hidden rounded-lg border border-hairline bg-surface-card">
                <div className="flex items-center justify-between border-b border-hairline px-4 py-3">
                  <p className="title-sm text-ink-0">Notifications</p>
                  <Link href="/notifications" onClick={() => setNotifOpen(false)} className="text-[12px] font-medium text-primary-600 hover:underline">
                    View all
                  </Link>
                </div>
                <ul className="scrollbar-thin max-h-80 overflow-y-auto">
                  {notificationList.slice(0, 5).map((n) => (
                    <li key={n.id} className="border-b border-hairline last:border-0">
                      <Link
                        href={n.link ?? "/notifications"}
                        onClick={() => setNotifOpen(false)}
                        className={cn("block px-4 py-3 transition-colors hover:bg-surface-soft", !n.read && "bg-primary-50/50")}
                      >
                        <div className="flex items-center gap-1.5">
                          <StatusDot tone={n.severity === "critical" ? "danger" : n.severity === "warning" ? "warning" : n.severity === "success" ? "success" : "info"} />
                          <p className="title-sm truncate text-ink-0">{n.title}</p>
                        </div>
                        <p className="mt-1 line-clamp-2 pl-3 text-[12.5px] text-body">{n.body}</p>
                        <p className="mt-1 pl-3 text-[11px] text-muted-soft">{relativeTime(n.createdAt)}</p>
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
              className="flex items-center gap-2 rounded-md py-1 pr-2 pl-1 transition-colors hover:bg-surface-soft"
            >
              <span className="grid size-7 place-items-center rounded-md bg-primary-600 text-[11px] font-semibold text-white">
                {user ? user.name.split(" ").map((p) => p[0]).slice(0, 2).join("") : ""}
              </span>
              <span className="hidden text-left sm:block">
                <span className="block max-w-32 truncate text-[12.5px] font-medium text-ink-0">{user?.name}</span>
                <span className="block text-[11px] text-muted">{user?.role}</span>
              </span>
              <ChevronDown className="hidden size-3.5 text-muted-soft sm:block" aria-hidden />
            </button>

            {profileOpen && user ? (
              <div className="card-raise absolute right-0 mt-2 w-64 overflow-hidden rounded-lg border border-hairline bg-surface-card">
                <div className="border-b border-hairline px-4 py-3">
                  <p className="title-sm text-ink-0">{user.name}</p>
                  <p className="mt-0.5 truncate text-[12px] text-body">{user.email}</p>
                  <p className="mt-1 text-[11.5px] text-muted">{user.designation}</p>
                </div>
                <ul className="py-2">
                  {user.role === "Administrator" ? (
                    <li>
                      <Link href="/users" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-body transition-colors hover:bg-surface-soft hover:text-ink-0">
                        <UserIcon className="size-4" aria-hidden /> My profile
                      </Link>
                    </li>
                  ) : null}
                  {user.role === "Administrator" ? (
                    <li>
                      <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-body transition-colors hover:bg-surface-soft hover:text-ink-0">
                        <Settings className="size-4" aria-hidden /> Settings
                      </Link>
                    </li>
                  ) : null}
                  <li className="mt-1 border-t border-hairline pt-1">
                    <button
                      type="button"
                      onClick={async () => {
                        setProfileOpen(false);
                        await repositories.auth.signOut();
                        router.push("/select-role");
                      }}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-[13px] text-danger transition-colors hover:bg-danger/5"
                    >
                      <LogOut className="size-4" aria-hidden /> Sign out
                    </button>
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
