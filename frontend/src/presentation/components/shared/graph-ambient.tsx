"use client";

import { useEffect, useRef } from "react";
import { cn } from "../ui/cn";

type Node = { x: number; y: number; vx: number; vy: number; r: number; hue: number };
type Edge = { a: number; b: number; phase: number };

const FILL = ["rgba(26,63,102,0.55)", "rgba(242,183,5,0.5)", "rgba(39,138,87,0.45)"];

function seedNodes(width: number, height: number, count: number): Node[] {
  const nodes: Node[] = [];
  for (let i = 0; i < count; i++) {
    nodes.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      r: 2 + Math.random() * 2.5,
      hue: i % 3,
    });
  }
  return nodes;
}

export function GraphAmbient({
  variant = "subtle",
  className,
}: {
  variant?: "hero" | "subtle" | "app";
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const meshRef = useRef<{ nodes: Node[]; edges: Edge[]; w: number; h: number } | null>(null);
  const pulseRef = useRef(0);

  useEffect(() => {
    const canvasEl = ref.current;
    if (!canvasEl) return;
    const canvas = canvasEl;
    const ctxRaw = canvas.getContext("2d");
    if (!ctxRaw) return;
    const ctx2d: CanvasRenderingContext2D = ctxRaw;

    let raf = 0;
    const count = variant === "hero" ? 28 : variant === "app" ? 18 : 14;
    const linkDist = variant === "hero" ? 0.26 : 0.22;
    const opacity = variant === "hero" ? 0.85 : variant === "app" ? 0.45 : 0.35;

    function resize() {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx2d.setTransform(dpr, 0, 0, dpr, 0, 0);
      const nodes = seedNodes(w, h, count);
      meshRef.current = { nodes, edges: [], w, h };
      const edges: Edge[] = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (dx * dx + dy * dy < (w * linkDist) ** 2) {
            edges.push({ a: i, b: j, phase: Math.random() * Math.PI * 2 });
          }
        }
      }
      meshRef.current.edges = edges;
    }

    function frame(t: number) {
      const mesh = meshRef.current;
      if (!mesh) return;
      pulseRef.current = t * 0.001;
      const { nodes, edges, w, h } = mesh;
      ctx2d.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      for (const e of edges) {
        const a = nodes[e.a];
        const b = nodes[e.b];
        const pulse = 0.35 + 0.35 * Math.sin(pulseRef.current * 2 + e.phase);
        ctx2d.strokeStyle = `rgba(18,48,74,${opacity * pulse * 0.35})`;
        ctx2d.lineWidth = 1;
        ctx2d.beginPath();
        ctx2d.moveTo(a.x, a.y);
        ctx2d.lineTo(b.x, b.y);
        ctx2d.stroke();

        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        ctx2d.fillStyle = `rgba(242,183,5,${opacity * pulse * 0.9})`;
        ctx2d.beginPath();
        ctx2d.arc(mx, my, 1.2, 0, Math.PI * 2);
        ctx2d.fill();
      }

      for (const n of nodes) {
        ctx2d.fillStyle = FILL[n.hue];
        ctx2d.beginPath();
        ctx2d.arc(n.x, n.y, n.r, 0, Math.PI * 2);
        ctx2d.fill();
      }

      raf = requestAnimationFrame(frame);
    }

    resize();
    raf = requestAnimationFrame(frame);
    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement!);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [variant]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}
    />
  );
}
