import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "../ui/cn";

export function PublicAccessNav({
  className,
  invert,
}: {
  className?: string;
  invert?: boolean;
}) {
  const linkClass = invert
    ? "bubble-glass inline-flex h-9 items-center px-4 text-[13.5px] font-medium text-white/90"
    : "inline-flex h-9 items-center rounded-full border border-hairline bg-surface-card px-4 text-[13.5px] font-semibold text-ink-0 transition-colors hover:border-primary-300";

  const startClass = invert
    ? "inline-flex h-9 items-center rounded-full bg-white/90 px-5 text-[13.5px] font-semibold text-primary-700 shadow-sm transition-all hover:bg-white"
    : "inline-flex h-9 items-center gap-1.5 rounded-full bg-primary-600 px-5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-primary-700";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Link href="/login" className={linkClass}>Sign in</Link>
      <Link href="/sign-up" className={linkClass}>Sign up</Link>
      <Link href="/select-role" className={startClass}>
        Get started
        {!invert ? <ArrowRight className="size-3.5" aria-hidden /> : null}
      </Link>
    </div>
  );
}
