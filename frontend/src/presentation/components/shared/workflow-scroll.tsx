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
      <section className="sticky top-0 flex h-screen flex-col justify-center overflow-hidden bg-surface-soft px-4 sm:px-6">
        <div
          className="pointer-events-none absolute inset-x-0 top-0 h-[420px] bg-cover bg-top opacity-[0.06]"
          style={{
            backgroundImage: "url(/background/section-topo.png)",
            transform: `translateY(${progress * -60}px)`,
          }}
          aria-hidden
        />

        <div className="relative mx-auto w-full max-w-6xl">
          <p className="type-caption text-primary-500 uppercase">How it works</p>
          <h2 className="display-md mt-2 max-w-xl text-ink-0">
            From a shelf of scanned files to a defensible answer
          </h2>

          <div className="mt-10 grid gap-10 lg:grid-cols-[280px_1fr] lg:gap-16">
            <ol className="flex gap-3 overflow-x-auto lg:flex-col lg:gap-2 lg:overflow-visible">
              {STAGES.map((stage, i) => {
                const active = i === activeIndex;
                return (
                  <li key={stage.title} className="shrink-0 lg:shrink">
                    <div
                      className={cn(
                        "flex items-center gap-3 rounded-xl border px-3.5 py-3 transition-all duration-500",
                        active
                          ? "card-raise border-hairline bg-surface-card"
                          : "border-transparent opacity-45",
                      )}
                    >
                      <span className="numeral text-[13px] text-muted-soft">0{i + 1}</span>
                      <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg", stage.tint)}>
                        <stage.icon className="size-4" aria-hidden />
                      </span>
                      <span className="text-[13.5px] font-medium whitespace-nowrap text-ink-0">{stage.title}</span>
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="relative min-h-40">
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
                  <span className={cn("grid size-14 place-items-center rounded-2xl", stage.tint)}>
                    <stage.icon className="size-6" aria-hidden />
                  </span>
                  <h3 className="display-sm mt-5 text-ink-0">{stage.title}</h3>
                  <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-body">{stage.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-12 h-1 w-full overflow-hidden rounded-full bg-hairline">
            <div
              className="h-full rounded-full bg-primary-500 transition-[width] duration-150 ease-out"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
