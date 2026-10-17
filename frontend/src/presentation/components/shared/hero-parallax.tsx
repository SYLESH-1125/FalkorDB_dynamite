"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ChevronDown, Sparkles } from "lucide-react";
import { HeroVideoBackground } from "@/src/presentation/components/shared/hero-video-background";
import bhumiMainLogo from "@/app/assets/bhumi-main-logo.png";

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
  const badgeTranslate = progress * 60;
  const badgeOpacity = 1 - progress * 3;
  const cueOpacity = Math.max(1 - progress * 6, 0);
  const gridTranslate = progress * 40;

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
        <div
          className="pointer-events-none absolute inset-0 -z-10 opacity-[0.08]"
          style={{
            backgroundImage: "url(/background/section-topo.png)",
            backgroundSize: "480px",
            transform: `translateY(${gridTranslate}px)`,
            willChange: "transform",
          }}
          aria-hidden
        />

        <div className="absolute inset-x-0 top-2.5 z-10 flex justify-center px-4 sm:px-6">
          <nav className="nav-glass flex w-full max-w-5xl items-center gap-3 py-2 pr-2 pl-5">
            <Link href="/" className="flex shrink-0 items-center gap-2.5">
              <Image src={bhumiMainLogo} alt="BHUMI" className="h-7 w-auto drop-shadow-sm" priority />
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
                href="/select-role"
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
          <div
            className="mb-6 flex justify-center"
            style={{
              transform: `translateY(${badgeTranslate}px)`,
              opacity: Math.max(badgeOpacity, 0),
              willChange: "transform, opacity",
            }}
          >
            <span className="nav-glass inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-[12px] font-medium text-white/90">
              <Sparkles className="size-3 text-secondary-300" aria-hidden />
              Smart India Hackathon 2026 · Problem Statement 23
            </span>
          </div>

          <Image
            src={bhumiMainLogo}
            alt="BHUMI"
            priority
            className="mx-auto h-auto w-full max-w-3xl px-4 drop-shadow-lg sm:max-w-4xl lg:max-w-5xl"
          />

          <p className="mx-auto mt-5 max-w-2xl text-[15px] leading-relaxed text-white/80 sm:text-base">
            Bharat Hub for Unified Mining Intelligence
          </p>
          <p className="mx-auto mt-2 max-w-xl text-[13.5px] leading-relaxed text-white/60">
            One indexed record of every scan, ledger and clearance across nine coal subsidiaries —
            queryable in plain language, traceable to the page.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/select-role"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-secondary-400 px-8 text-[15px] font-semibold text-primary-700 shadow-lg transition-all duration-300 hover:scale-[1.03] hover:bg-secondary-300"
            >
              Get Started
              <ArrowRight className="size-4" aria-hidden />
            </Link>
            <Link
              href="/help"
              className="bubble-glass inline-flex h-12 items-center text-[15px] font-medium text-white/90"
            >
              See how it works
            </Link>
          </div>
        </div>

        <div
          className="pointer-events-none absolute inset-x-0 bottom-8 flex flex-col items-center gap-1.5 text-white/60"
          style={{ opacity: cueOpacity, willChange: "opacity" }}
          aria-hidden
        >
          <span className="text-[10.5px] font-medium tracking-wide uppercase">Scroll</span>
          <ChevronDown className="size-4 animate-bounce" />
        </div>
      </section>
    </div>
  );
}
