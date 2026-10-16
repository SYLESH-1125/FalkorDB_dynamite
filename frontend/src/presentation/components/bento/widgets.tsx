"use client";

import type { IngestionHeatCell } from "@/src/domain/entities/analytics";
import { cn } from "../ui/cn";

export function Sparkline({
  values, className, stroke = "#e06f22", fill = true,
}: {
  values: number[];
  className?: string;
  stroke?: string;
  fill?: boolean;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const points = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 30 - ((v - min) / span) * 24 - 3;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const id = `spark-${stroke.replace("#", "")}`;

  return (
    <svg viewBox="0 0 100 30" preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {fill ? <polygon points={`0,30 ${points.join(" ")} 100,30`} fill={`url(#${id})`} /> : null}
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function RadialGauge({
  value, label, sublabel, size = 132,
}: {
  value: number;
  label: string;
  sublabel?: string;
  size?: number;
}) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.min(value, 100) / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <svg viewBox="0 0 128 128" className="size-full -rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth={11} />
          <circle
            cx="64" cy="64" r={radius} fill="none"
            stroke="#f0ac68" strokeWidth={11} strokeLinecap="round"
            strokeDasharray={`${dash} ${circumference}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="font-serif text-3xl leading-none font-semibold text-white">{label}</span>
        </div>
      </div>
      {sublabel ? <p className="mt-2 text-center text-[11px] text-white/60">{sublabel}</p> : null}
    </div>
  );
}

const HEAT_STEPS = [
  "bg-navy-50", "bg-amber-brand-100", "bg-amber-brand-200",
  "bg-amber-brand-300", "bg-amber-brand-500",
];

export function IngestionHeatmap({ cells }: { cells: IngestionHeatCell[] }) {
  const days = [...new Set(cells.map((c) => c.day))];
  const hours = [...new Set(cells.map((c) => c.hour))].sort((a, b) => a - b);
  const max = Math.max(...cells.map((c) => c.value), 1);

  function step(value: number) {
    if (value === 0) return HEAT_STEPS[0];
    return HEAT_STEPS[Math.min(HEAT_STEPS.length - 1, Math.ceil((value / max) * (HEAT_STEPS.length - 1)))];
  }

  return (
    <div className="min-w-0">
      <div className="scrollbar-thin overflow-x-auto">
        <table className="border-separate border-spacing-[3px]">
          <caption className="sr-only">Document ingestion volume by day and hour</caption>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <th scope="row" className="pr-1.5 text-right align-middle text-[9px] font-medium text-navy-400">
                  {day}
                </th>
                {hours.map((hour) => {
                  const cell = cells.find((c) => c.day === day && c.hour === hour);
                  const value = cell?.value ?? 0;
                  return (
                    <td key={hour} className="p-0">
                      <span
                        title={`${day} ${hour}:00 — ${value} documents`}
                        className={cn("block size-[13px] rounded-[3px]", step(value))}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
            <tr>
              <td />
              {hours.map((hour) => (
                <td key={hour} className="pt-1 text-center text-[8px] text-navy-300">
                  {hour % 3 === 0 ? hour : ""}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-2.5 flex items-center gap-1.5">
        <span className="text-[9px] text-navy-400">Less</span>
        {HEAT_STEPS.map((s) => <span key={s} className={cn("size-2.5 rounded-[2px]", s)} />)}
        <span className="text-[9px] text-navy-400">More</span>
      </div>
    </div>
  );
}

export function MiniBars<T extends object>({
  items, valueKey, labelKey, max: providedMax,
}: {
  items: readonly T[];
  valueKey: keyof T;
  labelKey: keyof T;
  max?: number;
}) {
  const max = providedMax ?? Math.max(...items.map((i) => Number(i[valueKey])), 1);
  return (
    <ul className="space-y-2">
      {items.map((item) => {
        const value = Number(item[valueKey]);
        return (
          <li key={String(item[labelKey])}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[11px] text-navy-600">{String(item[labelKey])}</span>
              <span className="shrink-0 text-[11px] font-medium tabular-nums text-navy-900">
                {value.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
              <div className="h-full rounded-full bg-amber-brand-500" style={{ width: `${(value / max) * 100}%` }} />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
