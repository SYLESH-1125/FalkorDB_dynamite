export type GraphNodeKind = "Document" | "Subsidiary" | "Mine" | "Block" | "RiskFlag";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  properties: Record<string, string>;
}

export type GraphRelationType = "BELONGS_TO" | "REFERENCES" | "LOCATED_IN" | "FLAGGED_BY";

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: GraphRelationType;
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}
