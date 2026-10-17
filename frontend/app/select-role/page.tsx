import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, ArrowRight } from "lucide-react";
import { USER_ROLES, ADMIN_ROLE } from "@/src/application/services/role-catalog";
import { RoleCard } from "@/src/presentation/components/shared/role-card";
import bhumiLogo from "@/app/assets/bhumi-logo.png";

export const metadata: Metadata = { title: "Continue as" };

const TINTS = ["navy", "gold", "leaf"] as const;

export default function SelectRolePage() {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="relative border-b border-hairline bg-surface-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src={bhumiLogo} alt="BHUMI" className="h-7 w-auto" priority />
          </Link>
          <Link
            href="/help"
            className="type-caption font-semibold text-muted transition-colors hover:text-ink-0"
          >
            Need help signing in?
          </Link>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-hairline">
        <div className="grid-overlay pointer-events-none absolute inset-0 opacity-[0.4]" aria-hidden />
        <div className="relative mx-auto grid w-full max-w-7xl gap-8 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="flex items-center gap-3">
              <span className="numeral text-[13px] text-muted-soft">01 / 02</span>
              <div className="h-px w-10 bg-hairline-strong" aria-hidden />
              <span className="type-caption font-semibold tracking-[0.14em] text-muted uppercase">Access</span>
            </div>
            <h1 className="display-lg mt-5 max-w-2xl text-ink-0">
              Who&apos;s signing in?
            </h1>
            <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-body">
              Every seat on BHUMI is provisioned by an Administrator — pick the mandate
              that matches your credentials and we&apos;ll take you straight there.
            </p>
          </div>

          <dl className="flex shrink-0 gap-8 border-t border-hairline pt-5 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <div>
              <dt className="type-caption text-muted-soft uppercase">Mandates</dt>
              <dd className="numeral mt-1 text-[26px] text-ink-0">04</dd>
            </div>
            <div>
              <dt className="type-caption text-muted-soft uppercase">Subsidiaries</dt>
              <dd className="numeral mt-1 text-[26px] text-ink-0">09</dd>
            </div>
            <div>
              <dt className="type-caption text-muted-soft uppercase">Self-serve signup</dt>
              <dd className="numeral mt-1 text-[26px] text-ink-0">None</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-12 sm:px-6 sm:py-16">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {USER_ROLES.map((role, i) => (
            <RoleCard key={role.id} role={role} tint={TINTS[i]} index={String(i + 1).padStart(2, "0")} />
          ))}
        </div>

        <div className="mt-14 flex items-center gap-3">
          <ShieldCheck className="size-4 shrink-0 text-muted-soft" aria-hidden />
          <p className="type-caption shrink-0 font-semibold tracking-[0.14em] text-muted uppercase">
            Platform administration
          </p>
          <div className="h-px flex-1 bg-hairline" aria-hidden />
        </div>

        <div className="mt-5">
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
