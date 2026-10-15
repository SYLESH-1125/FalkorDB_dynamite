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
