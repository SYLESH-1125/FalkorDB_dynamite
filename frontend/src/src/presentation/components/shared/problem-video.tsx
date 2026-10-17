"use client";

import { useRef, useState } from "react";
import { Volume2, VolumeX, Play } from "lucide-react";

export function ProblemVideo({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [started, setStarted] = useState(false);

  function toggleSound() {
    const el = videoRef.current;
    if (!el) return;
    el.muted = !el.muted;
    setMuted(el.muted);
    if (!el.muted) void el.play();
  }

  return (
    <div className="group relative overflow-hidden rounded-2xl border border-white/10 bg-ink-0 shadow-[0_32px_80px_-24px_rgba(0,0,0,0.6)]">
      <video
        ref={videoRef}
        className="aspect-video w-full object-cover"
        src={src}
        autoPlay
        muted
        loop
        playsInline
        onPlaying={() => setStarted(true)}
      />

      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent" aria-hidden />

      <button
        type="button"
        onClick={toggleSound}
        aria-label={muted ? "Unmute video" : "Mute video"}
        className="absolute right-4 bottom-4 flex h-10 items-center gap-2 rounded-full bg-black/55 px-4 text-[12.5px] font-medium text-white backdrop-blur-sm transition-all hover:bg-black/70"
      >
        {muted ? <VolumeX className="size-4" aria-hidden /> : <Volume2 className="size-4" aria-hidden />}
        {muted ? "Tap for sound" : "Sound on"}
      </button>

      {!started ? (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-ink-0/20">
          <span className="grid size-16 place-items-center rounded-full bg-white/15 backdrop-blur-sm">
            <Play className="size-6 fill-white text-white" aria-hidden />
          </span>
        </div>
      ) : null}
    </div>
  );
}
