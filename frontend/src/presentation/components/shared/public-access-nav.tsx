import Link from "next/link";
import { cn } from "../ui/cn";

export function PublicAccessNav({
  className,
  invert,
}: {
  className?: string;
  invert?: boolean;
}) {
  const startClass = invert
    ? "inline-flex h-9 items-center rounded-full bg-white/90 px-5 text-[13.5px] font-semibold text-primary-700 shadow-sm transition-all hover:bg-white"
    : "inline-flex h-9 items-center rounded-full bg-primary-600 px-5 text-[13.5px] font-semibold text-white shadow-sm transition-all hover:bg-primary-700";

  return (
    <div className={cn("flex items-center", className)}>
      <Link href="/select-role" className={startClass}>
        Get started
      </Link>
    </div>
  );
}
