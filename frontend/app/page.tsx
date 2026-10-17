import Link from "next/link";
import {
  ArrowRight, FileText, Sparkles, BarChart3, ShieldCheck, Check, Landmark, Layers, Lock,
} from "lucide-react";
import { HeroParallax } from "@/src/presentation/components/shared/hero-parallax";
import { WorkflowScroll } from "@/src/presentation/components/shared/workflow-scroll";
import { ModuleShowcase } from "@/src/presentation/components/shared/module-showcase";
import { Reveal } from "@/src/presentation/components/shared/reveal";

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
        className="relative z-10 flex min-h-screen flex-col justify-center overflow-hidden rounded-t-[28px] bg-canvas shadow-[0_-24px_60px_rgba(15,41,66,0.35)]"
        style={{ marginTop: "-110vh" }}
      >
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-cover bg-top opacity-[0.07]"
          style={{ backgroundImage: "url(/background/section-topo.png)" }}
          aria-hidden
        />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <div className="max-w-2xl">
              <h2 className="display-md text-ink-0">Built for the way ministries actually work</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-body">
                Every answer carries its provenance. Every report can be traced to the page it came from.
              </p>
            </div>
          </Reveal>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <Reveal key={feature.title} delay={i * 80}>
                  <div className="card-raise h-full rounded-2xl border border-hairline bg-surface-card p-5 transition-transform duration-300 hover:-translate-y-1">
                    <span className={`grid size-10 place-items-center rounded-xl ${feature.tint}`}>
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="title-md mt-4 text-ink-0">{feature.title}</h3>
                    <p className="mt-2 text-[13.5px] leading-relaxed text-body">{feature.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>

          <Reveal delay={120}>
            <div className="mt-14 grid gap-6 rounded-2xl border border-hairline bg-surface-card/60 p-6 sm:grid-cols-4 sm:p-8">
              {COVERAGE.map(([value, label]) => (
                <div key={label} className="text-center sm:text-left">
                  <p className="numeral text-[32px] leading-none text-primary-600">{value}</p>
                  <p className="mt-2 text-[12.5px] leading-snug text-muted">{label}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <WorkflowScroll />

      <section className="relative z-10 bg-canvas">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-2 lg:gap-14">
          <Reveal from="left">
            <div>
              <h2 className="display-md text-ink-0">
                From a shelf of scanned files to a parliamentary reply
              </h2>
              <p className="mt-4 text-[15px] leading-relaxed text-body">
                A question tabled in the Lok Sabha arrives with a fortnight&apos;s deadline and touches
                records held across nine subsidiaries. The platform collapses that search into a
                conversation — and hands back a drafted brief with citations intact.
              </p>
              <ul className="mt-6 space-y-3">
                {PIPELINE.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-[14px] text-body-strong">
                    <span className="mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full bg-tint-leaf text-success">
                      <Check className="size-3" aria-hidden />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/parliamentary"
                className="mt-8 inline-flex h-10 items-center gap-2 rounded-full bg-secondary-400 px-5 text-[13.5px] font-medium text-primary-700 transition-colors hover:bg-secondary-300"
              >
                View the tracker
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </Reveal>

          <Reveal from="right" delay={100}>
            <div className="card-float rounded-2xl border border-hairline bg-surface-card p-5 sm:p-6">
              <div className="flex items-center gap-2 border-b border-hairline pb-3">
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
          </Reveal>
        </div>
      </section>

      <section className="relative z-10 border-t border-hairline bg-surface-soft/60">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <div className="max-w-2xl">
              <p className="type-caption text-primary-500 uppercase">The platform</p>
              <h2 className="display-md mt-2 text-ink-0">Every module, one indexed record</h2>
              <p className="mt-3 text-[15px] leading-relaxed text-body">
                Query, visualise, report and track — all reading from the same validated corpus,
                so nothing drifts out of sync.
              </p>
            </div>
          </Reveal>

          <div className="mt-9">
            <ModuleShowcase />
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-canvas">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <Reveal>
            <div className="max-w-2xl">
              <p className="type-caption text-primary-500 uppercase">Built for every seat</p>
              <h2 className="display-md mt-2 text-ink-0">A different view for every role</h2>
            </div>
          </Reveal>

          <div className="mt-9 grid gap-4 sm:grid-cols-3">
            {ROLE_TILES.map((role, i) => (
              <Reveal key={role.title} delay={i * 90}>
                <div className="gradient-navy card-raise relative h-full overflow-hidden rounded-2xl p-6">
                  <div
                    className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-white/10 blur-3xl"
                    aria-hidden
                  />
                  <span className={`relative grid size-10 place-items-center rounded-xl ${role.tint}`}>
                    <role.icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="title-md relative mt-4 text-white">{role.title}</h3>
                  <p className="relative mt-2 text-[13.5px] leading-relaxed text-white/70">{role.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <Reveal>
          <div className="gradient-upsell card-raise flex flex-wrap items-center justify-between gap-5 rounded-2xl p-7 sm:p-9">
            <div className="min-w-0">
              <h2 className="display-sm text-ink-0">Ready to query your own archive?</h2>
              <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-0/70">
                Sign in with your employee credentials to start digitising and reporting.
              </p>
            </div>
            <Link
              href="/select-role"
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary-600 px-6 text-[14px] font-medium text-white transition-all duration-300 hover:scale-[1.03] hover:bg-primary-700"
            >
              Get started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </Reveal>
      </section>

      <footer className="border-t border-hairline bg-surface-card/60 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="flex flex-col gap-8 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <p className="type-wordmark text-ink-0">BHUMI</p>
              <p className="mt-2 text-[12.5px] leading-relaxed text-muted">
                Bharat Hub for Unified Mining Intelligence — a single, defensible record for the
                Ministry of Coal.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Platform</p>
                <ul className="mt-3 space-y-2 text-[12.5px] text-body">
                  <li><Link href="/query" className="hover:text-ink-0">AI Query System</Link></li>
                  <li><Link href="/analytics" className="hover:text-ink-0">Analytics</Link></li>
                  <li><Link href="/graph" className="hover:text-ink-0">Knowledge Graph</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Reporting</p>
                <ul className="mt-3 space-y-2 text-[12.5px] text-body">
                  <li><Link href="/reports" className="hover:text-ink-0">Report Generation</Link></li>
                  <li><Link href="/parliamentary" className="hover:text-ink-0">Parliamentary Tracker</Link></li>
                </ul>
              </div>
              <div>
                <p className="text-[11px] font-semibold tracking-wide text-muted uppercase">Access</p>
                <ul className="mt-3 space-y-2 text-[12.5px] text-body">
                  <li><Link href="/select-role" className="hover:text-ink-0">Sign in</Link></li>
                  <li><Link href="/help" className="hover:text-ink-0">Help &amp; Training</Link></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="mt-9 flex flex-col items-center justify-between gap-3 border-t border-hairline pt-6 text-center sm:flex-row sm:text-left">
            <p className="text-[12.5px] text-body">
              BHUMI · Bharat Hub for Unified Mining Intelligence
            </p>
            <p className="text-[12.5px] text-muted">Smart India Hackathon 2026 · Problem Statement 23</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
