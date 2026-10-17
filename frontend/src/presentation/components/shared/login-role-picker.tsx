"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ADMIN_ROLE, USER_ROLES } from "@/src/application/services/role-catalog";
import type { AppRole } from "@/src/domain/entities/user";
import { cn } from "../ui/cn";

const ROLES = [...USER_ROLES, ADMIN_ROLE];

const ACCENT: Record<AppRole, string> = {
  parliamentary: "border-primary-400 bg-primary-50 text-primary-700",
  ministry: "border-secondary-400 bg-secondary-50 text-secondary-700",
  "domain-officer": "border-leaf-400 bg-leaf-50 text-leaf-700",
  admin: "border-danger/40 bg-tint-red text-danger",
};

export function LoginRolePicker({ activeRole }: { activeRole?: AppRole }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const next = searchParams.get("next");

  function href(roleId: AppRole) {
    const q = new URLSearchParams();
    q.set("role", roleId);
    if (next) q.set("next", next);
    return `${pathname}?${q.toString()}`;
  }

  return (
    <div className="mt-5">
      <p className="text-[11.5px] font-medium text-muted">Continue as</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {ROLES.map((role) => (
          <Link
            key={role.id}
            href={href(role.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-all",
              activeRole === role.id ? ACCENT[role.id] : "border-hairline bg-surface-soft text-body hover:border-hairline-strong",
            )}
          >
            {role.id === "parliamentary" ? "Parliament" : role.id === "ministry" ? "Ministry" : role.id === "domain-officer" ? "CMPDI" : "Admin"}
          </Link>
        ))}
      </div>
    </div>
  );
}
