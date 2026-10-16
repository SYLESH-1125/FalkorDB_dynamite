import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

export function PageHeader({
  title, description, breadcrumbs = [], action,
}: {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  action?: ReactNode;
}) {
  return (
    <header className="border-b border-hairline bg-canvas px-4 py-6 sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-2.5">
        <ol className="flex flex-wrap items-center gap-1 text-[12px] text-muted">
          <li>
            <Link href="/dashboard" className="transition-colors hover:text-ink-0">CMPDI</Link>
          </li>
          {breadcrumbs.map((crumb) => (
            <li key={crumb.label} className="flex items-center gap-1">
              <ChevronRight className="size-3" aria-hidden />
              {crumb.href ? (
                <Link href={crumb.href} className="transition-colors hover:text-ink-0">{crumb.label}</Link>
              ) : (
                <span className="text-body">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="display-md text-ink-0">{title}</h1>
          {description ? (
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-body">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2.5">{action}</div> : null}
      </div>
    </header>
  );
}
