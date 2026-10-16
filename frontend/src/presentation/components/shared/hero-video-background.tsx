"use client";

import { useEffect, useRef, useState } from "react";

const VIDEOS = [
  "/background/heroVid1.mp4",
  "/background/heroVid2.mp4",
  "/background/heroVid3.mp4",
];

export function HeroVideoBackground() {
  const [active, setActive] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  useEffect(() => {
    const current = videoRefs.current[active];
    if (current) {
      current.currentTime = 0;
      void current.play();
    }
  }, [active]);

  function handleEnded() {
    setActive((i) => (i + 1) % VIDEOS.length);
  }

  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      {VIDEOS.map((src, i) => (
        <video
          key={src}
          ref={(el) => {
            videoRefs.current[i] = el;
          }}
          className="absolute inset-0 size-full object-cover transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === active ? 1 : 0 }}
          muted
          playsInline
          autoPlay={i === 0}
          onEnded={i === active ? handleEnded : undefined}
          aria-hidden
        >
          <source src={src} type="video/mp4" />
        </video>
      ))}

      <div className="absolute inset-0 bg-ink-0/45" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-[4%] bg-gradient-to-b from-transparent to-canvas" aria-hidden />
    </div>
  );
}
