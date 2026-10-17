import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Sparkles, ArrowLeft } from "lucide-react";
import { LoginForm } from "@/src/presentation/components/auth/login-form";
import { RoleShowcase } from "@/src/presentation/components/shared/role-showcase";
import { USER_ROLES, ADMIN_ROLE } from "@/src/application/services/role-catalog";
import type { AppRole } from "@/src/domain/entities/user";
import bhumiLogo from "@/app/assets/bhumi-logo.png";

export const metadata: Metadata = { title: "Sign in" };

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
  searchParams: Promise<{ role?: string }>;
}) {
  const { role: roleId } = await searchParams;
  const role = [...USER_ROLES, ADMIN_ROLE].find((r) => r.id === roleId);

  return (
    <div className="relative flex min-h-screen flex-col bg-canvas">
      <header className="relative border-b border-hairline bg-surface-card">
        <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src={bhumiLogo} alt="BHUMI" className="h-7 w-auto" priority />
          </Link>
        </div>
      </header>

      <div className="grid-overlay relative flex flex-1 flex-col">
      <div className="relative flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="card-float relative w-full max-w-5xl overflow-hidden rounded-3xl border border-hairline bg-surface-card lg:grid lg:grid-cols-[1.05fr_1fr]">
          {role ? (
            <RoleShowcase role={role} />
          ) : (
            <div className="gradient-upsell hidden flex-col justify-between p-10 lg:flex">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-card/70 px-3 py-1 text-[11.5px] font-medium text-ink-0">
                  <Sparkles className="size-3" aria-hidden />
                  Government of India
                </span>
                <h2 className="display-sm mt-6 text-ink-0">
                  Bharat Hub for Unified Mining Intelligence
                </h2>
                <p className="mt-3.5 text-[14px] leading-relaxed text-ink-0/70">
                  Document digitisation, AI-assisted query and automated reporting across nine
                  subsidiaries — with full traceability from every published figure back to its
                  source page.
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
                  Authorised personnel only. All access is logged and subject to audit under
                  information security policy.
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
              Change role
            </Link>
            <h1 className="display-sm mt-4 text-ink-0">Sign in</h1>
            <p className="mt-1.5 text-[14px] text-body">
              {role
                ? <>Signing in as <span className="font-semibold text-body-strong">{role.label}</span>.</>
                : "Use your employee credentials to access the platform."}
            </p>
            <LoginForm appRole={role?.id} />
          </div>
        </div>
      </div>

      <footer className="relative px-4 py-6 text-center">
        <p className="text-[12px] text-muted">
          BHUMI · Smart India Hackathon 2026
        </p>
      </footer>
      </div>
    </div>
  );
}
