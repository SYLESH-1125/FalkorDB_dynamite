import Link from "next/link";
import {
  ArrowRight, ArrowUpRight, FileText, Sparkles, BarChart3, ShieldCheck, Check,
} from "lucide-react";

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

const STATS = [
  ["18,942", "Documents indexed"],
  ["94.7%", "Extraction accuracy"],
  ["1,284", "Reports generated"],
  ["9", "CIL subsidiaries"],
];

const NAV = [
  ["Dashboard", "/dashboard"], ["Reports", "/reports"], ["Query System", "/query"],
  ["Word Cloud", "/topics"], ["Analytics", "/analytics"],
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
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
        <nav className="card-raise flex items-center gap-3 rounded-full border border-hairline bg-surface-card px-3 py-2 sm:px-4">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary-600 text-[13px] font-semibold text-white">
              C
            </span>
            <span className="type-wordmark text-ink-0">CMPDI</span>
          </Link>

          <ul className="mx-auto hidden items-center gap-1 lg:flex">
            {NAV.map(([label, href]) => (
              <li key={label}>
                <Link
                  href={href}
                  className="rounded-full px-3 py-1.5 text-[13.5px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink-0"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <Link
              href="/help"
              className="hidden h-9 items-center rounded-full border border-hairline-strong bg-surface-card px-4 text-[13.5px] font-medium text-body-strong transition-colors hover:bg-surface-soft sm:inline-flex"
            >
              Help
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full bg-primary-600 px-4.5 text-[13.5px] font-medium text-white transition-colors hover:bg-primary-700"
            >
              Login
            </Link>
          </div>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-12 pb-16 text-center sm:px-6 sm:pt-16 lg:pt-20">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-200/70 bg-primary-50 px-3 py-1 text-[12px] font-medium text-primary-600">
          <Sparkles className="size-3" aria-hidden />
          Central Mine Planning &amp; Design Institute
        </span>

        <h1 className="display-xl mx-auto mt-6 max-w-4xl text-[2.25rem] text-ink-0 sm:text-5xl lg:text-[52px]">
          Institutional memory,
          <br className="hidden sm:block" />
          <span className="text-primary-400"> made answerable.</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-body sm:text-base">
          An AI-assisted platform that turns Coal India&apos;s scattered archives — scanned surveys,
          production statements, clearance filings — into a corpus officials can question directly
          and report from with confidence.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-2.5">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-primary-600 px-6 text-[14px] font-medium text-white transition-colors hover:bg-primary-700"
          >
            Open dashboard
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/query"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-hairline-strong bg-surface-card px-6 text-[14px] font-medium text-body-strong transition-colors hover:bg-surface-soft"
          >
            Try the query system
            <ArrowUpRight className="size-4" aria-hidden />
          </Link>
        </div>

        <dl className="mx-auto mt-14 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="numeral block text-[28px] text-ink-0 sm:text-[32px]">{value}</span>
                <span className="mt-1 block text-[12.5px] text-body">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
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
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 sm:pb-20">
        <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
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
              Sign in with your CIL employee credentials to start digitising and reporting.
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
            Central Mine Planning &amp; Design Institute Limited · A subsidiary of Coal India Limited
          </p>
          <p className="text-[12.5px] text-muted">Smart India Hackathon 2026 · Problem Statement 23</p>
        </div>
      </footer>
    </div>
  );
}
