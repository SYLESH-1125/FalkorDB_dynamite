"use client";

import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import { CHART_COLORS, AXIS_STYLE, TOOLTIP_STYLE } from "./palette";

const GRID = { stroke: "#e2ebf5", strokeDasharray: "3 3" };

export function TrendLineChart({
  data, series, height = 260,
}: {
  data: Record<string, unknown>[];
  series: { key: string; label: string }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="period" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: "#e2ebf5" }} />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={48} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={7} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function TrendAreaChart({
  data, dataKey, label, height = 220,
}: {
  data: Record<string, unknown>[];
  dataKey: string;
  label: string;
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id={`grad-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e06f22" stopOpacity={0.28} />
            <stop offset="100%" stopColor="#e06f22" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid {...GRID} vertical={false} />
        <XAxis dataKey="period" tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: "#e2ebf5" }} />
        <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={48} />
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Area
          type="monotone"
          dataKey={dataKey}
          name={label}
          stroke="#e06f22"
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
  data: Record<string, unknown>[];
  xKey: string;
  series: { key: string; label: string }[];
  height?: number;
  layout?: "horizontal" | "vertical";
}) {
  const vertical = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={layout}
        margin={{ top: 6, right: 12, left: vertical ? 8 : -18, bottom: 0 }}
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
            <XAxis dataKey={xKey} tick={AXIS_STYLE} tickLine={false} axisLine={{ stroke: "#e2ebf5" }} />
            <YAxis tick={AXIS_STYLE} tickLine={false} axisLine={false} width={48} />
          </>
        )}
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "rgba(224,111,34,0.06)" }} />
        {series.length > 1 ? <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={7} /> : null}
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
  height?: number;
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
          stroke="none"
        >
          {data.map((entry, i) => (
            <Cell key={entry.name} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} />
        <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={7} />
      </PieChart>
    </ResponsiveContainer>
  );
}
