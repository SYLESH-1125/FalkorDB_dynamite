export type DocumentStatus =
  | "queued" | "uploading" | "processing" | "extracted" | "validated" | "error";

export type DocumentKind = "pdf" | "scan" | "spreadsheet" | "image" | "docx";

export interface IngestedDocument {
  id: string;
  name: string;
  kind: DocumentKind;
  sizeBytes: number;
  status: DocumentStatus;
  progress: number;
  subsidiary: string;
  uploadedBy: string;
  uploadedAt: string;
  pageCount: number;
  confidence: number;
  errorMessage?: string;
}

export type PipelineStageName =
  | "Ingestion" | "OCR / Digitization" | "Table Extraction"
  | "Entity Recognition" | "Indexing";

export type PipelineStageStatus = "pending" | "running" | "complete" | "failed";

export interface PipelineStage {
  name: PipelineStageName;
  status: PipelineStageStatus;
  progress: number;
  durationMs: number;
  message: string;
}

export interface ProcessingJob {
  id: string;
  documentId: string;
  documentName: string;
  stages: PipelineStage[];
  startedAt: string;
  ocrEngine: string;
  language: string;
}
