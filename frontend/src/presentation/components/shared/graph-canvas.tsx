"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { GraphEdge, GraphNode, GraphNodeKind } from "@/src/domain/entities/graph";
import { cn } from "../ui/cn";

interface SimNode extends GraphNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COLOR: Record<GraphNodeKind, { fill: string; ring: string }> = {
  Document: { fill: "#1a3f70", ring: "#0f2a4e" },
  Subsidiary: { fill: "#e5b017", ring: "#a87c0b" },
  Mine: { fill: "#3f8f4a", ring: "#33753c" },
  Block: { fill: "#7794bd", ring: "#3d6296" },
  RiskFlag: { fill: "#d92d20", ring: "#a01d13" },
};

const NODE_RADIUS: Record<GraphNodeKind, number> = {
  Document: 16, Subsidiary: 22, Mine: 19, Block: 14, RiskFlag: 15,
};

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function GraphCanvas({
  nodes: rawNodes, edges, selectedId, onSelect, className,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 800, height: 560 });
  const [nodes, setNodes] = useState<SimNode[]>([]);
  const [tick, setTick] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const dragRef = useRef<{ id: string | null; panning: boolean; startX: number; startY: number }>({
    id: null, panning: false, startX: 0, startY: 0,
  });
  const [seededIds, setSeededIds] = useState("");

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setSize({ width: entry.contentRect.width, height: entry.contentRect.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // re-seed positions only when the visible node set actually changes — the React-documented
  // "adjusting state during render" pattern, so this is not a setState-in-effect cascade
  const idsKey = rawNodes.map((n) => n.id).join(",");
  if (idsKey !== seededIds) {
    setSeededIds(idsKey);
    const rand = seededRandom(42);
    setNodes(
      rawNodes.map((n) => ({
        ...n,
        x: size.width / 2 + (rand() - 0.5) * size.width * 0.7,
        y: size.height / 2 + (rand() - 0.5) * size.height * 0.7,
        vx: 0,
        vy: 0,
      })),
    );
  }

  // simple force simulation: link springs + node repulsion + centering, run in a rAF loop
  useEffect(() => {
    if (nodes.length === 0) return;
    let raf: number;
    let frame = 0;
    const maxFrames = 260;

    function step() {
      setNodes((prev) => {
        const next = prev.map((n) => ({ ...n }));
        const byId = new Map(next.map((n) => [n.id, n]));

        for (const a of next) {
          for (const b of next) {
            if (a.id === b.id) continue;
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distSq = Math.max(dx * dx + dy * dy, 1);
            const force = 2400 / distSq;
            a.vx += (dx / Math.sqrt(distSq)) * force;
            a.vy += (dy / Math.sqrt(distSq)) * force;
          }
        }

        for (const e of edges) {
          const s = byId.get(e.source);
          const t = byId.get(e.target);
          if (!s || !t) continue;
          const dx = t.x - s.x;
          const dy = t.y - s.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const target = 150;
          const force = (dist - target) * 0.02;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          s.vx += fx; s.vy += fy;
          t.vx -= fx; t.vy -= fy;
        }

        const cx = size.width / 2;
        const cy = size.height / 2;
        for (const n of next) {
          n.vx += (cx - n.x) * 0.002;
          n.vy += (cy - n.y) * 0.002;
          n.vx *= 0.82;
          n.vy *= 0.82;
          if (dragRef.current.id !== n.id) {
            n.x += n.vx;
            n.y += n.vy;
          }
        }
        return next;
      });

      frame += 1;
      if (frame < maxFrames) {
        raf = requestAnimationFrame(step);
      }
    }

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edges, size.width, size.height, tick]);

  function onPointerDownNode(id: string, e: React.PointerEvent) {
    e.stopPropagation();
    dragRef.current = { id, panning: false, startX: e.clientX, startY: e.clientY };
    onSelect(id);
  }

  function onPointerDownBackground(e: React.PointerEvent) {
    dragRef.current = { id: null, panning: true, startX: e.clientX - pan.x, startY: e.clientY - pan.y };
  }

  function onPointerMove(e: React.PointerEvent) {
    if (dragRef.current.id) {
      const svg = containerRef.current?.querySelector("svg");
      const rect = svg?.getBoundingClientRect();
      if (!rect) return;
      const x = (e.clientX - rect.left - pan.x) / zoom;
      const y = (e.clientY - rect.top - pan.y) / zoom;
      setNodes((prev) => prev.map((n) => (n.id === dragRef.current.id ? { ...n, x, y, vx: 0, vy: 0 } : n)));
    } else if (dragRef.current.panning) {
      setPan({ x: e.clientX - dragRef.current.startX, y: e.clientY - dragRef.current.startY });
    }
  }

  function onPointerUp() {
    if (dragRef.current.id) setTick((t) => t + 1);
    dragRef.current = { id: null, panning: false, startX: 0, startY: 0 };
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    setZoom((z) => Math.min(2.2, Math.max(0.4, z - e.deltaY * 0.001)));
  }

  const byId = new Map(nodes.map((n) => [n.id, n]));
  const neighborIds = useMemo(() => {
    if (!selectedId) return null;
    const set = new Set<string>([selectedId]);
    for (const e of edges) {
      if (e.source === selectedId) set.add(e.target);
      if (e.target === selectedId) set.add(e.source);
    }
    return set;
  }, [selectedId, edges]);

  return (
    <div
      ref={containerRef}
      className={cn("relative h-full w-full touch-none overflow-hidden bg-[#0f172a]", className)}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onPointerDown={onPointerDownBackground}
      onWheel={onWheel}
      onClick={(e) => {
        if (e.target === e.currentTarget) onSelect(null);
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #fff 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden
      />
      <svg
        width="100%"
        height="100%"
        className="cursor-grab active:cursor-grabbing"
        onClick={(e) => e.stopPropagation()}
      >
        <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
          {edges.map((e) => {
            const s = byId.get(e.source);
            const t = byId.get(e.target);
            if (!s || !t) return null;
            const dimmed = neighborIds ? !(neighborIds.has(e.source) && neighborIds.has(e.target)) : false;
            const midX = (s.x + t.x) / 2;
            const midY = (s.y + t.y) / 2;
            return (
              <g key={e.id} opacity={dimmed ? 0.12 : 0.8}>
                <line
                  x1={s.x} y1={s.y} x2={t.x} y2={t.y}
                  stroke="#94a3b8" strokeWidth={1.2}
                />
                <text
                  x={midX} y={midY}
                  fill="#cbd5e1"
                  fontSize={9}
                  textAnchor="middle"
                  className="select-none"
                  style={{ paintOrder: "stroke", stroke: "#0f172a", strokeWidth: 3 }}
                >
                  {e.type}
                </text>
              </g>
            );
          })}

          {nodes.map((n) => {
            const color = NODE_COLOR[n.kind];
            const r = NODE_RADIUS[n.kind];
            const dimmed = neighborIds ? !neighborIds.has(n.id) : false;
            const isSelected = n.id === selectedId;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                opacity={dimmed ? 0.25 : 1}
                onPointerDown={(e) => onPointerDownNode(n.id, e)}
                className="cursor-pointer"
              >
                {isSelected ? (
                  <circle r={r + 6} fill="none" stroke="#f0ca4c" strokeWidth={2} opacity={0.9} />
                ) : null}
                <circle r={r} fill={color.fill} stroke={color.ring} strokeWidth={2} />
                <text
                  y={r + 13}
                  textAnchor="middle"
                  fontSize={10.5}
                  fill="#e2e8f0"
                  className="pointer-events-none select-none"
                  style={{ paintOrder: "stroke", stroke: "#0f172a", strokeWidth: 3 }}
                >
                  {n.label.length > 22 ? `${n.label.slice(0, 20)}…` : n.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(2.2, z + 0.15))}
          className="grid size-8 place-items-center rounded-md bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          aria-label="Zoom in"
        >
          +
        </button>
        <button
          type="button"
          onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))}
          className="grid size-8 place-items-center rounded-md bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          type="button"
          onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }}
          className="grid size-8 place-items-center rounded-md bg-white/10 text-[10px] font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
          aria-label="Reset view"
        >
          1:1
        </button>
      </div>
    </div>
  );
}
