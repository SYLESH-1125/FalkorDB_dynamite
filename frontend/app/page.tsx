import Link from "next/link";
import {
  ArrowRight, FileText, Sparkles, BarChart3, ShieldCheck, Check, Landmark, Layers, Lock,
  Play, Star,
} from "lucide-react";
import { HeroParallax } from "@/src/presentation/components/shared/hero-parallax";
import { WorkflowScroll } from "@/src/presentation/components/shared/workflow-scroll";
import { ModuleShowcase } from "@/src/presentation/components/shared/module-showcase";
import { Reveal } from "@/src/presentation/components/shared/reveal";
import { Parallax } from "@/src/presentation/components/shared/parallax";
import { LogoMarquee } from "@/src/presentation/components/shared/logo-marquee";
import { GetStartedCta } from "@/src/presentation/components/shared/get-started-cta";

const FEATURES = [
  {
    icon: FileText,
    tint: "bg-tint-leaf text-success",
    title: "Ingest anything",
    body: "PDFs, decades-old scans, spreadsheets and photographs — digitised through OCR and layout-aware extraction into a single searchable corpus.",
  },
  {
    icon: Sparkles,
    tint: "bg-tint-gold text-secondary-600",
    title: "Ask in plain language",
    body: "Natural-language queries answered from your own indexed records, with every claim traced back to a source document and page.",
  },
  {
    icon: BarChart3,
    tint: "bg-tint-navy text-primary-500",
    title: "Report without the grind",
    body: "Template-driven generation assembles statutory and parliamentary reports in minutes, complete with charts and annexures.",
  },
  {
    icon: ShieldCheck,
    tint: "bg-tint-red text-danger",
    title: "Traceable by design",
    body: "Human-in-loop validation and an immutable audit trail, so every published figure can be defended line by line.",
  },
];

const PIPELINE = [
  "Digitise legacy records with layout-aware OCR",
  "Route low-confidence extractions to human reviewers",
  "Query the corpus in English or Hindi",
  "Generate the brief, export to PDF or Word",
];

const COVERAGE = [
  ["9", "coal subsidiaries covered"],
  ["4", "role-based access tiers"],
  ["100%", "of claims traced to a source page"],
  ["2", "languages — English and Hindi"],
] as const;

const ROLE_TILES = [
  {
    icon: Landmark,
    tint: "bg-tint-navy text-primary-500",
    title: "Parliamentary Response Team",
    body: "Ask a question or request a briefing — get a drafted, defensible reply before the House deadline.",
  },
  {
    icon: Layers,
    tint: "bg-tint-gold text-secondary-600",
    title: "Ministry Policy & Monitoring",
    body: "Explore national trends across every subsidiary and request an executive report on demand.",
  },
  {
    icon: Lock,
    tint: "bg-tint-red text-danger",
    title: "CMPDI / CIL Domain Officers",
    body: "Review extracted evidence against the source scan before anything is published to the record.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-canvas">
      <HeroParallax />

      <section
        className="gradient-mesh-light relative z-10 flex min-h-screen flex-col justify-center overflow-hidden rounded-t-[28px] shadow-[0_-24px_60px_rgba(15,41,66,0.35)]"
        style={{ marginTop: "-110vh" }}
      >
        <Parallax
          speed={0.12}
          className="grid-overlay pointer-events-none absolute inset-x-0 top-0 h-[480px] opacity-[0.5] [mask-image:linear-gradient(to_bottom,black,transparent)]"
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-card px-3.5 py-1.5 text-[12px] font-semibold text-primary-600 shadow-sm">
                <Sparkles className="size-3.5 text-secondary-500" aria-hidden />
                Why ministries choose BHUMI
              </span>
              <h2 className="display-lg mt-5 text-ink-0">
                Built for the way ministries actually work
              </h2>
              <p className="mt-4 text-[16px] leading-relaxed text-body">
                Every answer carries its provenance. Every report can be traced to the page it came from.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={i * 80}>
                  <div className="group relative h-full overflow-hidden rounded-2xl border border-hairline bg-surface-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-primary-200 hover:shadow-[0_24px_48px_-24px_rgba(18,48,74,0.35)]">
                    <div
                      className="pointer-events-none absolute -top-10 -right-10 size-32 rounded-full opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
                      style={{ background: "radial-gradient(circle, rgba(242,183,5,0.18), transparent 70%)" }}
                      aria-hidden
                    />
                    <span className={`relative grid size-11 place-items-center rounded-xl ${feature.tint}`}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="title-md relative mt-5 text-ink-0">{feature.title}</h3>
                    <p className="relative mt-2.5 text-[13.5px] leading-relaxed text-body">{feature.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div className="glass-card card-float mt-16 grid gap-6 overflow-hidden rounded-2xl p-6 sm:grid-cols-4 sm:p-9">
              {COVERAGE.map(([value, label], i) => (
                <div
                  key={label}
                  className={`text-center sm:text-left ${i > 0 ? "sm:border-l sm:border-hairline sm:pl-6" : ""}`}
                >
                  <p className="numeral text-gradient-gold text-[36px] leading-none">{value}</p>
                  <p className="mt-2.5 text-[12.5px] leading-snug text-muted">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={160}>
            <div className="mt-14">
              <p className="text-center text-[11.5px] font-semibold tracking-wider text-muted-soft uppercase">
                Trusted across coal subsidiaries and CMPDI
              </p>
              <div className="mt-5">
                <LogoMarquee />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <WorkflowScroll />

      <section className="relative z-10 overflow-hidden bg-canvas">
        <Parallax
          speed={0.08}
          className="pointer-events-none absolute top-1/2 left-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(18,48,74,0.08), transparent 65%)" }}
          aria-hidden
        />
        <div className="relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <Reveal from="left">
            <div>
              <p className="type-caption text-primary-500 uppercase">Case in point</p>
              <h2 className="display-md mt-2 text-ink-0">
                From a shelf of scanned files to a parliamentary reply
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-body">
                A question tabled in the Lok Sabha arrives with a fortnight&apos;s deadline and touches
                records held across nine subsidiaries. The platform collapses that search into a
                conversation — and hands back a drafted brief with citations intact.
              </p>
              <ul className="mt-7 space-y-3.5">
                {PIPELINE.map((item) => (
                  <li key={item} className="flex items-start gap-3 text-[14px] text-body-strong">
                    <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-tint-leaf text-success">
                      <Check className="size-3" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/parliamentary"
                className="mt-9 inline-flex h-11 items-center gap-2 rounded-full bg-primary-600 px-6 text-[13.5px] font-semibold text-white shadow-[0_10px_24px_-10px_rgba(18,48,74,0.5)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700"
              >
                View the tracker
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </Reveal>

          <Reveal from="right" delay={100}>
            <Parallax speed={-0.05} className="relative">
              <div
                className="pointer-events-none absolute -inset-6 -z-10 rounded-[32px] opacity-70 blur-2xl"
                style={{ background: "radial-gradient(ellipse, rgba(242,183,5,0.16), transparent 70%)" }}
                aria-hidden
              />
              <div className="card-float overflow-hidden rounded-2xl border border-hairline bg-surface-card">
                <div className="flex items-center gap-1.5 border-b border-hairline bg-surface-soft px-4 py-3">
                  <span className="size-2.5 rounded-full bg-danger/60" aria-hidden />
                  <span className="size-2.5 rounded-full bg-secondary-400/70" aria-hidden />
                  <span className="size-2.5 rounded-full bg-success/60" aria-hidden />
                  <span className="ml-3 truncate text-[11.5px] font-medium text-muted-soft">
                    bhumi.gov.in/query
                  </span>
                </div>
                <div className="p-5 sm:p-6">
                  <div className="flex items-center gap-2">
                    <span className="grid size-7 place-items-center rounded-lg bg-tint-gold text-secondary-600">
                      <Sparkles className="size-3.5" aria-hidden />
                    </span>
                    <p className="text-[12px] font-semibold tracking-wide text-muted uppercase">
                      Sample query
                    </p>
                  </div>
                  <p className="mt-4 rounded-xl bg-surface-soft px-4 py-3 text-[14px] text-ink-0">
                    What progress has been made on Jharia Master Plan rehabilitation?
                  </p>
                  <p className="mt-4 text-[14px] leading-relaxed text-body">
                    12,840 families have been identified for resettlement, of whom{" "}
                    <span className="font-semibold text-ink-0">7,412 (57.7%)</span> have been
                    rehabilitated. Compensation of ₹2,184 crore has been disbursed. Title verification
                    remains the principal constraint, with 1,986 unresolved cases.
                  </p>
                  <div className="mt-4 space-y-2">
                    {[
                      ["Land-Acquisition-Records-1987-Vol3.pdf", "p. 42"],
                      ["Rehabilitation-Colony-Layout-Plan.pdf", "p. 2"],
                    ].map(([doc, page]) => (
                      <div
                        key={doc}
                        className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-soft/60 px-3 py-2"
                      >
                        <FileText className="size-3.5 shrink-0 text-muted" aria-hidden />
                        <span className="truncate text-[12.5px] text-body">{doc}</span>
                        <span className="ml-auto shrink-0 text-[11px] text-muted-soft">{page}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Parallax>
          </Reveal>
        </div>
      </section>

      <section className="gradient-mesh-light relative z-10 border-t border-hairline">
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="type-caption text-primary-500 uppercase">The platform</p>
              <h2 className="display-lg mt-3 text-ink-0">Every module, one indexed record</h2>
              <p className="mt-4 text-[16px] leading-relaxed text-body">
                Query, visualise, report and track — all reading from the same validated corpus,
                so nothing drifts out of sync.
              </p>
            </div>
          </Reveal>

          <div className="mt-14">
            <ModuleShowcase />
          </div>
        </div>
      </section>

      <section className="gradient-mesh-dark relative z-10 overflow-hidden">
        <div className="grid-overlay-dark pointer-events-none absolute inset-0 opacity-60 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent)]" aria-hidden />
        <Parallax
          speed={0.1}
          className="pointer-events-none absolute -top-24 right-[-10%] size-[420px] rounded-full bg-secondary-400/10 blur-3xl"
          aria-hidden
        />
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
          <Reveal>
            <div className="mx-auto max-w-2xl text-center">
              <p className="type-caption text-secondary-300 uppercase">Built for every seat</p>
              <h2 className="display-lg mt-3 text-white">A different view for every role</h2>
              <p className="mt-4 text-[15px] leading-relaxed text-white/60">
                The same validated corpus, presented differently depending on what your seat needs from it.
              </p>
            </div>
          </Reveal>

          <div className="mt-14 grid gap-5 sm:grid-cols-3">
            {ROLE_TILES.map((role, i) => (
              <Reveal key={role.title} delay={i * 90}>
                <div className="glass-card-dark card-raise group relative h-full overflow-hidden rounded-2xl p-7 transition-all duration-300 hover:-translate-y-1.5">
                  <div
                    className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-secondary-400/10 blur-3xl transition-opacity duration-500 group-hover:opacity-150"
                    aria-hidden
                  />
                  <span className={`relative grid size-11 place-items-center rounded-xl ${role.tint}`}>
                    <role.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="title-md relative mt-5 text-white">{role.title}</h3>
                  <p className="relative mt-2.5 text-[13.5px] leading-relaxed text-white/60">{role.body}</p>
                  <span className="relative mt-5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-secondary-300 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                    Explore this view
                    <ArrowRight className="size-3.5" aria-hidden />
                  </span>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 overflow-hidden bg-canvas px-4 py-16 sm:px-6 sm:py-24">
        <Reveal>
          <div className="gradient-mesh-light card-float relative mx-auto max-w-6xl overflow-hidden rounded-[28px] border border-hairline px-6 py-14 text-center sm:px-16 sm:py-20">
            <div
              className="pointer-events-none absolute -top-32 left-1/2 h-64 w-[520px] -translate-x-1/2 rounded-full opacity-70 blur-3xl"
              style={{ background: "radial-gradient(ellipse, rgba(242,183,5,0.25), transparent 65%)" }}
              aria-hidden
            />
            <div className="relative">
              <div className="mx-auto flex w-fit items-center gap-1 rounded-full border border-hairline bg-surface-card px-3 py-1.5 shadow-sm">
                {[0, 1, 2, 3, 4].map((n) => (
                  <Star key={n} className="size-3 fill-secondary-400 text-secondary-400" aria-hidden />
                ))}
                <span className="ml-1.5 text-[11.5px] font-medium text-muted">Built for SIH 2026 · Problem Statement 23</span>
              </div>
              <h2 className="display-lg mt-6 text-ink-0">Ready to query your own archive?</h2>
              <p className="mx-auto mt-4 max-w-lg text-[15px] leading-relaxed text-body">
                Sign in with your employee credentials to start digitising, querying and reporting —
                every answer traced back to its source.
              </p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <GetStartedCta className="inline-flex h-12 items-center gap-2 rounded-full bg-primary-600 px-7 text-[14.5px] font-semibold text-white shadow-[0_16px_32px_-12px_rgba(18,48,74,0.55)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700" />
                <Link
                  href="/help"
                  className="inline-flex h-12 items-center gap-2 rounded-full border border-hairline bg-surface-card px-6 text-[14.5px] font-medium text-ink-0 transition-all duration-300 hover:-translate-y-0.5 hover:border-hairline-strong"
                >
                  <Play className="size-3.5 fill-current" aria-hidden />
                  See how it works
                </Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      <footer className="relative z-10 border-t border-hairline bg-surface-card">
        <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.3fr_1fr_1fr_1fr]">
            <div className="max-w-xs">
              <p className="type-wordmark text-ink-0">BHUMI</p>
              <p className="mt-3 text-[13px] leading-relaxed text-muted">
                Bharat Hub for Unified Mining Intelligence — a single, defensible record for the
                Ministry of Coal.
              </p>
              <p className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-soft px-3 py-1 text-[11px] font-medium text-muted-soft">
                <Sparkles className="size-3 text-secondary-500" aria-hidden />
                Smart India Hackathon 2026 · PS 23
              </p>
            </div>

            <div>
              <p className="text-[11px] font-semibold tracking-wide text-muted-soft uppercase">Platform</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-body">
                <li><Link href="/query" className="transition-colors hover:text-primary-600">AI Query System</Link></li>
                <li><Link href="/analytics" className="transition-colors hover:text-primary-600">Analytics</Link></li>
                <li><Link href="/graph" className="transition-colors hover:text-primary-600">Knowledge Graph</Link></li>
                <li><Link href="/topics" className="transition-colors hover:text-primary-600">Word Cloud &amp; Topics</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-muted-soft uppercase">Reporting</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-body">
                <li><Link href="/reports" className="transition-colors hover:text-primary-600">Report Generation</Link></li>
                <li><Link href="/parliamentary" className="transition-colors hover:text-primary-600">Parliamentary Tracker</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold tracking-wide text-muted-soft uppercase">Access</p>
              <ul className="mt-4 space-y-2.5 text-[13px] text-body">
                <li><Link href="/select-role" className="transition-colors hover:text-primary-600">Sign in</Link></li>
                <li><Link href="/help" className="transition-colors hover:text-primary-600">Help &amp; Training</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-hairline pt-7 text-center sm:flex-row sm:text-left">
            <p className="text-[12.5px] text-muted">
              © 2026 BHUMI · Bharat Hub for Unified Mining Intelligence
            </p>
            <p className="text-[12.5px] text-muted-soft">Smart India Hackathon 2026 · Problem Statement 23</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
