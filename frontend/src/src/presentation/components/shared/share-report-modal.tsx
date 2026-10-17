"use client";

import { useState } from "react";
import { Copy, Check, Link2, ShieldCheck, Clock, X } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import type { ShareLink } from "@/src/domain/entities/report";
import { Button } from "../ui/button";
import { Select, Label } from "../ui/field";
import { useToast } from "../ui/toast";

const EXPIRY_OPTIONS = [
  [1, "1 day"], [7, "7 days"], [30, "30 days"], [90, "90 days"],
] as const;

export function ShareReportModal({
  open, reportId, existingShareUrl, onClose, onRevoked,
}: {
  open: boolean;
  reportId: string;
  existingShareUrl: string | null;
  onClose: () => void;
  onRevoked: () => void;
}) {
  const { notify } = useToast();
  const [expiresInDays, setExpiresInDays] = useState(7);
  const [link, setLink] = useState<ShareLink | null>(existingShareUrl ? { shareUrl: existingShareUrl, expiresAt: "" } : null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function createLink() {
    setCreating(true);
    try {
      const result = await repositories.reports.createShareLink(reportId, expiresInDays);
      setLink(result);
    } catch (err) {
      notify({ tone: "error", title: "Could not create share link", description: err instanceof Error ? err.message : undefined });
    } finally {
      setCreating(false);
    }
  }

  async function revoke() {
    await repositories.reports.revokeShareLink(reportId);
    setLink(null);
    onRevoked();
    notify({ tone: "success", title: "Share link revoked", description: "The link no longer grants access." });
  }

  async function copyLink() {
    if (!link) return;
    await navigator.clipboard.writeText(link.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-0/40 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div role="dialog" aria-modal="true" aria-label="Share report" className="card-float relative w-full max-w-md rounded-2xl bg-surface-card p-6">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 grid size-8 place-items-center rounded-full text-muted-soft transition-colors hover:bg-surface-soft hover:text-ink-0"
        >
          <X className="size-4" aria-hidden />
        </button>

        <span className="grid size-10 place-items-center rounded-xl bg-tint-navy text-primary-600">
          <Link2 className="size-5" aria-hidden />
        </span>
        <h2 className="title-md mt-3 text-ink-0">Share this report</h2>
        <p className="mt-1 text-[12.5px] text-body">
          Anyone with the link can view a read-only copy — no BHUMI account required.
        </p>

        {link ? (
          <div className="mt-5 space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-hairline bg-surface-soft px-3 py-2.5">
              <span className="min-w-0 flex-1 truncate text-[12.5px] text-body-strong">{link.shareUrl}</span>
              <button
                type="button"
                onClick={() => void copyLink()}
                aria-label="Copy link"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-soft transition-colors hover:bg-surface-card hover:text-primary-600"
              >
                {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
              </button>
            </div>
            <p className="flex items-center gap-1.5 text-[11.5px] text-muted-soft">
              <ShieldCheck className="size-3.5 shrink-0 text-success" aria-hidden />
              View-only access. Revoke at any time to disable the link immediately.
            </p>
            <Button variant="secondary" className="w-full" onClick={() => void revoke()}>
              Revoke link
            </Button>
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <div>
              <Label htmlFor="share-expiry">Link expires in</Label>
              <div className="relative">
                <Clock className="pointer-events-none absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-soft" aria-hidden />
                <Select
                  id="share-expiry"
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(Number(e.target.value))}
                  className="pl-8"
                >
                  {EXPIRY_OPTIONS.map(([days, label]) => (
                    <option key={days} value={days}>{label}</option>
                  ))}
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={() => void createLink()} disabled={creating}>
              {creating ? "Creating link…" : "Create secure link"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
