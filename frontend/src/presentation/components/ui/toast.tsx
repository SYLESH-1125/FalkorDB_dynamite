"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from "lucide-react";
import { cn } from "./cn";

type ToastTone = "success" | "error" | "warning" | "info";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: ToastTone;
}

const ToastContext = createContext<{
  notify: (toast: Omit<Toast, "id">) => void;
} | null>(null);

const ICONS: Record<ToastTone, ReactNode> = {
  success: <CheckCircle2 className="size-4 text-success" aria-hidden />,
  error: <XCircle className="size-4 text-danger" aria-hidden />,
  warning: <AlertTriangle className="size-4 text-warning" aria-hidden />,
  info: <Info className="size-4 text-muted" aria-hidden />,
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const notify = useCallback((toast: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { ...toast, id }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 4500);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed right-3 bottom-3 z-100 flex w-[min(22rem,calc(100vw-1.5rem))] flex-col gap-2"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={cn(
              "card-float pointer-events-auto flex items-start gap-2.5 rounded-lg border border-hairline bg-surface-card p-3.5",
            )}
          >
            <span className="mt-0.5">{ICONS[toast.tone]}</span>
            <div className="min-w-0 flex-1">
              <p className="title-sm text-ink-0">{toast.title}</p>
              {toast.description ? (
                <p className="mt-0.5 text-[12.5px] text-body">{toast.description}</p>
              ) : null}
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-muted-soft transition-colors hover:text-ink-0"
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error("useToast must be used within ToastProvider");
  return context;
}
