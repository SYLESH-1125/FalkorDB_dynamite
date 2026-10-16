import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Landmark, LineChart, ShieldCheck, ClipboardCheck } from "lucide-react";
import { USER_ROLES, ADMIN_ROLE } from "@/src/application/services/role-catalog";
import { RoleCard } from "@/src/presentation/components/shared/role-card";
import bhumiLogo from "@/app/assets/bhumi-logo.png";

export const metadata: Metadata = { title: "Continue as" };

const ICONS = [Landmark, LineChart, ClipboardCheck] as const;
const TINTS = ["navy", "gold", "leaf"] as const;

export default function SelectRolePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <Image src={bhumiLogo} alt="BHUMI" className="h-8 w-auto" priority />
        </Link>
      </div>

      <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6 sm:py-14">
        <div className="max-w-2xl">
          <h1 className="display-md text-ink-0">Continue as</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-body">
            Choose your role to sign in. All accounts are provisioned by an Administrator —
            there is no self-registration.
          </p>
        </div>

        <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {USER_ROLES.map((role, i) => (
            <RoleCard key={role.id} role={role} icon={ICONS[i]} tint={TINTS[i]} />
          ))}
        </div>

        <div className="mt-10 border-t border-hairline pt-8">
          <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">
            Platform administration
          </p>
          <div className="mt-4 max-w-md">
            <RoleCard role={ADMIN_ROLE} icon={ShieldCheck} tint="red" accent />
          </div>
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
