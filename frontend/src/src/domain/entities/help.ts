export type ResourceKind = "guide" | "video" | "faq" | "download";

export interface HelpResource {
  id: string;
  title: string;
  description: string;
  kind: ResourceKind;
  category: string;
  duration: string;
  updatedAt: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}
