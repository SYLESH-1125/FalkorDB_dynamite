"use client";

import { GraphAmbient } from "./graph-ambient";

const STEPS = [
  { title: "Ingest", detail: "PDFs, tickets, and chats become nodes — not orphaned files." },
  { title: "Link", detail: "FalkorDB connects Person → Project → Decision → Document." },
  { title: "Traverse", detail: "The agent walks the graph instead of guessing from vectors alone." },
  { title: "Defend", detail: "Every answer shows the path — ready for audit and parliament." },
];

export function GraphHackBand() {
  return (
    <section className="relative overflow-hidden border-y border-hairline bg-surface-soft py-14 sm:py-16">
      <GraphAmbient variant="subtle" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-[11px] font-semibold tracking-[0.18em] text-primary-600 uppercase">
          Graph Hacks · Track 03 · Why FalkorDB wins
        </p>
        <h2 className="display-md mx-auto mt-3 max-w-3xl text-center text-ink-0">
          Vectors find text. Graphs explain who owns the answer.
        </h2>
        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step, i) => (
            <li
              key={step.title}
              className="graph-step-rise relative rounded-2xl border border-hairline bg-surface-card/90 p-5 shadow-sm"
              style={{ animationDelay: `${i * 120}ms` }}
            >
              <span className="numeral text-[28px] leading-none text-secondary-500">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="title-md mt-3 text-ink-0">{step.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-body">{step.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
