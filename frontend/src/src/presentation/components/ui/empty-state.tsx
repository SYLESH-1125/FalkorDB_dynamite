import type { ReactNode } from "react";
import { Inbox } from "lucide-react";

export function EmptyState({
  title, description, action, icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3.5 grid size-11 place-items-center rounded-xl bg-surface-soft text-muted">
        {icon ?? <Inbox className="size-5" aria-hidden />}
      </div>
      <p className="title-sm text-ink-0">{title}</p>
      {description ? <p className="mt-1.5 max-w-sm text-[12.5px] text-body">{description}</p> : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
