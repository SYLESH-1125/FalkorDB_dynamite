"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import type { RoleOption } from "@/src/application/services/role-catalog";
import { ROLE_ILLUSTRATIONS } from "./role-illustrations";
import { cn } from "../ui/cn";

const ACCENTS = {
  navy: { solid: "#3766bb", tint: "bg-tint-navy", ring: "hover:ring-primary-300/70", statValue: "text-primary-600" },
  gold: { solid: "#d59f00", tint: "bg-tint-gold", ring: "hover:ring-secondary-300/80", statValue: "text-secondary-600" },
  leaf: { solid: "#278a57", tint: "bg-tint-leaf", ring: "hover:ring-leaf-400/70", statValue: "text-leaf-600" },
} as const;

type Tint = keyof typeof ACCENTS;

interface Point {
  x: number;
  y: number;
}

function wirePath(from: Point, to: Point) {
  const midY = from.y + (to.y - from.y) * 0.56;
  return `M ${from.x} ${from.y} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${to.y}`;
}

function OrbitCard({
  role, tint, index, cardRef,
}: {
  role: RoleOption;
  tint: Tint;
  index: string;
  cardRef: (el: HTMLAnchorElement | null) => void;
}) {
  const style = ACCENTS[tint];
  const Illustration = ROLE_ILLUSTRATIONS[role.id];

  return (
    <Link
      ref={cardRef}
      href={`/login?role=${role.id}`}
      className={cn(
        "card-raise group relative flex w-full max-w-72 flex-col overflow-hidden rounded-[1.25rem] border border-hairline bg-surface-card ring-1 ring-transparent transition-all duration-500 ease-out hover:-translate-y-2 hover:card-float",
        style.ring,
      )}
    >
      <div className="relative h-28 shrink-0 overflow-hidden">
        <Illustration />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-ink-0/45 via-ink-0/5 to-transparent" />
        <span className="type-caption absolute top-3 left-3.5 font-mono text-[11px] font-semibold tracking-wide text-white/70">
          {index}
        </span>
      </div>

      <div className="relative flex flex-1 flex-col p-4.5">
        <h3 className="title-sm text-ink-0">{role.label}</h3>
        <p className="type-caption mt-1 font-semibold tracking-wide text-muted uppercase">{role.tagline}</p>

        <div className="mt-3.5 flex items-end justify-between gap-3 border-t border-hairline pt-3.5">
          <div className="flex gap-4">
            {role.showcase.stats.slice(0, 1).map(([value, label]) => (
              <div key={label}>
                <p className={cn("numeral text-[19px] leading-none", style.statValue)}>{value}</p>
                <p className="mt-1 max-w-[8rem] text-[10px] leading-tight text-muted-soft">{label}</p>
              </div>
            ))}
          </div>

          <span className="relative grid size-8 shrink-0 place-items-center overflow-hidden rounded-full border border-hairline-strong text-ink-0 transition-all duration-300 group-hover:-translate-y-0.5 group-hover:border-transparent group-hover:text-white">
            <span
              className="absolute inset-0 scale-0 rounded-full transition-transform duration-300 ease-out group-hover:scale-100"
              style={{ background: style.solid }}
              aria-hidden
            />
            <ArrowUpRight className="relative size-3.5 transition-transform duration-300 group-hover:rotate-45" aria-hidden />
          </span>
        </div>
      </div>

      <div
        className="absolute inset-x-0 top-0 h-[3px] origin-left scale-x-0 transition-transform duration-500 ease-out group-hover:scale-x-100"
        style={{ background: style.solid }}
        aria-hidden
      />
    </Link>
  );
}

export function RoleOrbit({ roles, tints, admin }: { roles: RoleOption[]; tints: readonly Tint[]; admin: RoleOption }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLAnchorElement>(null);
  const cardRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const [wires, setWires] = useState<{ path: string; from: Point; to: Point; color: string }[] | null>(null);

  useEffect(() => {
    function measure() {
      const container = containerRef.current;
      const hub = hubRef.current;
      if (!container || !hub) return;

      const containerBox = container.getBoundingClientRect();
      const hubBox = hub.getBoundingClientRect();
      const hubPoint: Point = {
        x: hubBox.left + hubBox.width / 2 - containerBox.left,
        y: hubBox.bottom - containerBox.top,
      };

      const next = cardRefs.current.map((card, i) => {
        if (!card) return null;
        const cardBox = card.getBoundingClientRect();
        const cardPoint: Point = {
          x: cardBox.left + cardBox.width / 2 - containerBox.left,
          y: cardBox.top - containerBox.top,
        };
        const path = wirePath(hubPoint, cardPoint);
        const color: string = ACCENTS[tints[i]].solid;
        return { path, from: hubPoint, to: cardPoint, color };
      }).filter((w): w is { path: string; from: Point; to: Point; color: string } => w !== null);

      setWires(next);
    }

    measure();
    const observer = new ResizeObserver(measure);
    if (containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [tints]);

  return (
    <div ref={containerRef} className="relative mx-auto hidden w-full max-w-5xl lg:block">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 opacity-60"
        style={{ background: "radial-gradient(60% 100% at 50% 0%, rgba(18,48,74,0.06), transparent 70%)" }}
        aria-hidden
      />

      {wires ? (
        <svg className="pointer-events-none absolute inset-0 size-full overflow-visible" aria-hidden>
          <defs>
            {wires.map((wire, i) => (
              <linearGradient key={i} id={`wire-grad-${i}`} x1={wire.from.x} y1={wire.from.y} x2={wire.to.x} y2={wire.to.y} gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor={wire.color} stopOpacity="0.9" />
                <stop offset="100%" stopColor={wire.color} stopOpacity="0.55" />
              </linearGradient>
            ))}
          </defs>
          {wires.map((wire, i) => (
            <g key={i}>
              <path d={wire.path} fill="none" stroke={wire.color} strokeOpacity="0.1" strokeWidth="16" strokeLinecap="round" />
              <path d={wire.path} fill="none" stroke={wire.color} strokeOpacity="0.22" strokeWidth="4.5" strokeLinecap="round" />
              <path
                d={wire.path}
                fill="none"
                stroke={`url(#wire-grad-${i})`}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="1.5 13"
                className="animate-flow-dash"
              />
              <circle cx={wire.from.x} cy={wire.from.y} r="3" fill={wire.color} />
              <circle cx={wire.to.x} cy={wire.to.y} r="3" fill={wire.color} />
              <circle r="5" fill={wire.color}>
                <animateMotion dur={`${2.8 + i * 0.4}s`} repeatCount="indefinite" path={wire.path} rotate="auto" />
                <animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.06;0.88;1" dur={`${2.8 + i * 0.4}s`} repeatCount="indefinite" />
              </circle>
              <circle r="11" fill={wire.color} opacity="0.28">
                <animateMotion dur={`${2.8 + i * 0.4}s`} repeatCount="indefinite" path={wire.path} rotate="auto" />
                <animate attributeName="opacity" values="0;0.28;0.28;0" keyTimes="0;0.06;0.88;1" dur={`${2.8 + i * 0.4}s`} repeatCount="indefinite" />
              </circle>
            </g>
          ))}
        </svg>
      ) : null}

      <div className="relative z-10 flex justify-center pb-16">
        <div className="relative">
          <span className="absolute inset-0 -z-10 animate-orbit-pulse rounded-full bg-danger/25 blur-2xl" aria-hidden />
          <span className="absolute -inset-px -z-10 rounded-[1.35rem] bg-gradient-to-b from-white/15 to-transparent" aria-hidden />
          <Link
            ref={hubRef}
            href={`/login?role=${admin.id}`}
            className="card-float group relative flex w-56 flex-col items-center gap-3 overflow-hidden rounded-[1.25rem] border border-white/10 bg-gradient-to-b from-[#1c1c1c] to-ink-0 px-6 py-8 text-center transition-transform duration-300 ease-out hover:-translate-y-1.5"
          >
            <span
              className="pointer-events-none absolute inset-0 opacity-40"
              style={{ background: "radial-gradient(90% 60% at 50% 0%, rgba(255,255,255,0.08), transparent 70%)" }}
              aria-hidden
            />
            <span className="relative grid size-12 place-items-center rounded-2xl bg-danger/15 text-danger ring-1 ring-danger/25">
              <ShieldCheck className="size-6" aria-hidden />
            </span>
            <span className="relative flex flex-col gap-1">
              <span className="title-md text-[19px] text-white">{admin.label}</span>
              <span className="type-caption font-semibold tracking-[0.12em] text-white/45 uppercase">Platform administration</span>
            </span>
            <span className="relative mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/8 px-2.5 py-1 text-[10px] font-semibold tracking-wide text-white/60 uppercase">
              Central authority
            </span>
          </Link>
        </div>
      </div>

      <div className="relative z-10 grid grid-cols-3 justify-items-center gap-6">
        {roles.map((role, i) => (
          <OrbitCard
            key={role.id}
            role={role}
            tint={tints[i]}
            index={String(i + 1).padStart(2, "0")}
            cardRef={(el) => { cardRefs.current[i] = el; }}
          />
        ))}
      </div>
    </div>
  );
}
