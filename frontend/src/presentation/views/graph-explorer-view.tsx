"use client";

import { useMemo, useState } from "react";
import { Share2, FileText, Landmark, Pickaxe, HelpCircle, X, Search } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import type { GraphNodeKind } from "@/src/domain/entities/graph";
import { PageHeader } from "../components/ui/page-header";
import { Card, CardHeader } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { GraphCanvas } from "../components/shared/graph-canvas";
import { Skeleton } from "../components/ui/skeleton";
import { cn } from "../components/ui/cn";

const KIND_META: Record<GraphNodeKind, { icon: typeof FileText; color: string; dot: string }> = {
  Document: { icon: FileText, color: "text-primary-500", dot: "bg-[#1a3f70]" },
  Subsidiary: { icon: Landmark, color: "text-secondary-600", dot: "bg-[#e5b017]" },
  Mine: { icon: Pickaxe, color: "text-success", dot: "bg-[#3f8f4a]" },
  Unknown: { icon: HelpCircle, color: "text-muted", dot: "bg-[#7794bd]" },
};

const REL_LABEL: Record<string, string> = {
  BELONGS_TO: "belongs to",
  REFERENCES: "references",
};

function relLabel(type: string): string {
  return REL_LABEL[type] ?? type.toLowerCase().replace(/_/g, " ");
}

export function GraphExplorerView() {
  const { data, loading, error } = useAsync(() => repositories.graph.knowledgeGraph(), []);
  const nodes = useMemo(() => data?.nodes ?? [], [data]);
  const edges = useMemo(() => data?.edges ?? [], [data]);
  const kinds = useMemo(
    () => [...new Set(nodes.map((n) => n.kind))] as GraphNodeKind[],
    [nodes],
  );
  const [activeKinds, setActiveKinds] = useState<Set<GraphNodeKind> | null>(null);
  const effectiveActiveKinds = activeKinds ?? new Set(kinds);
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
        .filter((n) => effectiveActiveKinds.has(n.kind) && (!bySearch || bySearch.has(n.id)))
        .map((n) => n.id),
    );
  }, [nodes, effectiveActiveKinds, search]);

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
    const c: Partial<Record<GraphNodeKind, number>> = {};
    for (const n of nodes) c[n.kind] = (c[n.kind] ?? 0) + 1;
    return c;
  }, [nodes]);

  const relTypes = useMemo(() => [...new Set(edges.map((e) => e.type))], [edges]);

  function toggleKind(kind: GraphNodeKind) {
    setActiveKinds((prev) => {
      const next = new Set(prev ?? kinds);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
  }

  return (
    <>
      <PageHeader
        title="Knowledge Graph Explorer"
        description="Interactive view of the live Neo4j domain graph — documents, subsidiaries and mines, with their relationships."
        breadcrumbs={[{ label: "Intelligence" }, { label: "Knowledge Graph" }]}
      />

      <div className="grid gap-5 p-4 sm:p-6 lg:grid-cols-[1fr_320px] lg:p-8">
        <div className="space-y-4">
          {!loading && !error && nodes.length === 0 ? (
            <Card>
              <div className="px-4 py-10 text-center">
                <Share2 className="mx-auto size-8 text-muted-soft" aria-hidden />
                <p className="mt-3 text-[12.5px] text-muted">
                  No graph data yet. The knowledge graph populates as documents are validated.
                </p>
              </div>
            </Card>
          ) : null}
          {error ? (
            <Card>
              <div className="px-4 py-10 text-center">
                <p className="text-[12.5px] text-danger">Could not load the knowledge graph. {error}</p>
              </div>
            </Card>
          ) : null}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {kinds.map((kind) => {
              const meta = KIND_META[kind];
              const Icon = meta.icon;
              const active = effectiveActiveKinds.has(kind);
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
                    <span className="block text-[11px] text-muted">{counts[kind] ?? 0} nodes</span>
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
              {loading ? (
                <Skeleton className="h-full w-full rounded-none" />
              ) : (
                <GraphCanvas
                  nodes={visibleNodes}
                  edges={visibleEdges}
                  selectedId={selectedId}
                  onSelect={setSelectedId}
                />
              )}
            </div>
          </Card>

          {relTypes.length > 0 ? (
            <Card>
              <CardHeader title="Relationship types" />
              <div className="flex flex-wrap gap-2 p-4">
                {relTypes.map((type) => (
                  <span key={type} className="inline-flex items-center gap-1.5 rounded-full border border-hairline bg-surface-soft px-2.5 py-1 text-[11.5px] text-body">
                    <Share2 className="size-3 text-muted" aria-hidden />
                    <span className="numeral text-[10.5px] text-muted-soft uppercase">{type}</span>
                    <span className="text-muted-soft">·</span>
                    {relLabel(type)}
                  </span>
                ))}
              </div>
            </Card>
          ) : null}
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
                This is the platform&apos;s live Neo4j knowledge graph: every validated
                document publishes a <span className="font-medium text-ink-0">Document</span> node
                linked to its <span className="font-medium text-ink-0">Subsidiary</span> and any
                referenced <span className="font-medium text-ink-0">Mine</span>.
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
