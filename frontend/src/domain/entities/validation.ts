export type FieldStatus = "validated" | "pending" | "error";

export interface ExtractedField {
  id: string;
  label: string;
  extractedValue: string;
  correctedValue: string | null;
  confidence: number;
  status: FieldStatus;
  pageRef: number;
  boundingBoxHint: string;
}

export interface ValidationRecord {
  id: string;
  documentId: string;
  documentName: string;
  subsidiary: string;
  assignedTo: string;
  submittedAt: string;
  fields: ExtractedField[];
}
