import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { RoleOption } from "@/src/application/services/role-catalog";
import { ROLE_ILLUSTRATIONS } from "./role-illustrations";
import { cn } from "../ui/cn";

const ACCENTS = {
  navy: { number: "text-primary-300", statValue: "text-primary-600", rule: "bg-primary-500", ring: "hover:ring-primary-300/60" },
  gold: { number: "text-secondary-300", statValue: "text-secondary-600", rule: "bg-secondary-500", ring: "hover:ring-secondary-300/70" },
  leaf: { number: "text-leaf-100", statValue: "text-leaf-600", rule: "bg-leaf-500", ring: "hover:ring-leaf-400/60" },
  red: { number: "text-accent-200", statValue: "text-danger", rule: "bg-danger", ring: "hover:ring-danger/40" },
} as const;

export function RoleCard({
  role, tint, index, accent = false,
}: {
  role: RoleOption;
  tint: keyof typeof ACCENTS;
  index: string;
  accent?: boolean;
}) {
  const style = ACCENTS[tint];
  const Illustration = ROLE_ILLUSTRATIONS[role.id];

  return (
    <Link
      href={`/login?role=${role.id}`}
      className={cn(
        "card-raise group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-card ring-1 ring-transparent transition-all duration-500 hover:-translate-y-1.5 hover:card-float",
        style.ring,
        accent && "sm:flex-row sm:items-stretch",
      )}
    >
      <div
        className={cn(
          "relative overflow-hidden",
          accent ? "h-44 sm:h-auto sm:w-72 sm:shrink-0" : "h-44",
        )}
      >
        <Illustration />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-0/25 via-transparent to-transparent" />
        <span
          className={cn(
            "type-caption absolute top-4 left-4 font-mono text-[26px] leading-none font-semibold tracking-tight opacity-80 transition-opacity duration-500 group-hover:opacity-100",
            style.number,
          )}
        >
          {index}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col p-6">
        <h3 className="title-md text-ink-0">{role.label}</h3>
        <p className="type-caption mt-1.5 font-semibold tracking-wide text-muted uppercase">{role.tagline}</p>

        <p className="mt-4 flex-1 text-[13.5px] leading-relaxed text-body">
          {role.showcase.body}
        </p>

        <div className="mt-5 flex items-end justify-between gap-3 border-t border-hairline pt-4">
          <div className="flex gap-5">
            {role.showcase.stats.map(([value, label]) => (
              <div key={label}>
                <p className={cn("numeral text-[19px] leading-none", style.statValue)}>{value}</p>
                <p className="mt-1 max-w-[9rem] text-[10.5px] leading-tight text-muted-soft">{label}</p>
              </div>
            ))}
          </div>

          <span className="grid size-9 shrink-0 place-items-center rounded-full border border-hairline-strong text-ink-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-transparent group-hover:bg-ink-0 group-hover:text-white">
            <ArrowUpRight className="size-4" aria-hidden />
          </span>
        </div>
      </div>

      <div className={cn("absolute inset-x-0 bottom-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 group-hover:scale-x-100", style.rule)} aria-hidden />
    </Link>
  );
}
