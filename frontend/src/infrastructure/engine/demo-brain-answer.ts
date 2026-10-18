import type { BrainAnswer } from "@/src/domain/entities/brain";
import { answerQuestion } from "./knowledge-engine";

export function demoBrainAnswer(question: string): BrainAnswer {
  const engine = answerQuestion(question);
  return {
    answer: engine.content,
    intent: "demo-corpus",
    tool: "knowledge-engine",
    path: engine.citations.slice(0, 4).map((c) => ({
      fromLabel: "Your question",
      relationship: "GROUNDED_IN",
      toLabel: `${c.documentName} (p.${c.page})`,
    })),
    sources: engine.citations.map((c, index) => ({
      label: c.documentName,
      kind: "Document",
      nodeId: `demo-corpus-${index}`,
      detail: `Page ${c.page}${c.table ? ` · ${c.table}` : ""}`,
    })),
    cypher: "MATCH (d:Document)-[:SUPPORTS]->(fact) WHERE fact.text CONTAINS $q RETURN d, fact LIMIT 8",
    remembered: [],
  };
}
