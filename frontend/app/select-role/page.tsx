import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Landmark, LineChart, ShieldCheck, ClipboardCheck, Sparkles } from "lucide-react";
import { USER_ROLES, ADMIN_ROLE } from "@/src/application/services/role-catalog";
import { RoleCard } from "@/src/presentation/components/shared/role-card";
import bhumiLogo from "@/app/assets/bhumi-logo.png";

export const metadata: Metadata = { title: "Continue as" };

const ICONS = [Landmark, LineChart, ClipboardCheck] as const;
const TINTS = ["navy", "gold", "leaf"] as const;

export default function SelectRolePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="gradient-navy relative overflow-hidden">
        <div
          className="pointer-events-none absolute -top-32 -right-20 size-96 rounded-full bg-secondary-400/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-40 left-0 size-96 rounded-full bg-primary-300/20 blur-3xl"
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src={bhumiLogo} alt="BHUMI" className="h-8 w-auto drop-shadow-sm" priority />
          </Link>
        </div>

        <div className="relative mx-auto w-full max-w-6xl px-4 pt-6 pb-16 sm:px-6 sm:pb-20">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11.5px] font-medium text-secondary-300 ring-1 ring-white/15">
            <Sparkles className="size-3" aria-hidden />
            Smart India Hackathon 2026 · Problem Statement 23
          </span>
          <h1 className="display-md mt-5 max-w-2xl text-[32px] leading-[1.1] text-white sm:text-[40px]">
            Continue as
          </h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-white/70">
            Choose your role to sign in. All accounts are provisioned by an Administrator —
            there is no self-registration.
          </p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 pb-14 sm:px-6">
        <div className="-mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {USER_ROLES.map((role, i) => (
            <RoleCard key={role.id} role={role} icon={ICONS[i]} tint={TINTS[i]} />
          ))}
        </div>

        <div className="mt-12 flex items-center gap-3">
          <p className="shrink-0 text-[12px] font-semibold tracking-wide text-muted uppercase">
            Platform administration
          </p>
          <div className="h-px flex-1 bg-hairline" aria-hidden />
        </div>
        <div className="mt-5 max-w-md">
          <RoleCard role={ADMIN_ROLE} icon={ShieldCheck} tint="red" accent />
        </div>
      </div>

      <footer className="border-t border-hairline bg-surface-card/60 py-6">
        <p className="text-center text-[12px] text-muted">
          BHUMI · Smart India Hackathon 2026 · Problem Statement 23
        </p>
      </footer>
    </div>
  );
}
