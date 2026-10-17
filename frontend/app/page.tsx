import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { USER_ROLES, ADMIN_ROLE } from "@/src/application/services/role-catalog";
import { RoleCard } from "@/src/presentation/components/shared/role-card";
import { RoleOrbit } from "@/src/presentation/components/shared/role-orbit";
import bhumiLogo from "@/app/assets/bhumi-logo.png";
import { GraphAmbient } from "@/src/presentation/components/shared/graph-ambient";
import { PublicAccessNav } from "@/src/presentation/components/shared/public-access-nav";

export const metadata: Metadata = { title: "Continue as" };

const TINTS = ["navy", "gold", "leaf"] as const;

export default function SelectRolePage() {
  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      <GraphAmbient variant="subtle" className="opacity-50" />
      <header className="relative border-b border-hairline bg-surface-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src={bhumiLogo} alt="BHUMI" className="h-7 w-auto" priority />
          </Link>
          <PublicAccessNav />
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 sm:py-10">
        <div className="mb-14 lg:mb-20">
          <RoleOrbit roles={USER_ROLES} tints={TINTS} admin={ADMIN_ROLE} />
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3 lg:hidden">
          {USER_ROLES.map((role, i) => (
            <RoleCard key={role.id} role={role} tint={TINTS[i]} index={String(i + 1).padStart(2, "0")} />
          ))}
        </div>

        <div className="mt-14 flex items-center gap-3 lg:hidden">
          <ShieldCheck className="size-4 shrink-0 text-muted-soft" aria-hidden />
          <p className="type-caption shrink-0 font-semibold tracking-[0.14em] text-muted uppercase">
            Platform administration
          </p>
          <div className="h-px flex-1 bg-hairline" aria-hidden />
        </div>

        <div className="mt-5 lg:hidden">
          <RoleCard role={ADMIN_ROLE} tint="red" index="00" accent />
        </div>

        <p className="mt-8 flex items-center gap-2 text-[12.5px] text-muted">
          Don&apos;t recognise your role here?
          <Link href="/help" className="inline-flex items-center gap-1 font-semibold text-primary-600 hover:underline">
            Contact your subsidiary administrator
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </p>
      </div>

      <footer className="border-t border-hairline bg-surface-card/60 py-6">
        <p className="text-center text-[12px] text-muted">
          BHUMI · Smart India Hackathon 2026 · Problem Statement 23
        </p>
      </footer>
    </div>
  );
}
