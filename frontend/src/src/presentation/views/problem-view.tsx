"use client";

import Link from "next/link";
import {
  AlertTriangle, Clock, FileSearch, Users, ArrowRight, CheckCircle2,
} from "lucide-react";
import { PageHeader } from "../components/ui/page-header";
import { Card } from "../components/ui/card";
import { ProblemVideo } from "../components/shared/problem-video";

const PAIN_POINTS = [
  {
    icon: Clock,
    title: "A fortnight to answer one question",
    body: "A question tabled in Parliament carries a hard deadline. Officials must comb through decades of scanned files, registers and reports held across nine subsidiaries — by hand.",
  },
  {
    icon: FileSearch,
    title: "Evidence scattered, undigitised",
    body: "Records exist as paper files, faxed scans and disconnected spreadsheets. No single index. No way to search across them. Every answer starts from zero.",
  },
  {
    icon: Users,
    title: "One team, every ministry question",
    body: "The Parliamentary Response Team fields questions on production, safety, environment, land — each requiring a different subsidiary's records, verified and defensible.",
  },
  {
    icon: AlertTriangle,
    title: "Errors carry real consequences",
    body: "An answer given on the floor of the House cannot be quietly corrected. A wrong figure, an unverifiable claim, or a missed deadline all become part of the public record.",
  },
];

const AFTER_POINTS = [
  "One indexed corpus across every subsidiary, queryable in plain language",
  "Every figure traced to a source document and page — no unverifiable claims",
  "A drafted, citation-backed reply in minutes, not weeks",
];

export function ProblemView() {
  return (
    <div>
      <PageHeader
        title="The problem this platform solves"
        description="Before BHUMI, this is what answering a parliamentary question actually looked like — no indexed archive, just officials racing a deadline against a shelf of paper."
        breadcrumbs={[{ label: "The Problem" }]}
      />

      <div className="mx-auto max-w-4xl space-y-10 px-4 py-8 sm:px-6 lg:px-8">
        <ProblemVideo src="/videos/parliament-problem.mp4" />

        <div>
          <p className="type-caption text-danger uppercase">The real problem</p>
          <h2 className="display-sm mt-2 text-ink-0">Every deadline runs into the same wall</h2>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {PAIN_POINTS.map((point) => {
              const Icon = point.icon;
              return (
                <Card key={point.title} className="p-5">
                  <span className="grid size-10 place-items-center rounded-xl bg-tint-red text-danger">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <h3 className="title-sm mt-4 text-ink-0">{point.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-body">{point.body}</p>
                </Card>
              );
            })}
          </div>
        </div>

        <div className="gradient-navy card-float overflow-hidden rounded-2xl p-7 sm:p-9">
          <p className="type-caption text-leaf-400 uppercase">What changes with BHUMI</p>
          <h2 className="display-sm mt-2 text-white">The same deadline. A defensible answer in minutes.</h2>

          <ul className="mt-6 space-y-3">
            {AFTER_POINTS.map((item) => (
              <li key={item} className="flex items-start gap-3 text-[14px] text-white/80">
                <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-leaf-400" aria-hidden />
                {item}
              </li>
            ))}
          </ul>

          <Link
            href="/query"
            className="mt-7 inline-flex h-11 items-center gap-2 rounded-full bg-secondary-400 px-6 text-[13.5px] font-semibold text-primary-700 transition-all duration-200 hover:-translate-y-0.5 hover:bg-secondary-300"
          >
            Try the AI Query System
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </div>
  );
}
