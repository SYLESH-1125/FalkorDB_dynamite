import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { RoleOption } from "@/src/application/services/role-catalog";
import { cn } from "../ui/cn";

const TINTS = {
  navy: "bg-tint-navy text-primary-500",
  gold: "bg-tint-gold text-secondary-600",
  leaf: "bg-tint-leaf text-success",
  red: "bg-tint-red text-danger",
} as const;

export function RoleCard({
  role, icon: Icon, tint, accent = false,
}: {
  role: RoleOption;
  icon: LucideIcon;
  tint: keyof typeof TINTS;
  accent?: boolean;
}) {
  return (
    <Link
      href={`/login?role=${role.id}`}
      className={cn(
        "card-raise group flex h-full flex-col rounded-2xl border border-hairline bg-surface-card p-6 transition-all hover:-translate-y-0.5 hover:card-float",
        accent && "ring-1 ring-inset ring-secondary-300",
      )}
    >
      <span className={cn("grid size-11 place-items-center rounded-xl", TINTS[tint])}>
        <Icon className="size-5.5" aria-hidden />
      </span>
      <h3 className="title-md mt-5 text-ink-0">{role.label}</h3>
      <p className="mt-2 text-[13px] leading-relaxed text-body">{role.tagline}</p>

      <div className="mt-5 border-t border-hairline pt-4">
        <p className="text-[12px] font-medium text-body-strong">{role.footnote}</p>
      </div>

      <span className="mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium text-primary-600 group-hover:gap-2.5">
        Continue
        <ArrowRight className="size-3.5 transition-all" aria-hidden />
      </span>
    </Link>
  );
}
