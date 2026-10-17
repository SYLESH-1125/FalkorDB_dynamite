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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {MODULES.map((mod, i) => (
        <Reveal key={mod.title} delay={i * 70}>
          <Link
            href={mod.href}
            className="card-raise group flex h-full flex-col rounded-2xl border border-hairline bg-surface-card p-5 transition-all duration-300 hover:-translate-y-1 hover:card-float"
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`grid size-10 place-items-center rounded-xl ${mod.tint}`}>
                <mod.icon className="size-5" aria-hidden />
              </span>
              <ArrowUpRight
                className="size-4 shrink-0 text-muted-soft opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                aria-hidden
              />
            </div>
            <h3 className="title-md mt-4 text-ink-0">{mod.title}</h3>
            <p className="mt-2 text-[13.5px] leading-relaxed text-body">{mod.body}</p>
          </Link>
        </Reveal>
      ))}
    </div>
  );
}
