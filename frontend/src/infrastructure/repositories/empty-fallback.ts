import type { ChatMessage } from "@/src/domain/entities/query";
import type { DashboardSnapshot } from "@/src/domain/entities/analytics";
import type { KnowledgeGraph } from "@/src/domain/entities/graph";
import type { BrainAnswer, BrainBrief } from "@/src/domain/entities/brain";
import type { ReportDocument } from "@/src/domain/entities/report";

export function isEmptyArray<T>(value: T[] | null | undefined): boolean {
  return !value || value.length === 0;
}

export function isEmptyGraph(graph: KnowledgeGraph): boolean {
  return isEmptyArray(graph.nodes) && isEmptyArray(graph.edges);
}

export function isEmptyDashboard(snapshot: DashboardSnapshot): boolean {
  return isEmptyArray(snapshot.kpis) && isEmptyArray(snapshot.timeSeries);
}

export function isEmptyBrainBrief(brief: BrainBrief): boolean {
  const countTotal = Object.values(brief.counts ?? {}).reduce((sum, n) => sum + (n ?? 0), 0);
  return countTotal === 0 && isEmptyArray(brief.centralPeople) && isEmptyArray(brief.recentDecisions);
}

const WEAK_ANSWER_MARKERS = [
  "language model call failed",
  "openrouter",
  "no extracted",
  "no relevant",
  "could not find",
  "insufficient data",
  "not enough data",
  "no data",
  "no values",
  "empty corpus",
];

export function isWeakAssistantText(content: string | undefined | null): boolean {
  const text = (content ?? "").trim();
  if (text.length < 24) return true;
  const lower = text.toLowerCase();
  return WEAK_ANSWER_MARKERS.some((m) => lower.includes(m));
}

export function isWeakChatMessage(message: ChatMessage): boolean {
  return isWeakAssistantText(message.content);
}

export function isWeakBrainAnswer(answer: BrainAnswer): boolean {
  if (isWeakAssistantText(answer.answer)) return true;
  return isEmptyArray(answer.path) && isEmptyArray(answer.sources) && answer.intent !== "preview";
}

export function isEmptyReportDocument(doc: ReportDocument): boolean {
  if (!doc.content) return true;
  const blocks = (doc.content as { content?: unknown[] }).content;
  return Array.isArray(blocks) && blocks.length === 0;
}

export async function withArrayFallback<T>(live: () => Promise<T[]>, mock: () => Promise<T[]>): Promise<T[]> {
  try {
    const value = await live();
    return isEmptyArray(value) ? await mock() : value;
  } catch {
    return mock();
  }
}

export async function withValueFallback<T>(
  live: () => Promise<T>,
  mock: () => Promise<T>,
  isEmpty: (value: T) => boolean,
): Promise<T> {
  try {
    const value = await live();
    return isEmpty(value) ? await mock() : value;
  } catch {
    return mock();
  }
}

export async function withNullableFallback<T>(
  live: () => Promise<T | null>,
  mock: () => Promise<T | null>,
): Promise<T | null> {
  try {
    const value = await live();
    return value ?? await mock();
  } catch {
    return mock();
  }
}

export async function preferLive<T>(live: () => Promise<T>, mock: () => Promise<T>): Promise<T> {
  try {
    return await live();
  } catch {
    return mock();
  }
}
