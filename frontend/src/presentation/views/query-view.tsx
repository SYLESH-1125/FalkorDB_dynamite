"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Send, Sparkles, FileText, ChevronDown, Plus, MessageSquareText, Loader2, Quote,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { relativeTime } from "@/src/application/services/formatting";
import { SUGGESTED_QUERIES } from "@/src/domain/entities/query";
import type { ChatMessage, Citation } from "@/src/domain/entities/query";
import { PageHeader } from "../components/ui/page-header";
import { Button } from "../components/ui/button";
import { cn } from "../components/ui/cn";

function CitationCard({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-lg border border-sand-300 bg-sand-200/60">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-sand-200/80"
      >
        <FileText className="size-3.5 shrink-0 text-ink-300" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-xs text-ink-600">{citation.documentName}</span>
        <span className="shrink-0 text-[10px] text-ink-300">p. {citation.page}</span>
        <span className="shrink-0 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
          {Math.round(citation.relevance * 100)}%
        </span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 text-sand-500 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <blockquote className="border-t border-sand-300 px-3 py-2.5">
          <p className="flex gap-1.5 text-xs leading-relaxed text-ink-500 italic">
            <Quote className="mt-0.5 size-3 shrink-0 text-sand-500" aria-hidden />
            {citation.snippet}
          </p>
        </blockquote>
      ) : null}
    </div>
  );
}

export function QueryView() {
  const { data: threadData, loading, setData: setThreads } = useAsync(() => repositories.query.threads(), []);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [appended, setAppended] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [threadListOpen, setThreadListOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const threads = threadData ?? [];
  const activeId = chosenId ?? threads[0]?.id ?? null;
  const activeThread = threads.find((t) => t.id === activeId) ?? null;
  const messages = [...(activeThread?.messages ?? []), ...(activeId ? (appended[activeId] ?? []) : [])];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  function selectThread(id: string) {
    setChosenId(id);
    setThreadListOpen(false);
  }

  function append(threadId: string, message: ChatMessage) {
    setAppended((prev) => ({ ...prev, [threadId]: [...(prev[threadId] ?? []), message] }));
  }

  async function submit(question: string) {
    const trimmed = question.trim();
    if (!trimmed || thinking || !activeId) return;

    const now = new Date();
    append(activeId, {
      id: `msg-${now.getTime()}`,
      role: "user",
      content: trimmed,
      createdAt: now.toISOString(),
      citations: [],
    });
    setInput("");
    setThinking(true);

    const answer = await repositories.query.ask(activeId, trimmed);
    append(activeId, answer);
    setThinking(false);
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(input);
  }

  return (
    <>
      <PageHeader
        title="AI Query & Response System"
        description="Ask questions in plain language. Answers are drawn only from the indexed document corpus, with sources cited."
        breadcrumbs={[{ label: "Intelligence" }, { label: "AI Query System" }]}
        action={
          <Button
            variant="secondary"
            onClick={() => setThreadListOpen((v) => !v)}
            className="lg:hidden"
          >
            <MessageSquareText className="size-4" aria-hidden />
            Threads
          </Button>
        }
      />

      <div className="grid min-w-0 gap-5 p-4 sm:p-6 lg:grid-cols-[16rem_1fr] lg:p-8">
        <aside
          className={cn(
            "rounded-xl border border-sand-300 bg-white",
            !threadListOpen && "hidden lg:block",
          )}
        >
          <div className="border-b border-sand-300 p-3">
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              onClick={async () => {
                const thread = await repositories.query.createThread();
                setThreads([thread, ...threads]);
                setChosenId(thread.id);
                setThreadListOpen(false);
              }}
            >
              <Plus className="size-3.5" aria-hidden />
              New conversation
            </Button>
          </div>
          <ul className="scrollbar-thin max-h-[24rem] divide-y divide-sand-200 overflow-y-auto lg:max-h-[32rem]">
            {threads.map((thread) => (
              <li key={thread.id}>
                <button
                  type="button"
                  onClick={() => selectThread(thread.id)}
                  className={cn(
                    "w-full px-3 py-2.5 text-left transition-colors hover:bg-sand-200",
                    thread.id === activeId && "border-l-2 border-clay-500 bg-clay-50/40",
                  )}
                >
                  <p className="truncate text-[13px] font-medium text-ink-700">{thread.title}</p>
                  <p className="mt-0.5 text-[10px] text-ink-300">{relativeTime(thread.updatedAt)}</p>
                </button>
              </li>
            ))}
          </ul>
        </aside>

        <div className="flex min-h-[34rem] min-w-0 flex-col overflow-hidden rounded-xl border border-sand-300 bg-white">
          <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto p-4 sm:p-6">
            {loading ? (
              <p className="text-center text-sm text-ink-300">Loading conversation…</p>
            ) : messages.length === 0 && !thinking ? (
              <div className="flex h-full flex-col items-center justify-center py-10 text-center">
                <span className="grid size-12 place-items-center rounded-2xl bg-clay-50 text-clay-600">
                  <Sparkles className="size-6" aria-hidden />
                </span>
                <h2 className="mt-4 font-serif text-xl font-semibold text-ink-800">
                  Ask anything about the corpus
                </h2>
                <p className="mt-1.5 max-w-md text-sm text-ink-400">
                  18,942 indexed documents across nine subsidiaries. Every answer cites the
                  source document and page it came from.
                </p>
                <div className="mt-6 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                  {SUGGESTED_QUERIES.map((query) => (
                    <button
                      key={query}
                      type="button"
                      onClick={() => void submit(query)}
                      className="rounded-lg border border-sand-300 bg-sand-200/60 px-3 py-2.5 text-left text-xs text-ink-600 transition-colors hover:border-clay-200 hover:bg-clay-50/50"
                    >
                      {query}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="space-y-5">
                {messages.map((message) => (
                  <li
                    key={message.id}
                    className={cn("flex", message.role === "user" ? "justify-end" : "justify-start")}
                  >
                    <div className={cn("max-w-[46rem]", message.role === "user" && "max-w-[34rem]")}>
                      {message.role === "assistant" ? (
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="grid size-5 place-items-center rounded bg-clay-500 text-white">
                            <Sparkles className="size-3" aria-hidden />
                          </span>
                          <span className="text-[11px] font-medium text-ink-400">CMPDI Assistant</span>
                        </div>
                      ) : null}

                      <div
                        className={cn(
                          "rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-line",
                          message.role === "user"
                            ? "rounded-br-sm bg-ink-800 text-white"
                            : "rounded-bl-sm bg-sand-200/70 text-ink-700",
                        )}
                      >
                        {message.content}
                      </div>

                      {message.citations.length > 0 ? (
                        <div className="mt-2.5">
                          <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-ink-300 uppercase">
                            Sources · {message.citations.length}
                          </p>
                          <div className="space-y-1.5">
                            {message.citations.map((citation) => (
                              <CitationCard key={citation.id} citation={citation} />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}

                {thinking ? (
                  <li className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-sand-200/70 px-4 py-3">
                      <Loader2 className="size-3.5 animate-spin text-clay-500" aria-hidden />
                      <span className="text-sm text-ink-400">Searching the corpus…</span>
                    </div>
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          <div className="border-t border-sand-300 bg-white p-3 sm:p-4">
            {messages.length > 0 ? (
              <div className="scrollbar-thin mb-2.5 flex gap-1.5 overflow-x-auto pb-1">
                {SUGGESTED_QUERIES.slice(0, 3).map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => void submit(query)}
                    className="shrink-0 rounded-full border border-sand-300 bg-sand-200/60 px-3 py-1 text-[11px] whitespace-nowrap text-ink-500 hover:border-clay-200 hover:text-ink-800"
                  >
                    {query.length > 46 ? `${query.slice(0, 46)}…` : query}
                  </button>
                ))}
              </div>
            ) : null}

            <form onSubmit={onSubmit} className="flex items-end gap-2">
              <label htmlFor="query-input" className="sr-only">Ask a question</label>
              <textarea
                id="query-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(input);
                  }
                }}
                placeholder="Ask about production, clearances, safety, land acquisition…"
                className="max-h-32 min-h-10 flex-1 resize-none rounded-xl border border-sand-400 px-3.5 py-2.5 text-sm text-ink-800 placeholder:text-sand-500 focus:border-clay-400"
              />
              <Button type="submit" disabled={!input.trim() || thinking} aria-label="Send question">
                <Send className="size-4" aria-hidden />
                <span className="hidden sm:inline">Send</span>
              </Button>
            </form>
            <p className="mt-2 text-[10px] text-ink-300">
              Answers are generated from indexed documents only. Verify figures against the cited source before publication.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
