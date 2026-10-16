import { Landmark, LineChart, ClipboardCheck, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AppRole } from "@/src/domain/entities/user";
import type { RoleOption } from "@/src/application/services/role-catalog";

const ICON_BY_ROLE: Record<AppRole, LucideIcon> = {
  parliamentary: Landmark,
  ministry: LineChart,
  "domain-officer": ClipboardCheck,
  admin: ShieldCheck,
};

export function RoleShowcase({ role }: { role: RoleOption }) {
  const Icon = ICON_BY_ROLE[role.id];

  return (
    <div className="gradient-navy hidden flex-col justify-between p-10 lg:flex">
      <div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11.5px] font-medium text-white">
          <Sparkles className="size-3" aria-hidden />
          Government of India
        </span>

        <span className="mt-8 grid size-14 place-items-center rounded-2xl bg-white/10">
          <Icon className="size-7 text-secondary-300" aria-hidden />
        </span>

        <p className="mt-5 text-[11.5px] font-semibold tracking-wide text-white/55 uppercase">
          {role.showcase.eyebrow}
        </p>
        <h2 className="display-sm mt-2 text-white">{role.showcase.headline}</h2>
        <p className="mt-3.5 text-[14px] leading-relaxed text-white/70">{role.showcase.body}</p>
      </div>

      <div className="mt-10 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          {role.showcase.stats.map(([value, label]) => (
            <div key={label}>
              <p className="numeral text-[24px] leading-none text-white">{value}</p>
              <p className="mt-1 text-[12px] text-white/65">{label}</p>
            </div>
          ))}
        </div>
        <p className="flex items-start gap-2 border-t border-white/10 pt-4 text-[11.5px] leading-relaxed text-white/55">
          <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          Authorised personnel only. All access is logged and subject to audit under
          information security policy.
        </p>
      </div>
    </div>
  );
}
