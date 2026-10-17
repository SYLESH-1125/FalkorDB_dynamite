"use client";

import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";

export function Parallax({
  children, speed = 0.15, className, style, ...rest
}: {
  children?: ReactNode;
  speed?: number;
  className?: string;
  style?: CSSProperties;
  "aria-hidden"?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    function handleScroll() {
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const center = rect.top + rect.height / 2 - window.innerHeight / 2;
      setOffset(center * speed);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [speed]);

  return (
    <div
      ref={ref}
      className={className}
      style={{ ...style, transform: `translateY(${-offset}px)`, willChange: "transform" }}
      {...rest}
    >
      {children}
    </div>
  );
}
