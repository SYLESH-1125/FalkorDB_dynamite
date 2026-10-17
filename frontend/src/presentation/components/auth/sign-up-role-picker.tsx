"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { USER_ROLES } from "@/src/application/services/role-catalog";
import type { AppRole } from "@/src/domain/entities/user";
import { cn } from "../ui/cn";

const SIGN_UP_ROLES = USER_ROLES;

const ACCENT: Record<AppRole, string> = {
  parliamentary: "border-primary-400 bg-primary-50 text-primary-700",
  ministry: "border-secondary-400 bg-secondary-50 text-secondary-700",
  "domain-officer": "border-leaf-400 bg-leaf-50 text-leaf-700",
  admin: "border-danger/40 bg-tint-red text-danger",
};

export function SignUpRolePicker({
  activeRole,
  onRoleChange,
}: {
  activeRole?: AppRole;
  onRoleChange: (role: AppRole) => void;
}) {
  const searchParams = useSearchParams();
  const pathname = usePathname();

  function href(roleId: AppRole) {
    const q = new URLSearchParams(searchParams.toString());
    q.set("role", roleId);
    return `${pathname}?${q.toString()}`;
  }

  return (
    <div className="mt-5">
      <p className="text-[11.5px] font-medium text-muted">Register as</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {SIGN_UP_ROLES.map((role) => (
          <Link
            key={role.id}
            href={href(role.id)}
            onClick={() => onRoleChange(role.id)}
            className={cn(
              "rounded-full border px-3 py-1 text-[11.5px] font-semibold transition-all",
              activeRole === role.id ? ACCENT[role.id] : "border-hairline bg-surface-soft text-body hover:border-hairline-strong",
            )}
          >
            {role.label.split(" ")[0]}
          </Link>
        ))}
      </div>
    </div>
  );
}
