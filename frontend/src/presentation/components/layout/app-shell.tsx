"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/src/application/hooks/use-session";
import {
  NAV_ITEMS, ADMIN_ONLY_GROUPS, PARLIAMENTARY_ALLOWED_PATHS, DOMAIN_OFFICER_ALLOWED_PATHS,
  MINISTRY_ALLOWED_PATHS,
} from "./nav-items";
import { SidebarContent, MobileSidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { GraphAmbient } from "../shared/graph-ambient";
import { GraphFlowRail } from "../shared/graph-flow-rail";
import { cn } from "../ui/cn";

const ADMIN_ONLY_PATHS = new Set(
  NAV_ITEMS.filter((item) => ADMIN_ONLY_GROUPS.has(item.group)).map((item) => item.href),
);

// allows both exact matches and nested routes under an allowed path (e.g. /reports
// covers /reports/abc123/edit — a dynamic report id, not a literal listable path)
function isAllowedPath(pathname: string, allowed: Set<string>): boolean {
  if (allowed.has(pathname)) return true;
  for (const path of allowed) {
    if (pathname.startsWith(`${path}/`)) return true;
  }
  return false;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const isAdministrator = session?.user.role === "Administrator";
  const isParliamentary = session?.user.appRole === "parliamentary";
  const isDomainOfficer = session?.user.appRole === "domain-officer";
  const isMinistry = session?.user.appRole === "ministry";

  useEffect(() => {
    if (loading) return;
    if (!session) {
      const next = encodeURIComponent(pathname);
      router.replace(`/login?next=${next}`);
      return;
    }
    if (isParliamentary && !isAllowedPath(pathname, PARLIAMENTARY_ALLOWED_PATHS)) {
      router.replace("/query");
      return;
    }
    if (isDomainOfficer && !isAllowedPath(pathname, DOMAIN_OFFICER_ALLOWED_PATHS)) {
      router.replace("/brain");
      return;
    }
    if (isMinistry && !isAllowedPath(pathname, MINISTRY_ALLOWED_PATHS)) {
      router.replace("/reports");
      return;
    }
    if (!isAdministrator && ADMIN_ONLY_PATHS.has(pathname)) {
      router.replace("/dashboard");
    }
  }, [loading, session, isAdministrator, isParliamentary, isDomainOfficer, isMinistry, pathname, router]);

  return (
    <div className="flex h-screen overflow-hidden bg-canvas">
      <aside
        className={cn(
          "hidden h-full shrink-0 transition-[width] duration-200 lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          isAdministrator={isAdministrator}
          isParliamentary={isParliamentary}
          isDomainOfficer={isDomainOfficer}
          isMinistry={isMinistry}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      <MobileSidebar
        open={mobileOpen}
        isAdministrator={isAdministrator}
        isParliamentary={isParliamentary}
        isDomainOfficer={isDomainOfficer}
        isMinistry={isMinistry}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="relative min-h-0 min-w-0 flex-1 overflow-y-auto">
          <GraphAmbient variant="app" className="opacity-35" />
          <GraphFlowRail />
          <div className="relative">{children}</div>
        </main>
      </div>
    </div>
  );
}
