"use client";

import type { IngestionHeatCell } from "@/src/domain/entities/analytics";
import { cn } from "../ui/cn";

export function Spark({
  values, className, stroke = "#1a3f70", area = true,
}: {
  values: number[];
  className?: string;
  stroke?: string;
  area?: boolean;
}) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * 100;
    const y = 28 - ((v - min) / span) * 22 - 3;
    return `${x.toFixed(2)},${y.toFixed(2)}`;
  });
  const id = `sp-${stroke.slice(1)}`;

  return (
    <svg viewBox="0 0 100 28" preserveAspectRatio="none" className={cn("w-full", className)} aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.24} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      {area ? <polygon points={`0,28 ${pts.join(" ")} 100,28`} fill={`url(#${id})`} /> : null}
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke={stroke}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export function Dial({ value, display, caption }: { value: number; display: string; caption: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (Math.min(value, 100) / 100) * c;
  return (
    <div className="flex h-full flex-col items-center justify-center">
      <div className="relative w-[7.5rem] max-w-full">
        <svg viewBox="0 0 128 128" className="w-full -rotate-90">
          <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(15,42,78,0.18)" strokeWidth={10} />
          <circle
            cx="64" cy="64" r={r} fill="none" stroke="#0f2a4e" strokeWidth={10}
            strokeLinecap="round" strokeDasharray={`${dash} ${c}`}
          />
        </svg>
        <div className="absolute inset-0 grid place-items-center">
          <span className="numeral text-[26px] leading-none text-primary-700">{display}</span>
        </div>
      </div>
      <p className="mt-2.5 text-center text-[11.5px] text-primary-700/75">{caption}</p>
    </div>
  );
}

const HEAT = ["bg-surface-soft", "bg-primary-100", "bg-primary-200", "bg-primary-400", "bg-primary-600"];

export function Heatmap({ cells }: { cells: IngestionHeatCell[] }) {
  const days = [...new Set(cells.map((c) => c.day))];
  const hours = [...new Set(cells.map((c) => c.hour))].sort((a, b) => a - b);
  const max = Math.max(...cells.map((c) => c.value), 1);
  const step = (v: number) =>
    v === 0 ? HEAT[0] : HEAT[Math.min(HEAT.length - 1, Math.ceil((v / max) * (HEAT.length - 1)))];

  return (
    <div className="flex h-full flex-col justify-center gap-3">
      <div className="scrollbar-thin -mx-1 overflow-x-auto px-1">
        <table className="border-separate border-spacing-[2.5px]">
          <caption className="sr-only">Ingestion volume by day and hour</caption>
          <tbody>
            {days.map((day) => (
              <tr key={day}>
                <th scope="row" className="pr-1.5 text-right text-[9px] font-medium text-muted-soft">{day}</th>
                {hours.map((hour) => {
                  const v = cells.find((c) => c.day === day && c.hour === hour)?.value ?? 0;
                  return (
                    <td key={hour} className="p-0">
                      <span
                        title={`${day} ${hour}:00 — ${v} documents`}
                        className={cn("block size-[11px] rounded-[3px]", step(v))}
                      />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-[9px] text-muted-soft">Less</span>
        {HEAT.map((h) => <span key={h} className={cn("size-2 rounded-[3px]", h)} />)}
        <span className="text-[9px] text-muted-soft">More</span>
      </div>
    </div>
  );
}

export function Bars<T extends object>({
  items, valueKey, labelKey, tone = "clay",
}: {
  items: readonly T[];
  valueKey: keyof T;
  labelKey: keyof T;
  tone?: "clay" | "ink";
}) {
  const max = Math.max(...items.map((i) => Number(i[valueKey])), 1);
  return (
    <ul className="flex h-full flex-col justify-between gap-1.5">
      {items.map((item) => {
        const v = Number(item[valueKey]);
        return (
          <li key={String(item[labelKey])}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[11.5px] text-body">{String(item[labelKey])}</span>
              <span className="numeral shrink-0 text-[11.5px] text-ink-0">
                {v.toLocaleString("en-IN")}
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-soft">
              <div
                className={cn("h-full rounded-full", tone === "clay" ? "bg-primary-500" : "bg-secondary-400")}
                style={{ width: `${(v / max) * 100}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
