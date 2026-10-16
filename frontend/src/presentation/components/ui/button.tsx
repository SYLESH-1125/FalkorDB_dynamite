"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-primary-600 text-white hover:bg-primary-700 disabled:bg-hairline-strong disabled:text-white",
  accent: "bg-secondary-400 text-ink-0 hover:bg-secondary-300 disabled:bg-secondary-100",
  secondary:
    "bg-surface-card text-body-strong ring-1 ring-inset ring-hairline-strong hover:bg-surface-soft disabled:text-muted-soft",
  ghost: "bg-transparent text-body hover:bg-surface-soft hover:text-ink-0",
  danger: "bg-danger text-white hover:bg-danger/90 disabled:bg-danger/40",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3.5 text-[12.5px] gap-1.5",
  md: "h-9.5 px-4.5 text-[13.5px] gap-2",
};

export function Button({
  variant = "primary", size = "md", className, children, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  children: ReactNode;
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md font-medium whitespace-nowrap transition-colors disabled:cursor-not-allowed",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
