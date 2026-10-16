"use client";

import { useMemo, useState } from "react";
import { Share2, FileText, Landmark, Pickaxe, Layers, AlertTriangle, X, Search } from "lucide-react";
import { MOCK_KNOWLEDGE_GRAPH } from "@/src/application/services/graph-fixtures";
import type { GraphNodeKind } from "@/src/domain/entities/graph";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { GraphCanvas } from "../components/shared/graph-canvas";
import { cn } from "../components/ui/cn";

const KIND_META: Record<GraphNodeKind, { icon: typeof FileText; color: string; dot: string }> = {
  Document: { icon: FileText, color: "text-primary-500", dot: "bg-[#1a3f70]" },
  Subsidiary: { icon: Landmark, color: "text-secondary-600", dot: "bg-[#e5b017]" },
  Mine: { icon: Pickaxe, color: "text-success", dot: "bg-[#3f8f4a]" },
  Block: { icon: Layers, color: "text-primary-300", dot: "bg-[#7794bd]" },
  RiskFlag: { icon: AlertTriangle, color: "text-danger", dot: "bg-[#d92d20]" },
};

const REL_LABEL: Record<string, string> = {
  BELONGS_TO: "belongs to",
  REFERENCES: "references",
  LOCATED_IN: "located in",
  FLAGGED_BY: "flagged by",
};

export function GraphExplorerView() {
  const { nodes, edges } = MOCK_KNOWLEDGE_GRAPH;
  const [activeKinds, setActiveKinds] = useState<Set<GraphNodeKind>>(
    new Set(["Document", "Subsidiary", "Mine", "Block", "RiskFlag"]),
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const visibleNodeIds = useMemo(() => {
    const bySearch = search.trim()
      ? new Set(
          nodes
            .filter((n) => n.label.toLowerCase().includes(search.trim().toLowerCase()))
            .map((n) => n.id),
        )
      : null;
    return new Set(
      nodes
        .filter((n) => activeKinds.has(n.kind) && (!bySearch || bySearch.has(n.id)))
        .map((n) => n.id),
    );
  }, [nodes, activeKinds, search]);

  const visibleNodes = useMemo(() => nodes.filter((n) => visibleNodeIds.has(n.id)), [nodes, visibleNodeIds]);
  const visibleEdges = useMemo(
    () => edges.filter((e) => visibleNodeIds.has(e.source) && visibleNodeIds.has(e.target)),
    [edges, visibleNodeIds],
  );

  const selected = nodes.find((n) => n.id === selectedId) ?? null;
  const selectedEdges = selected
    ? edges.filter((e) => e.source === selected.id || e.target === selected.id)
    : [];

  const counts = useMemo(() => {
    const c: Record<GraphNodeKind, number> = { Document: 0, Subsidiary: 0, Mine: 0, Block: 0, RiskFlag: 0 };
    for (const n of nodes) c[n.kind] += 1;
    return c;
  }, [nodes]);

  function toggleKind(kind: GraphNodeKind) {
    setActiveKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Knowledge Graph Explorer"
        description="Interactive Neo4j-style view of the domain graph — documents, subsidiaries, mines and risk flags, with their relationships. Preview data shown."
        breadcrumbs={[{ label: "Intelligence" }, { label: "Knowledge Graph" }]}
        action={<Badge tone="accent">Mock preview</Badge>}
      />

      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_320px] lg:p-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {(Object.keys(KIND_META) as GraphNodeKind[]).map((kind) => {
              const meta = KIND_META[kind];
              const Icon = meta.icon;
              const active = activeKinds.has(kind);
              return (
                <button
                  key={kind}
                  type="button"
                  onClick={() => toggleKind(kind)}
                  className={cn(
                    "card-raise flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-colors",
                    active
                      ? "border-hairline bg-surface-card"
                      : "border-hairline bg-surface-soft opacity-50",
                  )}
                >
                  <span className={cn("grid size-8 shrink-0 place-items-center rounded-lg bg-surface-soft", meta.color)}>
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-[12.5px] font-medium text-ink-0">{kind}</span>
                    <span className="block text-[11px] text-muted">{counts[kind]} nodes</span>
                  </span>
                </button>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <CardHeader
              title="Graph view"
              description={`${visibleNodes.length} nodes · ${visibleEdges.length} relationships — drag nodes, scroll to zoom, drag background to pan`}
              action={
                <div className="relative">
                  <Search className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-soft" aria-hidden />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search nodes…"
                    className="h-8 w-44 rounded-md border border-hairline-strong bg-surface-card pr-2.5 pl-7 text-[12.5px] text-ink-0 placeholder:text-muted-soft focus:border-primary-400 focus:outline-none"
                  />
                </div>
              }
            />
            <div className="h-[560px] w-full">
              <GraphCanvas
                nodes={visibleNodes}
                edges={visibleEdges}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            </div>
          </Card>

          <Card>
            <CardHeader title="Relationship types" />
            <div className="flex flex-wrap gap-2 p-4">
              {Object.entries(REL_LABEL).map(([type, label]) => (
                <span key={type} className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-soft px-2.5 py-1 text-[11.5px] text-body">
                  <Share2 className="size-3 text-muted" aria-hidden />
                  <span className="numeral text-[10.5px] text-muted-soft uppercase">{type}</span>
                  <span className="text-muted-soft">·</span>
                  {label}
                </span>
              ))}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title={selected ? "Node details" : "Select a node"} />
            {selected ? (
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg bg-surface-soft", KIND_META[selected.kind].color)}>
                      {(() => {
                        const Icon = KIND_META[selected.kind].icon;
                        return <Icon className="size-4.5" aria-hidden />;
                      })()}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[13.5px] font-medium text-ink-0" title={selected.label}>
                        {selected.label}
                      </p>
                      <Badge tone="neutral" className="mt-1">{selected.kind}</Badge>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    aria-label="Clear selection"
                    className="grid size-6 shrink-0 place-items-center rounded-md text-muted-soft hover:bg-surface-soft hover:text-ink-0"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </div>

                <dl className="mt-4 space-y-2 border-t border-hairline pt-4">
                  {Object.entries(selected.properties).map(([key, value]) => (
                    <div key={key} className="flex items-baseline justify-between gap-3 text-[12.5px]">
                      <dt className="shrink-0 text-muted-soft">{key}</dt>
                      <dd className="truncate text-right text-body-strong" title={value}>{value}</dd>
                    </div>
                  ))}
                </dl>

                <div className="mt-4 border-t border-hairline pt-4">
                  <p className="type-caption text-muted">
                    {selectedEdges.length} relationship{selectedEdges.length === 1 ? "" : "s"}
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {selectedEdges.map((e) => {
                      const otherId = e.source === selected.id ? e.target : e.source;
                      const other = nodes.find((n) => n.id === otherId);
                      const direction = e.source === selected.id ? "→" : "←";
                      if (!other) return null;
                      return (
                        <li key={e.id}>
                          <button
                            type="button"
                            onClick={() => setSelectedId(other.id)}
                            className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12px] text-body transition-colors hover:bg-surface-soft"
                          >
                            <span className="numeral text-[10px] text-muted-soft">{direction}</span>
                            <span className="rounded bg-surface-soft px-1.5 py-0.5 text-[10px] text-muted-soft uppercase">
                              {e.type}
                            </span>
                            <span className="truncate text-ink-0">{other.label}</span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="px-4 py-10 text-center">
                <Share2 className="mx-auto size-8 text-muted-soft" aria-hidden />
                <p className="mt-3 text-[12.5px] text-muted">
                  Click any node in the graph to inspect its properties and relationships.
                </p>
              </div>
            )}
          </Card>

          <Card>
            <CardHeader title="About this view" />
            <div className="space-y-2.5 p-4 text-[12.5px] leading-relaxed text-body">
              <p>
                This preview mirrors the platform&apos;s real Neo4j knowledge graph: every
                validated document publishes a <span className="font-medium text-ink-0">Document</span> node
                linked to its <span className="font-medium text-ink-0">Subsidiary</span> and any
                referenced <span className="font-medium text-ink-0">Mine</span>.
              </p>
              <p>
                <span className="font-medium text-ink-0">Block</span> and{" "}
                <span className="font-medium text-ink-0">RiskFlag</span> nodes shown here are
                illustrative — they represent the richer graph planned for future ingestion
                phases.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
