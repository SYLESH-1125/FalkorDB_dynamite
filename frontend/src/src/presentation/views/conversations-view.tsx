"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageSquareText, Plus, Search } from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime } from "@/src/application/services/formatting";
import { PageHeader } from "../components/ui/page-header";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { EmptyState } from "../components/ui/empty-state";
import { Skeleton } from "../components/ui/skeleton";

export function ConversationsView({
  source = "query",
  title = "Conversations",
  description = "Every question asked of the BHUMI Assistant, across every thread.",
  parentLabel = "AI Query System",
  parentHref = "/query",
}: {
  source?: "query" | "topics";
  title?: string;
  description?: string;
  parentLabel?: string;
  parentHref?: string;
}) {
  const router = useRouter();
  const repo = source === "topics" ? repositories.topics : repositories.query;
  const { data, loading, setData } = useAsync(() => repo.threads(), [source]);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const threads = data ?? [];
  const filtered = search.trim()
    ? threads.filter((t) => t.title.toLowerCase().includes(search.trim().toLowerCase()))
    : threads;

  async function createConversation() {
    setCreating(true);
    const thread = await repo.createThread();
    setData([thread, ...threads]);
    router.push(`${parentHref}?thread=${thread.id}`);
  }

  return (
    <>
      <PageHeader
        title={title}
        description={description}
        breadcrumbs={[{ label: "Intelligence" }, { label: parentLabel, href: parentHref }, { label: "Conversations" }]}
        action={
          <Button onClick={() => void createConversation()} disabled={creating}>
            <Plus className="size-4" aria-hidden />
            New conversation
          </Button>
        }
      />

      <div className="p-4 sm:p-6 lg:p-8">
        <div className="relative mb-5 max-w-md">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-soft" aria-hidden />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search conversations…"
            className="h-10 w-full rounded-lg border border-hairline bg-surface-card pr-3 pl-9 text-[13.5px] text-ink-0 placeholder:text-muted-soft focus:border-primary-400 focus:outline-none"
          />
        </div>

        <Card>
          {loading ? (
            <div className="space-y-0 divide-y divide-hairline">
              {Array.from({ length: 5 }, (_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-4">
                  <Skeleton className="size-9 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3.5 w-1/3" />
                    <Skeleton className="h-3 w-1/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<MessageSquareText className="size-5" aria-hidden />}
              title={search ? "No conversations match" : "No conversations yet"}
              description={
                search
                  ? "Try a different search term."
                  : "Start a new conversation with the BHUMI Assistant to see it here."
              }
              action={
                !search ? (
                  <Button onClick={() => void createConversation()} disabled={creating}>
                    <Plus className="size-4" aria-hidden />
                    New conversation
                  </Button>
                ) : undefined
              }
            />
          ) : (
            <ul className="divide-y divide-hairline">
              {filtered.map((thread) => (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => router.push(`${parentHref}?thread=${thread.id}`)}
                    className="group flex w-full items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-surface-soft"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-tint-navy text-primary-600">
                      <MessageSquareText className="size-4" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-semibold text-body-strong group-hover:text-primary-700">
                        {thread.title}
                      </span>
                      <span
                        className="mt-0.5 block text-[11.5px] text-muted-soft"
                        title={new Date(thread.updatedAt).toLocaleString()}
                      >
                        {thread.messages.length} message{thread.messages.length === 1 ? "" : "s"} · {relativeTime(thread.updatedAt)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
