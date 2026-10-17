export type ReportStatus = "draft" | "generating" | "published" | "archived";

export type ExportFormat = "PDF" | "DOCX" | "XLSX";

export interface Report {
  id: string;
  title: string;
  templateId: string;
  templateName: string;
  status: ReportStatus;
  version: number;
  subsidiary: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  pageCount: number;
  formats: ExportFormat[];
  shareUrl: string | null;
  shareExpiresAt: string | null;
}

export interface ReportVersion {
  version: number;
  changedBy: string;
  changedAt: string;
  summary: string;
}

export type TemplateCategory =
  | "Statutory" | "Operational" | "Parliamentary" | "Environmental" | "Financial";

export interface ReportSection {
  id: string;
  title: string;
  enabled: boolean;
  description: string;
}

export interface ReportTemplate {
  id: string;
  name: string;
  category: TemplateCategory;
  description: string;
  sections: ReportSection[];
  updatedAt: string;
  usageCount: number;
  isDefault: boolean;
  fileKey: string | null;
  fileSizeBytes: number;
  hasFile: boolean;
}

export interface ReportWizardConfig {
  dataSourceIds: string[];
  templateId: string;
  title: string;
  period: string;
  subsidiary: string;
  includeCharts: boolean;
  includeCitations: boolean;
  format: ExportFormat;
}

export interface ReportDraftRequest {
  prompt: string;
  templateId: string;
  dataSourceIds: string[];
  subsidiary: string;
  period: string;
}

// Tiptap/ProseMirror document JSON — opaque to the domain layer, structurally typed
// only as far as the editor and renderers need to walk it.
export type TiptapContent = { type: "doc"; content: unknown[] };

export interface ReportDocument {
  reportId: string;
  prompt: string;
  content: TiptapContent;
  updatedAt: string;
}

export interface ShareLink {
  shareUrl: string;
  expiresAt: string;
}

export interface SharedReport {
  title: string;
  templateName: string;
  subsidiary: string;
  createdBy: string;
  updatedAt: string;
  content: TiptapContent;
}
