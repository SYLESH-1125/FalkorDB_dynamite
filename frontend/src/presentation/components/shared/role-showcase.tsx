import { ShieldCheck, Sparkles } from "lucide-react";
import type { AppRole } from "@/src/domain/entities/user";
import type { RoleOption } from "@/src/application/services/role-catalog";
import { ROLE_ILLUSTRATIONS } from "./role-illustrations";
import { cn } from "../ui/cn";

const ACCENT_BY_ROLE: Record<AppRole, { chip: string; value: string; rule: string }> = {
  parliamentary: { chip: "text-primary-300", value: "text-white", rule: "bg-primary-300" },
  ministry: { chip: "text-secondary-300", value: "text-white", rule: "bg-secondary-400" },
  "domain-officer": { chip: "text-leaf-100", value: "text-white", rule: "bg-leaf-400" },
  admin: { chip: "text-accent-200", value: "text-white", rule: "bg-accent-400" },
};

export function RoleShowcase({ role }: { role: RoleOption }) {
  const Illustration = ROLE_ILLUSTRATIONS[role.id];
  const accent = ACCENT_BY_ROLE[role.id];

  return (
    <div className="relative hidden flex-col overflow-hidden lg:flex">
      <div className="relative h-56 shrink-0 overflow-hidden">
        <Illustration />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#0c2338]" />
        <span className="absolute top-6 left-6 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11.5px] font-medium text-white ring-1 ring-white/15 backdrop-blur-sm">
          <Sparkles className="size-3" aria-hidden />
          Government of India
        </span>
      </div>

      <div className="gradient-navy flex flex-1 flex-col justify-between p-9">
        <div>
          <p className={cn("type-caption font-semibold tracking-[0.14em] uppercase", accent.chip)}>
            {role.showcase.eyebrow}
          </p>
          <h2 className="display-sm mt-2.5 text-white">{role.showcase.headline}</h2>
          <p className="mt-3.5 text-[14px] leading-relaxed text-white/70">{role.showcase.body}</p>
        </div>

        <div className="mt-10">
          <div className={cn("h-px w-10", accent.rule)} aria-hidden />
          <div className="mt-5 grid grid-cols-2 gap-4">
            {role.showcase.stats.map(([value, label]) => (
              <div key={label}>
                <p className={cn("numeral text-[26px] leading-none", accent.value)}>{value}</p>
                <p className="mt-1.5 text-[12px] leading-snug text-white/60">{label}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 flex items-start gap-2 border-t border-white/10 pt-4 text-[11.5px] leading-relaxed text-white/55">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
            Authorised personnel only. All access is logged and subject to audit under
            information security policy.
          </p>
        </div>
      </div>
    </div>
  );
}
