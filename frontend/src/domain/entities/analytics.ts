export interface KpiMetric {
  id: string;
  label: string;
  value: string;
  rawValue: number;
  delta: number;
  unit: string;
  trend: "up" | "down" | "flat";
  helpText: string;
}

export interface TimeSeriesPoint {
  period: string;
  reports: number;
  queries: number;
  documents: number;
}

export interface CategoryDatum {
  name: string;
  value: number;
}

export interface SubsidiaryPerformance {
  subsidiary: string;
  production: number;
  target: number;
  accuracy: number;
  reports: number;
  pendingQueries: number;
  variance: number;
}

export interface ActivityEvent {
  id: string;
  actor: string;
  action: string;
  target: string;
  createdAt: string;
  kind: "upload" | "report" | "validation" | "query" | "system";
}

export interface PipelineStageSummary {
  stage: string;
  count: number;
  share: number;
}

export interface IngestionHeatCell {
  day: string;
  hour: number;
  value: number;
}

export interface AccuracyTrendPoint {
  period: string;
  accuracy: number;
  humanCorrections: number;
}

export interface StorageBreakdown {
  kind: string;
  documents: number;
  sizeGb: number;
}

export interface QueryHighlight {
  id: string;
  question: string;
  askedBy: string;
  askedAt: string;
  citationCount: number;
  responseMs: number;
}

export interface DeadlineItem {
  id: string;
  referenceNo: string;
  subject: string;
  dueAt: string;
  priority: "critical" | "high" | "normal";
  assignedTo: string;
}

export interface SystemHealth {
  ocrQueueDepth: number;
  avgLatencyMs: number;
  uptimePercent: number;
  indexFreshnessMin: number;
  activeUsers: number;
  storageUsedGb: number;
  storageTotalGb: number;
}

export interface DashboardSnapshot {
  kpis: KpiMetric[];
  timeSeries: TimeSeriesPoint[];
  categories: CategoryDatum[];
  performance: SubsidiaryPerformance[];
  activity: ActivityEvent[];
  pipeline: PipelineStageSummary[];
  heatmap: IngestionHeatCell[];
  accuracyTrend: AccuracyTrendPoint[];
  storage: StorageBreakdown[];
  topQueries: QueryHighlight[];
  deadlines: DeadlineItem[];
  health: SystemHealth;
  topTerms: { text: string; weight: number }[];
}
