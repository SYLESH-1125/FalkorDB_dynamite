"use client";

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { CHART_COLORS, AXIS_STYLE, TOOLTIP_STYLE, GRID_STROKE, AXIS_LINE } from "./palette";

const GRID = { stroke: GRID_STROKE, strokeDasharray: "2 4" };
const LEGEND_STYLE = { fontSize: 11.5, paddingTop: 8, fontFamily: "var(--font-inter)" };

export function TrendLineChart({
  data, series, height = 260,
}: {
  data: readonly object[];
  series: { key: string; label: string; axis?: "left" | "right" }[];
  height?: number | `${number}%`;
}) {
  const usesRight = series.some((s) => s.axis === "right");
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="period" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: AXIS_LINE }} />
        <YAxis yAxisId="left" tick={AXIS_STYLE} tickLine={false} axisLine={false} width={44} />
        {usesRight ? (
          <YAxis yAxisId="right" orientation="right" tick={AXIS_STYLE} tickLine={false} axisLine={false} width={44} />
        ) : null}
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={7} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            yAxisId={s.axis === "right" ? "right" : "left"}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendAreaChart({
  data, dataKey, label, height = 220,
}: {
  data: readonly object[];
  dataKey: string;
  label: string;
  height?: number | `${number}%`;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#12304a" stopOpacity={0.26} />
            <stop offset="100%" stopColor="#12304a" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="period" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: AXIS_LINE }} />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={44} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={label}
          stroke="#12304a"
          strokeWidth={2}
          fill={`url(#grad-${dataKey})`}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function CategoryBarChart({
  data, xKey, series, height = 260, layout = "horizontal",
}: {
  data: readonly object[];
  xKey: string;
  series: { key: string; label: string }[];
  height?: number | `${number}%`;
  layout?: "horizontal" | "vertical";
}) {
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 6, right: 12, left: vertical ? 8 : 0, bottom: 0 }}
        barCategoryGap={vertical ? "22%" : "28%"}
      >
        <CartesianGrid {...GRID} vertical={vertical} horizontal={!vertical} />
        {vertical ? (
          <>
            <XAxis type="number" tick={AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis type="category" dataKey={xKey} tick={AXIS_STYLE} tickLine={false} axisLine={false} width={96} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: AXIS_LINE }} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={44} />
          </>
        )}
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(28,70,147,0.06)" }} />
        {series.length > 1 ? <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={7} /> : null}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={CHART_COLORS[i % CHART_COLORS.length]}
            radius={vertical ? [0, 5, 5, 0] : [5, 5, 0, 0]}
            maxBarSize={vertical ? 18 : 44}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

export function DonutChart({
  data, height = 260,
}: {
  data: { name: string; value: number }[];
  height?: number | `${number}%`;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="56%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="#ffffff"
          strokeWidth={2}
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" iconSize={7} />
      </PieChart>
    </ResponsiveContainer>
  );
}
