"use client";

import Link from "next/link";
import {
  MessageSquareText, Cloud, TrendingUp, Share2, FileBarChart, Landmark, ArrowUpRight,
  type LucideIcon,
} from "lucide-react";
import { Reveal } from "./reveal";

interface Module {
  icon: LucideIcon;
  tint: string;
  title: string;
  body: string;
  href: string;
}

const MODULES: Module[] = [
  {
    icon: MessageSquareText,
    tint: "bg-tint-navy text-primary-500",
    title: "AI Query System",
    body: "Ask in plain English or Hindi. Every answer is grounded in your own indexed documents, never a general-purpose guess.",
    href: "/query",
  },
  {
    icon: Cloud,
    tint: "bg-tint-gold text-secondary-600",
    title: "Word Cloud & Topics",
    body: "Surface the terms and clusters dominating your corpus, so emerging issues are visible before they reach parliament.",
    href: "/topics",
  },
  {
    icon: TrendingUp,
    tint: "bg-tint-leaf text-success",
    title: "Analytics & Insights",
    body: "Production, compliance and pipeline health across every subsidiary, in one dashboard built for daily monitoring.",
    href: "/analytics",
  },
  {
    icon: Share2,
    tint: "bg-tint-red text-danger",
    title: "Knowledge Graph",
    body: "Documents, subsidiaries and mines linked as a live graph — trace how any record connects to the rest of the record.",
    href: "/graph",
  },
  {
    icon: FileBarChart,
    tint: "bg-tint-navy text-primary-500",
    title: "Report Generation",
    body: "Template-driven statutory and operational reports, assembled with charts and annexures in minutes, not weeks.",
    href: "/reports",
  },
  {
    icon: Landmark,
    tint: "bg-tint-gold text-secondary-600",
    title: "Parliamentary Tracker",
    body: "Every tabled question tracked from receipt to reply, with deadlines, assignment and drafted briefs in one place.",
    href: "/parliamentary",
  },
];

export function ModuleShowcase() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {MODULES.map((mod, i) => (
        <Reveal key={mod.title} delay={i * 70}>
          <Link
            href={mod.href}
            className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-hairline bg-surface-card p-6 transition-all duration-300 hover:-translate-y-1.5 hover:border-transparent hover:shadow-[0_28px_56px_-28px_rgba(18,48,74,0.4)]"
          >
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl p-px opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background: "linear-gradient(135deg, rgba(242,183,5,0.6), rgba(18,48,74,0.5))",
                WebkitMask: "linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0)",
                WebkitMaskComposite: "xor",
                maskComposite: "exclude",
              }}
              aria-hidden
            />
            <div className="flex items-start justify-between gap-3">
              <span className={`grid size-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 ${mod.tint}`}>
                <mod.icon className="size-5" aria-hidden />
              </span>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-soft opacity-0 transition-all duration-300 group-hover:opacity-100">
                <ArrowUpRight className="size-4 text-primary-600" aria-hidden />
              </span>
            </div>
            <h3 className="title-md mt-5 text-ink-0">{mod.title}</h3>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-body">{mod.body}</p>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
