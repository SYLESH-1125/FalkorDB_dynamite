export type GraphNodeKind =
  | "Document"
  | "Subsidiary"
  | "Mine"
  | "Person"
  | "Team"
  | "Project"
  | "Decision"
  | "Ticket"
  | "Chat"
  | "Memory"
  | "Unknown";

export interface GraphNode {
  id: string;
  kind: GraphNodeKind;
  label: string;
  properties: Record<string, string>;
}

export type GraphRelationType = "BELONGS_TO" | "REFERENCES" | string;

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
