"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "@/src/application/hooks/use-session";
import { NAV_ITEMS, ADMIN_ONLY_GROUPS } from "./nav-items";
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

  useEffect(() => {
    if (loading) return;
    if (!session) {
      router.replace("/select-role");
      return;
    }
    if (!isAdministrator && ADMIN_ONLY_PATHS.has(pathname)) {
      router.replace("/dashboard");
    }
  }, [loading, session, isAdministrator, pathname, router]);

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside
        className={cn(
          "sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarContent
          collapsed={collapsed}
          isAdministrator={isAdministrator}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
      </aside>

      <MobileSidebar
        open={mobileOpen}
        isAdministrator={isAdministrator}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMobileOpen(true)} />
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
