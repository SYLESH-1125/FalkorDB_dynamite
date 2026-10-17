"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { GitBranch, Network, Sparkles } from "lucide-react";
import { graphFlowForPath } from "@/src/application/services/graph-flow-copy";
import { cn } from "../ui/cn";

export function GraphFlowRail({ className }: { className?: string }) {
  const pathname = usePathname();
  const story = graphFlowForPath(pathname);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => setStep((s) => (s + 1) % 3), 3200);
    return () => window.clearInterval(id);
  }, [pathname]);

  const steps = [
    { icon: Sparkles, label: "Ask", text: story.ask },
    { icon: Network, label: "Walk", text: story.walk },
    { icon: GitBranch, label: "Prove", text: story.prove },
  ];

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-hairline bg-surface-card/90 backdrop-blur-sm",
        className,
      )}
    >
      <div className="graph-flow-shimmer pointer-events-none absolute inset-0 opacity-40" aria-hidden />
      <div className="relative mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:gap-6">
        <p className="shrink-0 text-[10.5px] font-semibold tracking-[0.16em] text-primary-600 uppercase">
          {story.track}
        </p>
        <ol className="grid flex-1 gap-2 sm:grid-cols-3">
          {steps.map(({ icon: Icon, label, text }, i) => (
            <li
              key={label}
              className={cn(
                "flex items-start gap-2 rounded-lg border px-2.5 py-2 transition-all duration-500",
                step === i
                  ? "border-secondary-400/60 bg-secondary-50/80 shadow-sm"
                  : "border-transparent bg-surface-soft/50",
              )}
            >
              <span
                className={cn(
                  "mt-0.5 grid size-6 shrink-0 place-items-center rounded-md",
                  step === i ? "bg-primary-600 text-white" : "bg-tint-navy text-primary-600",
                )}
              >
                <Icon className="size-3.5" aria-hidden />
              </span>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold tracking-wide text-muted uppercase">{label}</p>
                <p className="text-[11.5px] leading-snug text-body">{text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
