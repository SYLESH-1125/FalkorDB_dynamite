export interface BrainPathStep {
  fromLabel: string;
  relationship: string;
  toLabel: string;
}

export interface BrainSource {
  label: string;
  kind: string;
  nodeId: string;
  detail: string;
}

export interface BrainAnswer {
  answer: string;
  intent: string;
  tool?: string;
  path: BrainPathStep[];
  sources: BrainSource[];
  cypher: string;
  remembered: string[];
}

export interface BrainBrief {
  graph: string;
  counts: Record<string, number>;
  centralPeople: { name: string; role: string; connections: number }[];
  recentDecisions: { title: string; decidedOn: string; summary: string }[];
}

export interface BrainFact {
  title: string;
  summary: string;
  decidedBy: string;
  basedOn: string;
  affects: string;
}
