import type { ReactNode } from "react";
import { cn } from "./cn";

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <section
      className={cn("card-raise min-w-0 rounded-lg border border-hairline bg-surface-card", className)}
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
    <div
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-hairline px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="title-sm truncate text-ink-0">{title}</h2>
        {description ? <p className="mt-1 text-[12.5px] text-body">{description}</p> : null}
      </div>
      {action ? <div className="min-w-0 max-w-full">{action}</div> : null}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
