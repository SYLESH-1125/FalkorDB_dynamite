import { BarChart3 } from "lucide-react";
import type { AnalysisChart } from "@/src/domain/entities/analysis-chart";
import { TrendLineChart, TrendAreaChart, CategoryBarChart, DonutChart } from "../charts/charts";
import { Card, CardHeader, CardBody } from "../ui/card";

function firstKey(data: Record<string, string | number>[]): string {
  return data[0] ? Object.keys(data[0])[0] : "period";
}

export function AnalysisChartCard({ chart }: { chart: AnalysisChart }) {
  const xKey = firstKey(chart.data);
  const normalized = chart.data.map((row) => ({ ...row, period: row[xKey] }));

  return (
    <Card>
      <CardHeader title={chart.title} action={<BarChart3 className="size-4 text-ink-0" aria-hidden />} />
      <CardBody>
        {chart.type === "line" && chart.series ? (
          <TrendLineChart data={normalized} series={chart.series} height={260} />
        ) : chart.type === "area" && chart.series?.[0] ? (
          <TrendAreaChart data={normalized} dataKey={chart.series[0].key} label={chart.series[0].label} height={220} />
        ) : chart.type === "bar" && chart.series ? (
          <CategoryBarChart data={chart.data} xKey={xKey} series={chart.series} height={260} />
        ) : chart.type === "donut" ? (
          <DonutChart data={chart.data as unknown as { name: string; value: number }[]} height={260} />
        ) : (
          <p className="text-[13px] text-muted-soft">Chart data could not be rendered.</p>
        )}
      </CardBody>
    </Card>
  );
}
