import Link from "next/link";
import {
  ArrowRight, FileText, Sparkles, BarChart3, ShieldCheck, Check,
} from "lucide-react";
import { HeroParallax } from "@/src/presentation/components/shared/hero-parallax";

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
          <div className="max-w-2xl">
            <h2 className="display-md text-ink-0">Built for the way ministries actually work</h2>
            <p className="mt-3 text-[15px] leading-relaxed text-body">
              Every answer carries its provenance. Every report can be traced to the page it came from.
            </p>
          </div>

          <div className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="card-raise rounded-2xl border border-hairline bg-surface-card p-5"
                >
                  <span className={`grid size-10 place-items-center rounded-xl ${feature.tint}`}>
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="title-md mt-4 text-ink-0">{feature.title}</h3>
                  <p className="mt-2 text-[13.5px] leading-relaxed text-body">{feature.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="relative z-10 bg-canvas">
        <div className="mx-auto grid max-w-7xl items-start gap-10 px-4 pb-16 sm:px-6 sm:pb-20 lg:grid-cols-2 lg:gap-14">
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
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="gradient-upsell card-raise flex flex-wrap items-center justify-between gap-5 rounded-2xl p-7 sm:p-9">
          <div className="min-w-0">
            <h2 className="display-sm text-ink-0">Ready to query your own archive?</h2>
            <p className="mt-2 max-w-xl text-[14px] leading-relaxed text-ink-0/70">
              Sign in with your employee credentials to start digitising and reporting.
            </p>
          </div>
          <Link
            href="/login"
            className="inline-flex h-11 shrink-0 items-center gap-2 rounded-full bg-primary-600 px-6 text-[14px] font-medium text-white transition-colors hover:bg-primary-700"
          >
            Get started
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <footer className="border-t border-hairline bg-surface-card/60 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-[12.5px] text-body">
            BHUMI · Bharat Hub for Unified Mining Intelligence
          </p>
          <p className="text-[12.5px] text-muted">Smart India Hackathon 2026 · Problem Statement 23</p>
        </div>
      </footer>
    </div>
  );
}
