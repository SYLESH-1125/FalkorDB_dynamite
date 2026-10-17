import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { LoginForm } from "@/src/presentation/components/auth/login-form";
import { LoginRolePicker } from "@/src/presentation/components/auth/login-role-picker";
import { RoleShowcase } from "@/src/presentation/components/shared/role-showcase";
import { GraphAmbient } from "@/src/presentation/components/shared/graph-ambient";
import { PublicAccessNav } from "@/src/presentation/components/shared/public-access-nav";
import { USER_ROLES, ADMIN_ROLE } from "@/src/application/services/role-catalog";
import type { AppRole } from "@/src/domain/entities/user";
import bhumiLogo from "@/app/assets/bhumi-logo.png";

export const metadata: Metadata = {
  title: "Log in",
  description: "Log in to BHUMI with your employee credentials. Sign in is the same secure session.",
};

const PROOF = [
  ["18,942", "documents indexed and query-ready"],
  ["94.7%", "extraction accuracy on validated fields"],
];

const ACCENT_RULE: Record<AppRole, string> = {
  parliamentary: "bg-primary-500",
  ministry: "bg-secondary-500",
  "domain-officer": "bg-leaf-500",
  admin: "bg-danger",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; appRole?: string; next?: string }>;
}) {
  const params = await searchParams;
  const roleId = (params.role ?? params.appRole) as AppRole | undefined;
  const role = [...USER_ROLES, ADMIN_ROLE].find((r) => r.id === roleId);

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      <GraphAmbient variant="subtle" className="opacity-60" />
      <header className="relative border-b border-hairline bg-surface-card/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src={bhumiLogo} alt="BHUMI" className="h-7 w-auto" priority />
          </Link>
          <PublicAccessNav />
        </div>
      </header>

      <div className="grid-overlay relative flex flex-1 flex-col">
        <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
          <div className="card-float relative w-full max-w-5xl overflow-hidden rounded-3xl border border-hairline bg-surface-card/95 backdrop-blur-sm lg:grid lg:grid-cols-[1.05fr_1fr]">
            {role ? (
              <RoleShowcase role={role} />
            ) : (
              <div className="gradient-upsell hidden flex-col justify-between p-10 lg:flex">
                <div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-card/70 px-3 py-1 text-[11.5px] font-medium text-ink-0">
                    <Sparkles className="size-3" aria-hidden />
                    FalkorDB · Company Brain
                  </span>
                  <h2 className="display-sm mt-6 text-ink-0">
                    Log in once. Walk the graph everywhere.
                  </h2>
                  <p className="mt-3.5 text-[14px] leading-relaxed text-ink-0/70">
                    Use the same employee session across Query, Reports, Analytics, and Company Brain —
                    every module reads from one FalkorDB graph.
                  </p>
                </div>

                <div className="mt-10 space-y-4">
                  {PROOF.map(([value, label]) => (
                    <div key={label}>
                      <p className="numeral text-[24px] leading-none text-ink-0">{value}</p>
                      <p className="mt-1 text-[12px] text-ink-0/65">{label}</p>
                    </div>
                  ))}
                  <p className="flex items-start gap-2 border-t border-ink-0/10 pt-4 text-[11.5px] leading-relaxed text-ink-0/60">
                    <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    Authorised personnel only. All access is logged and subject to audit.
                  </p>
                </div>
              </div>
            )}

            <div className="relative flex flex-col justify-center p-7 sm:p-10">
              {role ? (
                <div className={`absolute top-0 left-0 h-[3px] w-16 ${ACCENT_RULE[role.id]}`} aria-hidden />
              ) : null}

              <Link
                href="/select-role"
                className="inline-flex w-fit items-center gap-1.5 text-[12.5px] font-medium text-muted transition-colors hover:text-ink-0"
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                Choose role visually
              </Link>
              <h1 className="display-sm mt-4 text-ink-0">Log in</h1>
              <p className="mt-1.5 text-[14px] text-body">
                {role
                  ? <>Signing in as <span className="font-semibold text-body-strong">{role.label}</span>.</>
                  : "Employee ID and password — same secure sign-in used across the platform."}
              </p>

              <Suspense fallback={null}>
                <LoginRolePicker activeRole={role?.id} />
              </Suspense>

              <LoginForm appRole={role?.id} nextPath={params.next} />

              <p className="mt-4 text-center text-[11.5px] text-muted">
                Also available at{" "}
                <Link href="/sign-in" className="font-semibold text-primary-600 hover:underline">
                  /sign-in
                </Link>
                {" "}(alias)
              </p>
            </div>
          </div>
        </div>

        <footer className="relative px-4 py-6 text-center">
          <p className="text-[12px] text-muted">
            BHUMI · Smart India Hackathon 2026 · Graph Hacks Track 03
          </p>
        </footer>
      </div>
    </div>
  );
}
