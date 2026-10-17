export type QueryPriority = "critical" | "high" | "normal";

export type QueryStage =
  | "received" | "assigned" | "drafting" | "review" | "answered";

export interface ParliamentaryQuery {
  id: string;
  referenceNo: string;
  subject: string;
  house: "Lok Sabha" | "Rajya Sabha";
  memberName: string;
  priority: QueryPriority;
  stage: QueryStage;
  receivedAt: string;
  dueAt: string;
  assignedTo: string;
  subsidiary: string;
  linkedReportIds: string[];
}
