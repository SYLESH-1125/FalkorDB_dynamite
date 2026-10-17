"use client";

import type { ReactNode } from "react";
import { useScrollReveal } from "@/src/application/hooks/use-scroll-reveal";
import { cn } from "../ui/cn";

export function Reveal({
  children, className, delay = 0, from = "up",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  from?: "up" | "left" | "right";
}) {
  const { ref, visible } = useScrollReveal<HTMLDivElement>();

  const offset = { up: "translate-y-8", left: "-translate-x-8", right: "translate-x-8" }[from];

  return (
    <div
      ref={ref}
      className={cn(
        "transition-all duration-700 ease-out",
        visible ? "translate-x-0 translate-y-0 opacity-100" : `opacity-0 ${offset}`,
        className,
      )}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
