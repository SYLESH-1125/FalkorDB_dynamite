"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { HeroVideoBackground } from "@/src/presentation/components/shared/hero-video-background";

const NAV = [
  ["Dashboard", "/dashboard"], ["Reports", "/reports"], ["Query System", "/query"],
  ["Word Cloud", "/topics"], ["Analytics", "/analytics"],
];

export function HeroParallax() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const el = wrapperRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      const raw = range > 0 ? Math.min(Math.max(-rect.top / range, 0), 1) : 0;
      // Zoom finishes early in the pinned range, then holds completely static
      // for the remainder while the next section curtains up over the video.
      const p = Math.min(raw / 0.3, 1);
      setProgress(p);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const videoScale = 1 + progress * 0.6;
  const videoDarken = 0.45 + progress * 0.35;
  const textTranslate = progress * 120;
  const textScale = 1 + progress * 0.5;
  const textOpacity = 1 - progress * 1.4;

  return (
    <div ref={wrapperRef} className="relative" style={{ height: "260vh" }}>
      <section className="sticky top-0 z-0 isolate mx-auto flex h-screen flex-col justify-center overflow-hidden px-4 pt-32 pb-20 text-center sm:px-6 sm:pt-24">
        <div
          className="absolute inset-0 -z-10"
          style={{ transform: `scale(${videoScale})`, willChange: "transform" }}
        >
          <HeroVideoBackground />
        </div>
        <div
          className="pointer-events-none absolute inset-0 -z-10 bg-ink-0"
          style={{ opacity: videoDarken * 0.4, willChange: "opacity" }}
          aria-hidden
        />

        <div className="absolute inset-x-0 top-2.5 z-10 flex justify-center px-4 sm:px-6">
          <nav className="nav-glass flex w-full max-w-5xl items-center gap-3 py-2 pr-2 pl-5">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <span className="grid size-7 place-items-center rounded-full bg-white/85 text-[12px] font-bold text-primary-700">
                B
              </span>
              <span className="type-wordmark text-white drop-shadow-sm">BHUMI</span>
            </Link>

            <ul className="ml-2 hidden items-center gap-1 lg:flex">
              {NAV.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="bubble-glass text-[13.5px] font-medium text-white/85">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <Link
                href="/help"
                className="bubble-glass hidden h-9 items-center text-[13.5px] font-medium text-white/85 sm:inline-flex"
              >
                Help
              </Link>
              <Link
                href="/login"
                className="inline-flex h-9 items-center rounded-full bg-white/90 px-5 text-[13.5px] font-semibold text-primary-700 shadow-sm transition-all duration-300 hover:scale-[1.03] hover:bg-white"
              >
                Get Started
              </Link>
            </div>
          </nav>
        </div>

        <div
          style={{
            transform: `translateY(calc(-${textTranslate}px - 2.5rem)) scale(${textScale})`,
            opacity: Math.max(textOpacity, 0),
            willChange: "transform, opacity",
          }}
        >
          <h1
            className="mx-auto max-w-6xl text-[4rem] leading-[0.95] tracking-tight text-white uppercase sm:text-8xl lg:text-9xl"
            style={{ fontFamily: "var(--font-impact)" }}
          >
            BHUMI
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/80 sm:text-base">
            Bharat Hub for Unified Mining Intelligence
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/login"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-secondary-400 px-8 text-[15px] font-semibold text-primary-700 shadow-lg transition-colors hover:bg-secondary-300"
            >
              Get Started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
