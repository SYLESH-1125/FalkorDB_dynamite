import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn(
        "rounded-xl border border-navy-100 bg-white shadow-[0_1px_2px_rgba(11,37,69,0.04),0_8px_24px_-12px_rgba(11,37,69,0.12)]",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CardHeader({
  title, description, action, className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-wrap items-start justify-between gap-3 border-b border-navy-100 px-4 py-3.5 sm:px-5", className)}>
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight text-navy-900">{title}</h2>
        {description ? <p className="mt-0.5 text-xs text-navy-400">{description}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-4 sm:p-5", className)}>{children}</div>;
}
