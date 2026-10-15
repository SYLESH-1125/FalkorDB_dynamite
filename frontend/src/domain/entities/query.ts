export type ChatRole = "user" | "assistant";

export interface Citation {
  id: string;
  documentName: string;
  page: number;
  snippet: string;
  relevance: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  citations: Citation[];
  pending?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export const SUGGESTED_QUERIES: string[] = [
  "Summarise coal production trends across subsidiaries for FY 2025-26",
  "Which mines reported the highest overburden removal last quarter?",
  "List pending environmental clearance issues by state",
  "Compare washery throughput between SECL and MCL",
];
