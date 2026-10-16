import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";
import type { RoleOption } from "@/src/application/services/role-catalog";
import { cn } from "../ui/cn";

const TINTS = {
  navy: { chip: "bg-tint-navy text-primary-600", ring: "group-hover:ring-primary-300", glow: "bg-primary-400/25" },
  gold: { chip: "bg-tint-gold text-secondary-600", ring: "group-hover:ring-secondary-300", glow: "bg-secondary-400/25" },
  leaf: { chip: "bg-tint-leaf text-success", ring: "group-hover:ring-success/40", glow: "bg-success/20" },
  red: { chip: "bg-tint-red text-danger", ring: "group-hover:ring-danger/40", glow: "bg-danger/20" },
} as const;

export function RoleCard({
  role, icon: Icon, tint, accent = false,
}: {
  role: RoleOption;
  icon: LucideIcon;
  tint: keyof typeof TINTS;
  accent?: boolean;
}) {
  const style = TINTS[tint];
  return (
    <Link
      href={`/login?role=${role.id}`}
      className={cn(
        "card-raise group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-card p-6 ring-1 ring-transparent transition-all duration-300 hover:-translate-y-1 hover:card-float",
        style.ring,
        accent && "ring-secondary-300",
      )}
    >
      <div
        className={cn("pointer-events-none absolute -top-10 -right-10 size-40 rounded-full blur-3xl transition-opacity duration-300 opacity-60 group-hover:opacity-100", style.glow)}
        aria-hidden
      />

      <div className="relative">
        <span className={cn("grid size-12 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-105", style.chip)}>
          <Icon className="size-6" aria-hidden />
        </span>
        <h3 className="title-md mt-5 text-ink-0">{role.label}</h3>
        <p className="mt-2 text-[13px] leading-relaxed text-body">{role.tagline}</p>

        <div className="mt-5 flex flex-wrap gap-1.5 border-t border-hairline pt-4">
          {role.showcase.stats.map(([value, label]) => (
            <span key={label} className="rounded-full bg-surface-soft px-2.5 py-1 text-[11px] font-medium text-body-strong">
              <span className="font-semibold text-ink-0">{value}</span> {label}
            </span>
          ))}
        </div>

        <span className="mt-5 inline-flex items-center gap-1.5 text-[13.5px] font-semibold text-primary-600 group-hover:gap-2.5">
          Continue
          <ArrowRight className="size-4 transition-all" aria-hidden />
        </span>
      </div>
    </Link>
  );
}
