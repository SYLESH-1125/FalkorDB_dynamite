"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useWelcomeTransition } from "@/src/presentation/components/shared/welcome-transition";

export function GetStartedCta({ className }: { className?: string }) {
  const { trigger, overlay } = useWelcomeTransition("/select-role");

  return (
    <>
      <Link href="/select-role" onClick={trigger} className={className}>
        Get started
        <ArrowRight className="size-4" aria-hidden />
      </Link>
      {overlay}
    </>
  );
}
