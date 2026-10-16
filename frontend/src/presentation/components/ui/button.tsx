"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "./cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "accent";
type Size = "sm" | "md";

const VARIANTS: Record<Variant, string> = {
  primary: "bg-navy-900 text-white hover:bg-navy-800 disabled:bg-navy-300",
  accent: "bg-amber-brand-500 text-white hover:bg-amber-brand-600 disabled:bg-amber-brand-200",
  secondary: "bg-white text-navy-800 ring-1 ring-inset ring-navy-200 hover:bg-navy-50 disabled:text-navy-300",
  ghost: "bg-transparent text-navy-600 hover:bg-navy-50 hover:text-navy-900",
  danger: "bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-9.5 px-4 text-sm gap-2",
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
        "inline-flex items-center justify-center rounded-lg font-medium transition-colors disabled:cursor-not-allowed",
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
