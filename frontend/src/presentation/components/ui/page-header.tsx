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
    <header className="border-b border-navy-100 bg-white/70 px-4 py-5 backdrop-blur sm:px-6 lg:px-8">
      <nav aria-label="Breadcrumb" className="mb-2">
        <ol className="flex flex-wrap items-center gap-1 text-[11px] text-navy-400">
          <li>
            <Link href="/dashboard" className="hover:text-navy-700">CMPDI</Link>
          </li>
          {breadcrumbs.map((crumb) => (
            <li key={crumb.label} className="flex items-center gap-1">
              <ChevronRight className="size-3" aria-hidden />
              {crumb.href ? (
                <Link href={crumb.href} className="hover:text-navy-700">{crumb.label}</Link>
              ) : (
                <span className="text-navy-600">{crumb.label}</span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl leading-tight font-semibold tracking-tight text-navy-900 sm:text-[28px]">
            {title}
          </h1>
          {description ? (
            <p className="mt-1 max-w-2xl text-sm text-navy-500">{description}</p>
          ) : null}
        </div>
        {action ? <div className="flex shrink-0 flex-wrap gap-2">{action}</div> : null}
      </div>
    </header>
  );
}
