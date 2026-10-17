"use client";

import { useState } from "react";
import { Brain, GitBranch, Loader2, Waypoints } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import type { BrainAnswer } from "@/src/domain/entities/brain";
import { PageHeader } from "../components/ui/page-header";
import { cn } from "../components/ui/cn";

const PROMPTS = [
  "Who owns the ECL offtake variance issue and what decision supports the response?",
  "Who owns the Jharia Fire Monitoring project?",
  "What evidence supports the House Question Turnaround project?",
  "Trace the decision to adopt human-in-loop validation",
  "What knowledge gaps exist in the company graph?",
  "List entity aliases and duplicate names",
];

const LIVE = !!process.env.NEXT_PUBLIC_API_URL;

export function CompanyBrainView() {
  const brief = useAsync(() => repositories.brain.brief(), []);
  const [question, setQuestion] = useState(PROMPTS[0]);
  const [asking, setAsking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<BrainAnswer | null>(null);
  const [fact, setFact] = useState({
    title: "",
    summary: "",
    decidedBy: "Ananya Rao",
    basedOn: "Validation SOP 2026",
    affects: "Legacy Record Digitisation",
  });
  const [saved, setSaved] = useState<string | null>(null);

  async function ask(next = question) {
    const trimmed = next.trim();
    if (!trimmed || asking) return;
    setQuestion(trimmed);
    setAsking(true);
    setError(null);
    try {
      setResult(await repositories.brain.ask(trimmed));
      brief.reload();
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "The graph query failed.");
    } finally {
      setAsking(false);
    }
  }

  async function recordFact(event: React.FormEvent) {
    event.preventDefault();
    if (!fact.title.trim() || !fact.summary.trim()) return;
    setSaved(null);
    setError(null);
    try {
      const created = await repositories.brain.record(fact);
      setSaved(created.title);
      setFact((current) => ({ ...current, title: "", summary: "" }));
      brief.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not write the decision.");
    }
  }

  const counts = brief.data?.counts ?? {};

  return (
    <>
      <PageHeader
        title="Company Brain"
        description="People, teams, projects, documents, tickets, and decisions in one FalkorDB graph. Answers follow the edges and name the source."
        breadcrumbs={[{ label: "Graph Hacks" }, { label: "Company Brain" }]}
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <section className="overflow-hidden rounded-2xl border border-[#16324a] bg-[#07111c] text-white shadow-[0_24px_60px_-32px_rgba(8,20,32,0.7)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-[#123044] text-[#5eead4]">
                <Brain className="size-5" aria-hidden />
              </span>
              <div>
                <p className="text-[11px] font-semibold tracking-[0.16em] text-[#5eead4] uppercase">Graph Hacks · Track 03</p>
                <p className="text-[13px] text-white/70">FalkorDB is the context layer. Remove it and these answers stop.</p>
              </div>
            </div>
            <span className={cn(
              "rounded-full px-3 py-1 text-[11px] font-semibold",
              LIVE ? "bg-[#123044] text-[#5eead4]" : "bg-white/10 text-white/70",
            )}>
              {LIVE ? "Live graph" : "Preview — set NEXT_PUBLIC_API_URL"}
            </span>
          </div>

          <div className="grid gap-3 px-5 py-4 sm:grid-cols-4">
            {[
              ["Person", "People"],
              ["Team", "Teams"],
              ["Project", "Projects"],
              ["Decision", "Decisions"],
            ].map(([kind, label]) => (
              <div key={kind} className="rounded-xl border border-white/10 bg-white/5 px-3 py-3">
                <p className="text-[11px] text-white/50">{label}</p>
                <p className="mt-1 text-[22px] font-semibold tabular-nums">{counts[kind] ?? "—"}</p>
              </div>
            ))}
          </div>

          <form
            className="px-5 pb-5"
            onSubmit={(event) => {
              event.preventDefault();
              void ask();
            }}
          >
            <label htmlFor="brain-question" className="text-[12px] font-medium text-white/70">
              Ask the organisation
            </label>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row">
              <input
                id="brain-question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                className="h-11 flex-1 rounded-xl border border-white/15 bg-[#0c1b2a] px-3 text-[14px] text-white outline-none placeholder:text-white/30 focus:border-[#5eead4]"
              />
              <button
                type="submit"
                disabled={asking}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#5eead4] px-4 text-[13.5px] font-semibold text-[#07111c] disabled:opacity-60"
              >
                {asking ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Waypoints className="size-4" aria-hidden />}
                Follow the graph
              </button>
            </div>
          </form>

          <div className="flex gap-2 overflow-x-auto px-5 pb-5">
            {PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => void ask(prompt)}
                className="shrink-0 rounded-full border border-white/15 px-3 py-1.5 text-left text-[12px] text-white/80 hover:border-[#5eead4] hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>
        </section>

        {error ? (
          <p className="rounded-xl border border-[#f3c1c1] bg-[#fff5f5] px-4 py-3 text-[13px] text-[#9b1c1c]">{error}</p>
        ) : null}

        {result ? (
          <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
            <article className="rounded-2xl border border-hairline bg-surface-card p-5">
              <p className="text-[11px] font-semibold tracking-[0.14em] text-primary-500 uppercase">
                {result.tool ? `${result.tool} · ${result.intent}` : result.intent}
              </p>
              <p className="mt-2 text-[15px] leading-relaxed text-ink-0">{result.answer}</p>
              {result.path.length > 0 ? (
                <ol className="mt-4 space-y-2">
                  {result.path.map((step, index) => (
                    <li key={`${step.fromLabel}-${step.relationship}-${index}`} className="flex flex-wrap items-center gap-2 text-[12.5px]">
                      <span className="rounded-md bg-surface-soft px-2 py-1 text-ink-0">{step.fromLabel}</span>
                      <span className="font-mono text-[11px] text-[#0f766e]">{step.relationship}</span>
                      <span className="rounded-md bg-surface-soft px-2 py-1 text-ink-0">{step.toLabel}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              {result.cypher ? (
                <pre className="mt-4 overflow-x-auto rounded-xl bg-[#07111c] p-3 text-[11.5px] leading-relaxed text-[#d7fff6]">{result.cypher}</pre>
              ) : null}
            </article>
            <aside className="rounded-2xl border border-hairline bg-surface-card p-5">
              <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-0">
                <GitBranch className="size-4 text-[#0f766e]" aria-hidden />
                Sources
              </div>
              <ul className="mt-3 space-y-3">
                {result.sources.map((source, index) => (
                  <li key={`${source.nodeId}-${index}`}>
                    <p className="text-[13px] font-medium text-ink-0">{source.label}</p>
                    <p className="text-[12px] text-muted">{source.kind} · {source.detail}</p>
                  </li>
                ))}
                {result.sources.length === 0 ? <li className="text-[12.5px] text-muted">No source node was matched.</li> : null}
              </ul>
            </aside>
          </section>
        ) : null}

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-2xl border border-hairline bg-surface-card p-5">
            <h2 className="text-[15px] font-semibold text-ink-0">Who the graph treats as central</h2>
            <ul className="mt-3 space-y-2">
              {(brief.data?.centralPeople ?? []).map((person) => (
                <li key={person.name} className="flex items-center justify-between gap-3 text-[13px]">
                  <span>
                    <span className="font-medium text-ink-0">{person.name}</span>
                    <span className="block text-[12px] text-muted">{person.role}</span>
                  </span>
                  <span className="tabular-nums text-muted">{person.connections}</span>
                </li>
              ))}
            </ul>
          </article>

          <form onSubmit={recordFact} className="rounded-2xl border border-hairline bg-surface-card p-5">
            <h2 className="text-[15px] font-semibold text-ink-0">Write a decision into the graph</h2>
            <p className="mt-1 text-[12.5px] text-muted">New facts are merged into FalkorDB, so the next answer sees them.</p>
            <div className="mt-3 grid gap-2">
              <input value={fact.title} onChange={(event) => setFact({ ...fact, title: event.target.value })} placeholder="Decision title" className="h-10 rounded-lg border border-hairline px-3 text-[13px]" />
              <textarea value={fact.summary} onChange={(event) => setFact({ ...fact, summary: event.target.value })} placeholder="What was decided" rows={3} className="rounded-lg border border-hairline px-3 py-2 text-[13px]" />
              <input value={fact.decidedBy} onChange={(event) => setFact({ ...fact, decidedBy: event.target.value })} placeholder="Decided by" className="h-10 rounded-lg border border-hairline px-3 text-[13px]" />
              <input value={fact.basedOn} onChange={(event) => setFact({ ...fact, basedOn: event.target.value })} placeholder="Source document" className="h-10 rounded-lg border border-hairline px-3 text-[13px]" />
              <input value={fact.affects} onChange={(event) => setFact({ ...fact, affects: event.target.value })} placeholder="Affects" className="h-10 rounded-lg border border-hairline px-3 text-[13px]" />
              <button type="submit" className="h-10 rounded-lg bg-primary-600 text-[13px] font-semibold text-white">Record decision</button>
              {saved ? <p className="text-[12.5px] text-success">Recorded: {saved}</p> : null}
            </div>
          </form>
        </section>

        {brief.data?.recentDecisions?.length ? (
          <section className="rounded-2xl border border-hairline bg-surface-card p-5">
            <h2 className="text-[15px] font-semibold text-ink-0">Decisions already in the graph</h2>
            <ul className="mt-3 space-y-3">
              {brief.data.recentDecisions.map((decision) => (
                <li key={decision.title}>
                  <p className="text-[13.5px] font-medium text-ink-0">{decision.title}</p>
                  <p className="text-[12px] text-muted">{decision.decidedOn} — {decision.summary}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </>
  );
}
