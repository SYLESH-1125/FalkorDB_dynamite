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
