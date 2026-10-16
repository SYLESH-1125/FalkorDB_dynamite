"use client";

import { useState } from "react";
import {
  BookOpen, PlayCircle, HelpCircle, Download, Search, ChevronDown, Mail, Phone, MessageCircle,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { formatDate } from "@/src/application/services/formatting";
import type { ResourceKind } from "@/src/domain/entities/help";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader, CardBody } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { TextInput } from "../components/ui/field";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../components/ui/cn";

const KIND_ICONS: Record<ResourceKind, typeof BookOpen> = {
  guide: BookOpen, video: PlayCircle, faq: HelpCircle, download: Download,
};

const KIND_LABELS: Record<ResourceKind, string> = {
  guide: "Guide", video: "Video", faq: "FAQ", download: "Download",
};

export function HelpView() {
  const resources = useAsync(() => repositories.help.resources(), []);
  const faqs = useAsync(() => repositories.help.faqs(), []);
  const [search, setSearch] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [kindFilter, setKindFilter] = useState<string>("all");

  const allResources = resources.data ?? [];
  const visibleResources = allResources.filter(
    (r) =>
      (kindFilter === "all" || r.kind === kindFilter) &&
      (search === "" ||
        r.title.toLowerCase().includes(search.toLowerCase()) ||
        r.description.toLowerCase().includes(search.toLowerCase())),
  );

  const visibleFaqs = (faqs.data ?? []).filter(
    (f) =>
      search === "" ||
      f.question.toLowerCase().includes(search.toLowerCase()) ||
      f.answer.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <PageHeader
        title="Help & Training Resources"
        description="Guides, walkthroughs and reference material for every module of the platform."
        breadcrumbs={[{ label: "Administration" }, { label: "Help & Training" }]}
      />

      <div className="space-y-5 p-4 sm:p-6 lg:p-8">
        <div className="gradient-hero rounded-2xl border border-sand-300 bg-sand-200/60 p-6 text-center sm:p-10">
          <h2 className="font-serif text-2xl font-semibold tracking-tight text-ink-800 sm:text-3xl">
            How can we help?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-sm text-ink-500">
            Search across guides, training videos and frequently asked questions.
          </p>
          <div className="relative mx-auto mt-5 max-w-lg">
            <Search className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-sand-500" aria-hidden />
            <TextInput
              aria-label="Search help resources"
              placeholder="Search for a topic…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-11 rounded-full pl-10"
            />
          </div>
        </div>

        <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
          {["all", "guide", "video", "download"].map((kind) => (
            <button
              key={kind}
              type="button"
              onClick={() => setKindFilter(kind)}
              className={cn(
                "shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors",
                kindFilter === kind
                  ? "bg-ink-800 text-white"
                  : "border border-sand-400 bg-white text-ink-500 hover:bg-sand-200",
              )}
            >
              {kind === "all" ? "All resources" : `${KIND_LABELS[kind as ResourceKind]}s`}
            </button>
          ))}
        </div>

        {resources.loading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-36 rounded-xl" />)}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleResources.map((resource) => {
              const Icon = KIND_ICONS[resource.kind];
              return (
                <Card key={resource.id}>
                  <CardBody>
                    <div className="flex items-start justify-between gap-2">
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-clay-50 text-clay-600">
                        <Icon className="size-4" aria-hidden />
                      </span>
                      <Badge tone="neutral">{KIND_LABELS[resource.kind]}</Badge>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold text-ink-800">{resource.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-ink-400">{resource.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-sand-300 pt-3 text-[11px] text-ink-300">
                      <span>{resource.category}</span>
                      <span aria-hidden>·</span>
                      <span>{resource.duration}</span>
                      <span aria-hidden>·</span>
                      <span>Updated {formatDate(resource.updatedAt)}</span>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}

        <Card>
          <CardHeader
            title="Frequently asked questions"
            description={`${visibleFaqs.length} question${visibleFaqs.length === 1 ? "" : "s"}`}
          />
          {faqs.loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : (
            <ul className="divide-y divide-sand-200">
              {visibleFaqs.map((faq) => {
                const open = openFaq === faq.id;
                return (
                  <li key={faq.id}>
                    <h3>
                      <button
                        type="button"
                        onClick={() => setOpenFaq(open ? null : faq.id)}
                        aria-expanded={open}
                        className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-sand-200/60 sm:px-5"
                      >
                        <span className="min-w-0 flex-1 text-[13px] font-medium text-ink-800">
                          {faq.question}
                        </span>
                        <Badge tone="neutral">{faq.category}</Badge>
                        <ChevronDown
                          className={cn("size-4 shrink-0 text-sand-500 transition-transform", open && "rotate-180")}
                          aria-hidden
                        />
                      </button>
                    </h3>
                    {open ? (
                      <div className="px-4 pb-4 sm:px-5">
                        <p className="max-w-3xl text-sm leading-relaxed text-ink-500">{faq.answer}</p>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader title="Still need help?" description="Reach the CMPDI platform support desk" />
          <CardBody className="grid gap-4 sm:grid-cols-3">
            {[
              [Mail, "Email support", "support.platform@cmpdi.co.in", "Response within one working day"],
              [Phone, "Helpdesk", "0651-2230-1450", "Mon–Fri, 09:30–18:00 IST"],
              [MessageCircle, "Raise a ticket", "Internal service desk", "For access and data corrections"],
            ].map(([Icon, title, value, help]) => {
              const IconComponent = Icon as typeof Mail;
              return (
                <div key={title as string} className="rounded-xl border border-sand-300 bg-sand-200/50 p-4">
                  <span className="grid size-9 place-items-center rounded-lg bg-white text-ink-400">
                    <IconComponent className="size-4" aria-hidden />
                  </span>
                  <p className="mt-3 text-[13px] font-medium text-ink-800">{title as string}</p>
                  <p className="mt-1 text-xs font-medium text-clay-600">{value as string}</p>
                  <p className="mt-0.5 text-[11px] text-ink-300">{help as string}</p>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>
    </>
  );
}
