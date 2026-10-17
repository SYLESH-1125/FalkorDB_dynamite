"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSpeechSynthesis } from "@/src/application/hooks/use-speech-synthesis";

const SCENE_VIDEO = "/welcome.mp4";
const EXIT_DURATION_MS = 500;
const FALLBACK_HOLD_MS = 4200;

export function useWelcomeTransition(destination: string) {
  const router = useRouter();
  const [phase, setPhase] = useState<"idle" | "enter" | "exit">("idle");
  const { speak, supported } = useSpeechSynthesis();

  function trigger(event: React.MouseEvent) {
    event.preventDefault();
    setPhase("enter");

    function finish() {
      setPhase("exit");
      setTimeout(() => router.push(destination), EXIT_DURATION_MS);
    }

    speak(
      "Welcome to Bhumi, the Bharat Hub for Unified Mining Intelligence. Start your journey with us.",
      "en-IN",
      finish,
    );
    if (!supported) setTimeout(finish, FALLBACK_HOLD_MS);
  }

  const overlay = phase !== "idle" ? <WelcomeOverlay exiting={phase === "exit"} /> : null;

  return { trigger, overlay };
}

function WelcomeOverlay({ exiting }: { exiting: boolean }) {
  const [backdropIn, setBackdropIn] = useState(false);
  const [peak, setPeak] = useState(false);

  useEffect(() => {
    const t1 = requestAnimationFrame(() => setBackdropIn(true));
    const t2 = setTimeout(() => setPeak(true), 120);
    return () => {
      cancelAnimationFrame(t1);
      clearTimeout(t2);
    };
  }, []);

  const shown = backdropIn && !exiting;

  return (
    <div
      className="fixed inset-0 z-[999] flex items-center justify-center bg-ink-0/40 backdrop-blur-sm transition-opacity ease-out"
      style={{
        transitionDuration: exiting ? `${EXIT_DURATION_MS}ms` : "400ms",
        opacity: shown ? 1 : 0,
      }}
    >
      <div
        className="card-raise relative mx-4 w-full max-w-2xl overflow-hidden rounded-3xl border border-hairline bg-white text-center transition-all ease-out"
        style={{
          transitionDuration: exiting ? `${EXIT_DURATION_MS}ms` : "600ms",
          transitionTimingFunction: exiting
            ? "cubic-bezier(0.4, 0, 1, 1)"
            : "cubic-bezier(0.34, 1.56, 0.64, 1)",
          opacity: shown ? 1 : 0,
          transform: exiting
            ? "scale(0.92) translateY(8px)"
            : peak
              ? "scale(1)"
              : "scale(0.6)",
        }}
      >
        <div className="relative aspect-video w-full overflow-hidden bg-ink-0">
          <video
            className="size-full object-cover"
            src={SCENE_VIDEO}
            autoPlay
            muted
            loop
            playsInline
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-white" aria-hidden />
        </div>

        <div className="px-8 pt-2 pb-11">
          <h1
            className="display-md relative text-[30px] text-ink-0 transition-all ease-out sm:text-[38px]"
            style={{
              transitionDuration: "600ms",
              transitionDelay: "220ms",
              opacity: peak && !exiting ? 1 : 0,
              transform: peak ? "translateY(0) scale(1)" : "translateY(14px) scale(0.85)",
            }}
          >
            Welcome to BHUMI
          </h1>

          <p
            className="relative mt-3 text-[15px] leading-relaxed text-body transition-all ease-out sm:text-[17px]"
            style={{
              transitionDuration: "600ms",
              transitionDelay: "360ms",
              opacity: peak && !exiting ? 1 : 0,
              transform: peak ? "translateY(0)" : "translateY(14px)",
            }}
          >
            Bharat Hub for Unified Mining Intelligence — start your journey with us.
          </p>

          <div
            className="relative mx-auto mt-7 h-1 w-32 overflow-hidden rounded-full bg-hairline-strong transition-opacity duration-500"
            style={{ opacity: peak && !exiting ? 1 : 0, transitionDelay: "480ms" }}
            aria-hidden
          >
            <div
              className="h-full rounded-full bg-primary-500 transition-transform ease-linear"
              style={{
                transitionDuration: exiting ? "0ms" : "3700ms",
                transitionDelay: "480ms",
                transform: peak && !exiting ? "translateX(0%)" : "translateX(-100%)",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
