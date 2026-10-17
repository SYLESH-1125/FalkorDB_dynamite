export type AnalysisChartType = "line" | "bar" | "area" | "donut";

export interface AnalysisChartSeries {
  key: string;
  label: string;
}

export interface AnalysisChart {
  type: AnalysisChartType;
  title: string;
  data: Record<string, string | number>[];
  series?: AnalysisChartSeries[];
}

const CHART_BLOCK = /```chart\s*([\s\S]*?)```/;

export function extractAnalysisChart(content: string): { text: string; chart: AnalysisChart | null } {
  const match = content.match(CHART_BLOCK);
  if (!match) return { text: content, chart: null };

  try {
    const parsed = JSON.parse(match[1].trim());
    if (!parsed.type || !Array.isArray(parsed.data)) {
      return { text: content, chart: null };
    }
    return { text: content.replace(CHART_BLOCK, "").trim(), chart: parsed as AnalysisChart };
  } catch {
    return { text: content, chart: null };
  }
}
