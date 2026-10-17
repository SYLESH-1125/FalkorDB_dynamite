"use client";

import { Upload, ScanText, CheckSquare, FileBarChart, type LucideIcon } from "lucide-react";
import { useScrollProgress } from "@/src/application/hooks/use-scroll-reveal";
import { cn } from "../ui/cn";

interface Stage {
  icon: LucideIcon;
  title: string;
  body: string;
  tint: string;
}

const STAGES: Stage[] = [
  {
    icon: Upload,
    title: "Ingest",
    body: "Drop in PDFs, decades-old scans, spreadsheets and photographs. Everything lands in one upload queue, whatever the format.",
    tint: "bg-tint-navy text-primary-500",
  },
  {
    icon: ScanText,
    title: "Digitise",
    body: "Layout-aware OCR extracts every field and table, scoring each one by confidence so nothing silently slips through wrong.",
    tint: "bg-tint-gold text-secondary-600",
  },
  {
    icon: CheckSquare,
    title: "Validate",
    body: "Low-confidence extractions route to a human reviewer, source scan alongside the parsed value, before anything is published.",
    tint: "bg-tint-leaf text-success",
  },
  {
    icon: FileBarChart,
    title: "Report",
    body: "Query the validated corpus in plain language or generate a statutory brief — every figure still traces back to its page.",
    tint: "bg-tint-red text-danger",
  },
];

export function WorkflowScroll() {
  const { ref, progress } = useScrollProgress<HTMLDivElement>();
  const activeIndex = Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length));

  return (
    <div ref={ref} className="relative" style={{ height: `${STAGES.length * 70}vh` }}>
      <section className="gradient-mesh-light sticky top-0 flex h-screen flex-col justify-center overflow-hidden px-4 sm:px-6">
        <div
          className="grid-overlay pointer-events-none absolute inset-x-0 top-0 h-[420px] opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent)]"
          style={{ transform: `translateY(${progress * -60}px)` }}
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-6xl">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-card px-3.5 py-1.5 text-[12px] font-semibold text-primary-600 shadow-sm">
            How it works
          </span>
          <h2 className="display-lg mt-4 max-w-xl text-ink-0">
            From a shelf of scanned files to a defensible answer
          </h2>

          <div className="mt-12 grid gap-10 lg:grid-cols-[300px_1fr] lg:gap-16">
            <ol className="flex gap-3 overflow-x-auto lg:flex-col lg:gap-2.5 lg:overflow-visible">
              {STAGES.map((stage, i) => {
                const active = i === activeIndex;
                return (
                  <li key={stage.title} className="shrink-0 lg:shrink">
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-4 py-3.5 transition-all duration-500",
                        active
                          ? "card-float border-primary-200 bg-surface-card"
                          : "border-transparent opacity-40",
                      )}
                    >
                      <span className={cn("numeral text-[13px]", active ? "text-primary-500" : "text-muted-soft")}>
                        0{i + 1}
                      </span>
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg transition-transform duration-500", active && "scale-110", stage.tint)}>
                        <stage.icon className="size-4" aria-hidden />
                      </span>
                      <span className="text-[13.5px] font-medium whitespace-nowrap text-ink-0">{stage.title}</span>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="relative min-h-44">
              {STAGES.map((stage, i) => (
                <div
                  key={stage.title}
                  className={cn(
                    "absolute inset-0 transition-all duration-500 ease-out",
                    i === activeIndex
                      ? "translate-y-0 opacity-100"
                      : i < activeIndex
                        ? "-translate-y-4 opacity-0"
                        : "translate-y-4 opacity-0",
                  )}
                  aria-hidden={i !== activeIndex}
                >
                  <span className={cn("grid size-16 place-items-center rounded-2xl shadow-sm", stage.tint)}>
                    <stage.icon className="size-7" aria-hidden />
                  </span>
                  <h3 className="display-sm mt-6 text-ink-0">{stage.title}</h3>
                  <p className="mt-3.5 max-w-lg text-[15px] leading-relaxed text-body">{stage.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 h-1 w-full overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary-500 to-secondary-400 transition-[width] duration-150 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
