import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { UserPlus } from "lucide-react";
import { SignUpForm } from "@/src/presentation/components/auth/sign-up-form";
import { PublicAccessNav } from "@/src/presentation/components/shared/public-access-nav";
import { USER_ROLES } from "@/src/application/services/role-catalog";
import type { AppRole } from "@/src/domain/entities/user";
import bhumiLogo from "@/app/assets/bhumi-logo.png";

export const metadata: Metadata = {
  title: "Sign up",
  description: "Create a BHUMI account for your role and subsidiary.",
};

export default async function SignUpPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string; appRole?: string }>;
}) {
  const params = await searchParams;
  const roleId = (params.role ?? params.appRole) as AppRole | undefined;
  const selectedRole = USER_ROLES.find((r) => r.id === roleId)?.id;

  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-hairline bg-surface-card">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src={bhumiLogo} alt="BHUMI" className="h-7 w-auto" priority />
          </Link>
          <PublicAccessNav />
        </div>
      </header>

      <div className="grid-overlay flex flex-1 items-center justify-center px-4 py-10 sm:px-6">
        <div className="card-float w-full max-w-md rounded-3xl border border-hairline bg-surface-card p-7 sm:p-9">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-tint-navy px-3 py-1 text-[11.5px] font-semibold text-primary-600">
            <UserPlus className="size-3.5" aria-hidden />
            New account
          </span>
          <h1 className="display-sm mt-4 text-ink-0">Sign up</h1>
          <p className="mt-1.5 text-[14px] text-body">
            Create your employee account, then sign in to use Query, Reports, and Company Brain.
          </p>
          <Suspense fallback={null}>
            <SignUpForm selectedRole={selectedRole} />
          </Suspense>
        </div>
      </div>

      <footer className="px-4 py-6 text-center">
        <p className="text-[12px] text-muted">BHUMI · Smart India Hackathon 2026</p>
      </footer>
    </div>
  );
}
