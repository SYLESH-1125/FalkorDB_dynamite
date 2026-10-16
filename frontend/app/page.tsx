import Link from "next/link";
import {
  FileText, Sparkles, ShieldCheck, BarChart3, ArrowRight, Landmark, Cloud, CheckCircle2,
} from "lucide-react";

const FEATURES = [
  { icon: FileText, title: "Ingest anything", body: "PDFs, decades-old scans, spreadsheets and photographs — digitised through OCR and layout-aware extraction into a single searchable corpus." },
  { icon: Sparkles, title: "Ask in plain language", body: "Natural-language queries answered from your own indexed records, with every claim traced back to a source document and page." },
  { icon: BarChart3, title: "Report without the grind", body: "Template-driven generation assembles statutory and parliamentary reports in minutes, complete with charts and annexures." },
  { icon: ShieldCheck, title: "Traceable by design", body: "Human-in-loop validation and an immutable audit trail, so every published figure can be defended line by line." },
];

const STATS = [
  ["18,942", "Documents indexed"],
  ["94.7%", "Extraction accuracy"],
  ["1,284", "Reports generated"],
  ["9", "CIL subsidiaries"],
];

export default function LandingPage() {
  return (
    <div className="gradient-hero min-h-screen bg-cream">
      <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">
        <nav className="flex items-center gap-3 rounded-full border border-white/70 bg-cream-dark/70 px-3 py-2 shadow-sm backdrop-blur sm:px-5">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-navy-900 font-serif text-sm font-bold text-white">C</span>
            <span className="font-serif text-lg font-semibold tracking-tight text-navy-900">CMPDI</span>
          </Link>

          <ul className="mx-auto hidden items-center gap-6 lg:flex">
            {[
              ["Dashboard", "/dashboard"], ["Reports", "/reports"], ["Query System", "/query"],
              ["Word Cloud", "/topics"], ["Analytics", "/analytics"],
            ].map(([label, href]) => (
              <li key={label}>
                <Link
                  href={href}
                  className="text-[11px] font-medium tracking-wider text-navy-500 uppercase transition-colors hover:text-navy-900"
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          <div className="ml-auto flex shrink-0 items-center gap-2 lg:ml-0">
            <Link
              href="/help"
              className="hidden h-9 items-center rounded-full border border-navy-200 bg-white px-4 text-sm font-medium text-navy-800 transition-colors hover:bg-navy-50 sm:inline-flex"
            >
              Help
            </Link>
            <Link
              href="/login"
              className="inline-flex h-9 items-center rounded-full bg-navy-900 px-5 text-sm font-medium text-white transition-colors hover:bg-navy-800"
            >
              Login
            </Link>
          </div>
        </nav>
      </div>

      <section className="mx-auto max-w-7xl px-4 pt-10 pb-16 text-center sm:px-6 sm:pt-16 lg:pt-24">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-brand-200 bg-white/70 px-3 py-1 text-[11px] font-medium tracking-wide text-amber-brand-700 uppercase">
          <Landmark className="size-3" aria-hidden />
          Central Mine Planning &amp; Design Institute
        </span>

        <h1 className="mx-auto mt-6 max-w-4xl font-serif text-[2.5rem] leading-[1.08] font-semibold tracking-tight text-navy-900 sm:text-6xl lg:text-7xl">
          Institutional memory,
          <br className="hidden sm:block" />
          <span className="text-amber-brand-600"> made answerable.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-navy-600 sm:text-lg">
          An AI-assisted platform that turns Coal India&apos;s scattered archives — scanned surveys,
          production statements, clearance filings — into a corpus officials can question directly
          and report from with confidence.
        </p>

        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-full bg-navy-900 px-7 text-sm font-medium text-white transition-colors hover:bg-navy-800"
          >
            Open dashboard
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <Link
            href="/query"
            className="inline-flex h-11 items-center gap-2 rounded-full border border-navy-200 bg-white px-7 text-sm font-medium text-navy-800 transition-colors hover:bg-navy-50"
          >
            <Sparkles className="size-4 text-amber-brand-500" aria-hidden />
            Try the query system
          </Link>
        </div>

        <dl className="mx-auto mt-16 grid max-w-3xl grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {STATS.map(([value, label]) => (
            <div key={label}>
              <dt className="sr-only">{label}</dt>
              <dd>
                <span className="block font-serif text-3xl font-semibold text-navy-900 sm:text-4xl">{value}</span>
                <span className="mt-1 block text-xs text-navy-500">{label}</span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="bg-white/60 py-16 backdrop-blur-sm sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
              Built for the way ministries actually work
            </h2>
            <p className="mt-3 text-navy-600">
              Every answer carries its provenance. Every report can be traced to the page it came from.
            </p>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-navy-100 bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.04),0_12px_32px_-16px_rgba(11,37,69,0.16)]"
                >
                  <span className="grid size-10 place-items-center rounded-xl bg-amber-brand-50 text-amber-brand-600">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-navy-900">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-navy-500">{feature.body}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-navy-900 sm:text-4xl">
              From a shelf of scanned files to a parliamentary reply
            </h2>
            <p className="mt-4 leading-relaxed text-navy-600">
              A question tabled in the Lok Sabha arrives with a fortnight&apos;s deadline and touches
              records held across nine subsidiaries. The platform collapses that search into a
              conversation — and hands back a drafted brief with citations intact.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Digitise legacy records with layout-aware OCR",
                "Route low-confidence extractions to human reviewers",
                "Query the corpus in English or Hindi",
                "Generate the brief, export to PDF or Word",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-sm text-navy-700">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-amber-brand-500" aria-hidden />
                  {item}
                </li>
              ))}
            </ul>
            <Link
              href="/parliamentary"
              className="mt-8 inline-flex h-10 items-center gap-2 rounded-full bg-amber-brand-500 px-6 text-sm font-medium text-white transition-colors hover:bg-amber-brand-600"
            >
              View the tracker
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>

          <div className="rounded-2xl border border-navy-100 bg-white p-6 shadow-[0_1px_2px_rgba(11,37,69,0.04),0_16px_48px_-20px_rgba(11,37,69,0.24)]">
            <div className="flex items-center gap-2 border-b border-navy-100 pb-3">
              <Cloud className="size-4 text-amber-brand-500" aria-hidden />
              <p className="text-xs font-medium tracking-wide text-navy-500 uppercase">Sample query</p>
            </div>
            <p className="mt-4 rounded-xl bg-navy-50 px-4 py-3 text-sm text-navy-800">
              What progress has been made on Jharia Master Plan rehabilitation?
            </p>
            <p className="mt-4 text-sm leading-relaxed text-navy-700">
              12,840 families have been identified for resettlement, of whom{" "}
              <strong className="font-semibold text-navy-900">7,412 (57.7%)</strong> have been
              rehabilitated. Compensation of ₹2,184 crore has been disbursed. Title verification
              remains the principal constraint, with 1,986 unresolved cases.
            </p>
            <div className="mt-4 space-y-2">
              {[
                ["Land-Acquisition-Records-1987-Vol3.pdf", "p. 42"],
                ["Rehabilitation-Colony-Layout-Plan.pdf", "p. 2"],
              ].map(([doc, page]) => (
                <div key={doc} className="flex items-center gap-2 rounded-lg border border-navy-100 bg-cream/50 px-3 py-2">
                  <FileText className="size-3.5 shrink-0 text-navy-400" aria-hidden />
                  <span className="truncate text-xs text-navy-600">{doc}</span>
                  <span className="ml-auto shrink-0 text-[10px] text-navy-400">{page}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-navy-100 bg-white/70 py-8">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 text-center sm:flex-row sm:px-6 sm:text-left">
          <p className="text-xs text-navy-500">
            Central Mine Planning &amp; Design Institute Limited · A subsidiary of Coal India Limited
          </p>
          <p className="text-xs text-navy-400">Smart India Hackathon 2026 · Problem Statement 23</p>
        </div>
      </footer>
    </div>
  );
}
