"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/src/application/hooks/use-session";
import { NAV_ITEMS, ADMIN_ONLY_GROUPS, PARLIAMENTARY_ALLOWED_PATHS, DOMAIN_OFFICER_ALLOWED_PATHS } from "./nav-items";
import { SidebarContent, MobileSidebar } from "./sidebar";
import { Topbar } from "./topbar";
import { cn } from "../ui/cn";

const ADMIN_ONLY_PATHS = new Set(
  NAV_ITEMS.filter((item) => ADMIN_ONLY_GROUPS.has(item.group)).map((item) => item.href),
);

export function AppShell({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { session, loading } = useSession();
  const isAdministrator = session?.user.role === "Administrator";
  const isParliamentary = session?.user.appRole === "parliamentary";
  const isDomainOfficer = session?.user.appRole === "domain-officer";

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/select-role");
      return;
    }
    if (isParliamentary && !PARLIAMENTARY_ALLOWED_PATHS.has(pathname)) {
      router.replace("/query");
      return;
    }
    if (isDomainOfficer && !DOMAIN_OFFICER_ALLOWED_PATHS.has(pathname)) {
      router.replace("/topics");
      return;
    }
    if (!isAdministrator && ADMIN_ONLY_PATHS.has(pathname)) {
      router.replace("/dashboard");
    }
  }, [loading, session, isAdministrator, isParliamentary, isDomainOfficer, pathname, router]);

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
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      <MobileSidebar
        open={mobileOpen}
        isAdministrator={isAdministrator}
        isParliamentary={isParliamentary}
        isDomainOfficer={isDomainOfficer}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
