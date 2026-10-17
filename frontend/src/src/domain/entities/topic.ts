export interface TopicTerm {
  text: string;
  weight: number;
  documentCount: number;
  category: string;
}

export interface TopicCluster {
  id: string;
  label: string;
  frequency: number;
  sentiment: number;
  terms: string[];
}
