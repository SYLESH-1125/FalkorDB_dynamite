import type { Metadata } from "next";
import { LoginForm } from "@/src/presentation/components/auth/login-form";
import Link from "next/link";
import { ShieldCheck, Landmark } from "lucide-react";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <div className="gradient-hero flex min-h-screen flex-col bg-sand-100">
      <div className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-ink-800 font-serif text-sm font-bold text-white">C</span>
          <span className="font-serif text-lg font-semibold tracking-tight text-ink-800">CMPDI</span>
        </Link>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-5xl overflow-hidden rounded-2xl border border-sand-300 bg-white shadow-[0_1px_2px_rgba(11,37,69,0.04),0_24px_64px_-28px_rgba(11,37,69,0.3)] lg:grid lg:grid-cols-2">
          <div className="hidden flex-col justify-between bg-ink-800 p-10 lg:flex">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[10px] font-medium tracking-wider text-clay-300 uppercase">
                <Landmark className="size-3" aria-hidden />
                Government of India
              </span>
              <h2 className="mt-7 font-serif text-3xl leading-tight font-semibold text-white">
                Intelligence Platform for Coal India Limited
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-sand-400">
                Document digitisation, AI-assisted query and automated reporting across
                nine subsidiaries — with full traceability from every published figure
                back to its source page.
              </p>
            </div>

            <div className="space-y-4">
              {[
                ["18,942", "documents indexed and query-ready"],
                ["94.7%", "extraction accuracy on validated fields"],
              ].map(([value, label]) => (
                <div key={label}>
                  <p className="font-serif text-2xl font-semibold text-clay-400">{value}</p>
                  <p className="text-xs text-sand-500">{label}</p>
                </div>
              ))}
              <p className="flex items-start gap-2 border-t border-ink-700 pt-4 text-[11px] text-ink-300">
                <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                Authorised personnel only. All access is logged and subject to audit
                under CIL information security policy.
              </p>
            </div>
          </div>

          <div className="p-6 sm:p-10">
            <h1 className="font-serif text-2xl font-semibold tracking-tight text-ink-800">Sign in</h1>
            <p className="mt-1.5 text-sm text-ink-400">
              Use your CIL employee credentials to access the platform.
            </p>
            <LoginForm />
          </div>
        </div>
      </div>

      <footer className="px-4 py-6 text-center">
        <p className="text-xs text-ink-300">
          Central Mine Planning &amp; Design Institute Limited · Smart India Hackathon 2026
        </p>
      </footer>
    </div>
  );
}
