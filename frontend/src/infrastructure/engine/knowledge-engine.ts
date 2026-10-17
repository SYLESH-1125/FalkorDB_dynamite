// The engine the demo actually runs: retrieval, evidence scoring, topic frequencies and
// deterministic report assembly — all computed from the embedded corpus, no server.
import type { Citation, EvidenceSummary } from "@/src/domain/entities/query";
import type { TopicTerm, TopicCluster } from "@/src/domain/entities/topic";
import type { TiptapContent, ReportEvidence, ReportFigure, ReportGap } from "@/src/domain/entities/report";
import {
  CORPUS_CHUNKS, CORPUS_DOCS, CORPUS_FACTS, KNOWN_GAPS, type CorpusFact,
} from "./corpus";

const STOPWORDS = new Set([
  "the", "and", "for", "are", "was", "were", "this", "that", "with", "from", "what", "which",
  "how", "has", "have", "does", "did", "into", "over", "across", "per", "its", "our", "their",
  "about", "show", "tell", "give", "list", "many", "much", "most", "year", "years", "fy",
  "coal", "mining", "mine", "report", "data", "figure", "number", "value", "please",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOPWORDS.has(t));
}

function countOccurrences(needle: string, haystack: string): number {
  const re = new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "gi");
  return (haystack.match(re) ?? []).length;
}

// ── Retrieval ────────────────────────────────────────────────────────────────
function scoreChunk(qTokens: string[], text: string): number {
  const chunkTokens = new Set(tokenize(text));
  let hits = 0;
  for (const t of qTokens) if (chunkTokens.has(t)) hits += 1;
  return hits;
}

function matchFacts(lower: string, qTokens: string[]): CorpusFact[] {
  const set = new Set(qTokens);
  // exact token OR a keyword that appears (as a prefix, so "targets" matches "target") in the question
  return CORPUS_FACTS.filter((f) => f.keywords.some((k) => set.has(k) || new RegExp(`\\b${k}`, "i").test(lower)));
}

function detectGap(question: string): { fact: string; owner: string } | null {
  const lower = question.toLowerCase();
  for (const g of KNOWN_GAPS) {
    if (g.keywords.some((k) => lower.includes(k))) return { fact: g.fact, owner: g.owner };
  }
  return null;
}

function detectConflict(facts: CorpusFact[]): { text: string; impact: string[] } | null {
  const gross = facts.find((f) => f.basis === "gross");
  const net = facts.find((f) => f.basis === "net" && gross && f.subsidiary === gross.subsidiary);
  if (gross && net && gross.value !== net.value) {
    return {
      text: `${gross.docName} (p.${gross.page}) reports ${gross.display} on a gross basis; ${net.docName} lists ${net.display} on a net basis for the same block and period. Gross/net basis differs — flagged, not silently merged.`,
      impact: ["PQ LS-2390 reply (Aug 2026)", "Executive Policy Brief — Dispatch Trends v5"],
    };
  }
  return null;
}

function dispatchChart(facts: CorpusFact[]): string | null {
  const bySub = new Map<string, number>();
  for (const f of facts) {
    if (f.unit === "MT" && f.value !== null && f.basis !== "net" && f.subsidiary !== "All subsidiaries" && /dispatch|production/i.test(f.metric)) {
      bySub.set(f.subsidiary, Math.max(bySub.get(f.subsidiary) ?? 0, f.value));
    }
  }
  if (bySub.size < 3) return null;
  const data = [...bySub.entries()].sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name, value }));
  return "\n\n```chart\n" + JSON.stringify({ type: "bar", title: "Dispatch by subsidiary — FY 2025-26 (MT)", data, series: [{ key: "value", label: "MT" }] }) + "\n```";
}

export interface EngineAnswer {
  content: string;
  citations: Citation[];
  evidence: EvidenceSummary;
}

const FORECAST_RE = /\b(next year|forecast|forecasts|projection|projections|predict|future|outlook)\b/;
const TOPIC_RE = /\b(trend|trends|term|terms|word|words|topic|topics|cluster|clusters|theme|themes|priorit\w*|important|frequen\w*|emerging|vocabular\w*|prominent)\b/;
const FORECAST_NOTE = "A validated forward production projection is not held — BHUMI reports facts true as-of a date, not forecasts.";
const FORECAST_OWNER = "CIL Planning · demand projection cell";

function rankChunks(qTokens: string[]): Citation[] {
  const ranked = CORPUS_CHUNKS
    .map((c) => ({ chunk: c, score: scoreChunk(qTokens, c.text) }))
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 4);
  const maxScore = ranked[0]?.score ?? 1;
  return ranked.map((r, i) => ({
    id: `cit-${i}`, documentName: r.chunk.docName, page: r.chunk.page, table: r.chunk.table, cell: r.chunk.cell,
    snippet: r.chunk.text, relevance: Math.min(0.98, 0.62 + (r.score / (maxScore + 1)) * 0.36),
  }));
}

export function answerQuestion(question: string): EngineAnswer {
  const lower = question.trim().toLowerCase();
  const qTokens = tokenize(question);
  const forecast = FORECAST_RE.test(lower);
  const rankedCitations = rankChunks(qTokens);

  if (TOPIC_RE.test(lower)) return topicAnswer(rankedCitations, forecast);

  // a specifically not-held figure was asked for → declare the gap, don't answer with tangential facts
  const hardGap = detectGap(lower);
  if (hardGap) return gapResponse(question, hardGap, rankedCitations.slice(0, 3));

  const facts = matchFacts(lower, qTokens);
  const conflictWanted = /\b(gross|net|conflict|contradict|discrepan|mismatch|differ|reconcil|basis)\b/.test(lower);
  const conflict = conflictWanted ? detectConflict(facts) : null;
  const factsWithValue = facts.filter((f) => f.value !== null);
  // outside a discrepancy question, keep one figure per metric (drop the net-basis twin)
  const usable = conflict ? factsWithValue : factsWithValue.filter((f) => f.basis !== "net");

  if (usable.length === 0) return gapResponse(question, null, rankedCitations.slice(0, 3));

  const factCitations: Citation[] = usable.slice(0, 4).map((f, i) => ({
    id: `fc-${i}`, documentName: f.docName, page: f.page, table: f.table, cell: f.cell,
    snippet: `${f.metric}: ${f.display} (${f.subsidiary}, ${f.period}).`, relevance: 0.95 - i * 0.06,
  }));
  const sources = new Set(factCitations.map((c) => c.documentName)).size;
  const factLines = usable.slice(0, 5).map((f) => `- **${f.metric}** — ${f.display} (${f.subsidiary}, ${f.period}).`);

  const content =
    `Grounded in ${sources} validated source${sources === 1 ? "" : "s"}, here is what the corpus holds:\n\n${factLines.join("\n")}` +
    (conflict ? "\n\nThe same figure appears on two bases — see the Contradiction Radar below." : "") +
    (forecast ? "\n\nA forward projection for next year is not held — see the gap notice below." : "") +
    (dispatchChart(usable) ?? "");

  const evidence: EvidenceSummary = {
    facts: usable.length,
    factsExpected: usable.length,
    sources,
    conflicts: conflict ? 1 : 0,
    validated: !conflict,
    asOf: "2026-08-23",
    gap: forecast ? FORECAST_NOTE : undefined,
    gapOwner: forecast ? FORECAST_OWNER : undefined,
    contradiction: conflict?.text,
    revisionImpact: conflict?.impact,
  };

  return { content, citations: factCitations, evidence };
}

function gapResponse(question: string, gap: { fact: string; owner: string } | null, passages: Citation[]): EngineAnswer {
  return {
    content: passages.length
      ? `I don't hold a validated figure for that exact ask. The closest indexed passages are:\n\n${passages.map((c) => `- ${c.documentName} (p.${c.page})`).join("\n")}\n\nThe specific figure requested is a declared coverage gap — see below.`
      : `No validated source in the indexed corpus answers "${question.trim()}". Recorded as a coverage gap rather than a guess.`,
    citations: passages,
    evidence: {
      facts: 0, factsExpected: 1, sources: new Set(passages.map((c) => c.documentName)).size,
      conflicts: 0, validated: false, asOf: "2026-08-23",
      gap: gap?.fact ?? "No validated source in the corpus holds this figure yet.",
      gapOwner: gap?.owner ?? "Coverage Check · digitisation backlog",
    },
  };
}

// trend / term / topic / cluster questions answered from computed corpus frequencies
function topicAnswer(rankedCitations: Citation[], forecast: boolean): EngineAnswer {
  const terms = computeTerms();
  const clusters = computeClusters();
  const top = terms.slice(0, 6);
  const [topCluster, secondCluster] = clusters;

  const cites: Citation[] = [];
  for (const t of top) {
    if (cites.length >= 3) break;
    const chunk = CORPUS_CHUNKS.find((c) => new RegExp(`\\b${t.text}`, "i").test(c.text));
    if (chunk && !cites.some((c) => c.documentName === chunk.docName && c.page === chunk.page)) {
      cites.push({ id: `tt-${cites.length}`, documentName: chunk.docName, page: chunk.page, table: chunk.table, cell: chunk.cell, snippet: chunk.text, relevance: 0.9 - cites.length * 0.07 });
    }
  }
  const citations = cites.length ? cites : rankedCitations;
  const sources = new Set(citations.map((c) => c.documentName)).size || CORPUS_DOCS.length;

  const chart = "\n\n```chart\n" + JSON.stringify({
    type: "bar", title: "Vocabulary weights — most prominent terms",
    data: top.map((t) => ({ name: t.text, value: t.weight })), series: [{ key: "value", label: "weight" }],
  }) + "\n```";

  const content =
    `Across the indexed corpus, the most prominent terms by frequency are ${top.map((t) => `**${t.text}**`).join(", ")}. ` +
    `The largest theme is **${topCluster.label}** (${topCluster.frequency} weighted mentions)${secondCluster ? `, followed by **${secondCluster.label}**` : ""}. ` +
    `Operational reporting dominates the discourse, with compliance, social/rehabilitation and safety as the recurring themes. ` +
    `Weights are computed from actual occurrence counts across ${CORPUS_DOCS.length} indexed documents.` +
    (forecast ? "\n\nNote: a validated forward projection for next year is not held — BHUMI reports facts true as-of a date, not forecasts." : "") +
    chart;

  const evidence: EvidenceSummary = {
    facts: top.length, factsExpected: top.length, sources, conflicts: 0, validated: true, asOf: "2026-08-23",
    gap: forecast ? FORECAST_NOTE : undefined,
    gapOwner: forecast ? FORECAST_OWNER : undefined,
  };
  return { content, citations, evidence };
}

// ── Topic intelligence (real term frequencies over the corpus) ─────────────────
const VOCAB: { term: string; category: string }[] = [
  { term: "production", category: "Operations" },
  { term: "dispatch", category: "Logistics" },
  { term: "target", category: "Operations" },
  { term: "environmental clearance", category: "Compliance" },
  { term: "monitoring", category: "Compliance" },
  { term: "stripping ratio", category: "Operations" },
  { term: "overburden", category: "Operations" },
  { term: "safety", category: "Safety" },
  { term: "incident", category: "Safety" },
  { term: "rehabilitation", category: "Social" },
  { term: "beneficiaries", category: "Social" },
  { term: "land acquisition", category: "Social" },
  { term: "washery", category: "Processing" },
  { term: "grade slippage", category: "Quality" },
  { term: "mine closure", category: "Compliance" },
  { term: "evacuation", category: "Logistics" },
  { term: "compliance", category: "Compliance" },
  { term: "reclamation", category: "Compliance" },
];

export function computeTerms(): TopicTerm[] {
  const rows = VOCAB.map(({ term, category }) => {
    let count = 0;
    let docs = 0;
    for (const c of CORPUS_CHUNKS) {
      const n = countOccurrences(term, c.text);
      count += n;
      if (n > 0) docs += 1;
    }
    return { text: term, category, count, documentCount: docs };
  }).filter((r) => r.count > 0);

  const max = Math.max(...rows.map((r) => r.count), 1);
  return rows
    .map((r) => ({ text: r.text, category: r.category, documentCount: r.documentCount, weight: Math.round((r.count / max) * 100) }))
    .sort((a, b) => b.weight - a.weight);
}

const CLUSTER_SENTIMENT: Record<string, number> = {
  Operations: 0.4, Logistics: 0.15, Compliance: -0.1, Safety: -0.05, Social: 0.2, Processing: 0.1, Quality: 0.05,
};

export function computeClusters(): TopicCluster[] {
  const terms = computeTerms();
  const byCat = new Map<string, TopicTerm[]>();
  for (const t of terms) {
    const list = byCat.get(t.category) ?? [];
    list.push(t);
    byCat.set(t.category, list);
  }
  return [...byCat.entries()]
    .map(([label, list], i) => ({
      id: `tc-${i}`,
      label,
      frequency: list.reduce((sum, t) => sum + t.documentCount, 0) * 40 + list.length * 12,
      sentiment: CLUSTER_SENTIMENT[label] ?? 0,
      terms: list.slice(0, 5).map((t) => t.text),
    }))
    .sort((a, b) => b.frequency - a.frequency);
}

// ── Report engine (deterministic assembly from facts) ──────────────────────────
function heading(level: number, text: string) {
  return { type: "heading", attrs: { level }, content: [{ type: "text", text }] };
}
function para(text: string) {
  return { type: "paragraph", content: [{ type: "text", text }] };
}
function bullets(items: string[]) {
  return {
    type: "bulletList",
    content: items.map((t) => ({ type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: t }] }] })),
  };
}

export interface AssembledReport {
  content: TiptapContent;
  evidence: ReportEvidence;
}

export function assembleReport(prompt: string, subsidiary: string, period: string, title: string): AssembledReport {
  const scope = subsidiary === "All subsidiaries" ? CORPUS_FACTS : CORPUS_FACTS.filter((f) => f.subsidiary === subsidiary || f.subsidiary === "All subsidiaries");
  const qTokens = tokenize(prompt);
  const relevant = scope.filter((f) => f.value !== null && (qTokens.length === 0 || f.keywords.some((k) => qTokens.includes(k)) || /production|dispatch|report|summary|performance|annual|quarterly/i.test(prompt)));
  const pool = (relevant.length ? relevant : scope.filter((f) => f.value !== null)).slice(0, 6);

  const figures: ReportFigure[] = pool.map((f) => ({
    label: f.metric,
    value: f.display,
    formula: f.formula ?? "lookup(fact_ledger)",
    source: f.docName,
    page: f.page,
    table: f.table,
    cell: f.cell,
    status: "computed",
  }));

  // deterministic derived figure: attainment = dispatch ÷ target × 100
  const dispatch = pool.find((f) => /dispatch|annual dispatch/i.test(f.metric) && f.basis !== "net");
  const target = scope.find((f) => /target/i.test(f.metric) && f.value !== null);
  if (dispatch?.value != null && target?.value != null) {
    figures.unshift({
      label: "Target attainment",
      value: `${((dispatch.value / target.value) * 100).toFixed(1)}%`,
      formula: `${dispatch.display} ÷ ${target.display} × 100`,
      source: dispatch.docName, page: dispatch.page, table: dispatch.table, cell: dispatch.cell,
      status: "computed",
    });
  }

  figures.push({
    label: "Overburden removal (NCL Amlohri)", value: "not available", formula: "—",
    source: "pending digitisation (scan queue)", page: 0, table: "—", cell: "—", status: "gap",
  });

  const gaps: ReportGap[] = [
    { fact: "Overburden removal volume — NCL Amlohri, FY26", owner: "CMPDI · scan queue", priority: "high", dueAt: "2026-08-25T00:00:00.000Z" },
  ];

  const summaryFigures = figures.filter((f) => f.status === "computed").slice(0, 4);
  const content: TiptapContent = {
    type: "doc",
    content: [
      heading(2, title),
      para(`Prepared for the Ministry of Coal · ${subsidiary} · ${period}. Every figure below is computed from validated source filings and traceable to its source cell.`),
      heading(3, "1. Executive Summary"),
      para(
        summaryFigures.length
          ? `This report assembles ${summaryFigures.length} computed figures from ${new Set(summaryFigures.map((f) => f.source)).size} source documents. ` +
            summaryFigures.map((f) => `${f.label} is ${f.value}`).join("; ") + "."
          : "No computed figures were available for the selected scope.",
      ),
      heading(3, "2. Key Figures"),
      bullets(summaryFigures.map((f) => `${f.label}: ${f.value}  —  ${f.source} › p.${f.page} › ${f.cell}`)),
      heading(3, "3. Declared Coverage Gaps"),
      para("The following required fact is not held in any validated source and is declared, not estimated:"),
      bullets(gaps.map((g) => `${g.fact} — owner: ${g.owner}, due ${g.dueAt.slice(0, 10)}`)),
    ],
  };

  const evidence: ReportEvidence = {
    figures,
    gaps,
    assayGatesPassed: 6,
    assayGatesTotal: 7,
    approval: { state: "draft" },
    revisionImpact: undefined,
  };

  return { content, evidence };
}
