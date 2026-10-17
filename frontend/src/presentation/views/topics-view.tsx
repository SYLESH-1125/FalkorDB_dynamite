"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  Send, FileText, ChevronDown, Plus, Loader2, Quote, Copy, Check,
  ThumbsUp, ThumbsDown, Info, Cloud, LayoutGrid, MessageSquareText,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import type { ChatMessage, Citation } from "@/src/domain/entities/query";
import { extractAnalysisChart } from "@/src/domain/entities/analysis-chart";
import { MarkdownMessage } from "../components/shared/markdown-message";
import { AnalysisChartCard } from "../components/shared/analysis-chart-card";
import { EvidencePanel } from "../components/shared/evidence-panel";
import { WordCloudPanel } from "../components/shared/word-cloud-panel";
import { cn } from "../components/ui/cn";

const SUGGESTED_QUESTIONS = [
  "What are the trends in FY 2024-2025, and what does that suggest for next year?",
  "Which words or events appear most important or prioritised across the corpus?",
  "Which topic cluster has the most documents, and how has it grown over time?",
];

function CitationCard({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface-soft transition-colors hover:border-hairline-strong">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Sources"
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-soft/80"
      >
        <FileText className="size-3.5 shrink-0 text-muted-soft" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-xs text-body">{citation.documentName}</span>
        <span className="shrink-0 text-[10px] text-muted-soft">p. {citation.page}</span>
        <span className="shrink-0 rounded-full bg-tint-leaf px-1.5 py-0.5 text-[9px] font-semibold text-success">
          {Math.round(citation.relevance * 100)}%
        </span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 text-muted-soft transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <blockquote className="border-t border-hairline px-3 py-2.5">
          <p className="flex gap-1.5 text-xs leading-relaxed text-body italic">
            <Quote className="mt-0.5 size-3 shrink-0 text-muted-soft" aria-hidden />
            {citation.snippet}
          </p>
          {citation.table || citation.cell ? (
            <p className="mt-2 flex flex-wrap items-center gap-1 text-[10.5px] font-medium text-muted-soft not-italic">
              <span className="text-primary-600">Trace</span>
              <span aria-hidden>›</span> p.{citation.page}
              {citation.table ? <><span aria-hidden>›</span> {citation.table}</> : null}
              {citation.cell ? <><span aria-hidden>›</span> {citation.cell}</> : null}
            </p>
          ) : null}
        </blockquote>
      ) : null}
    </div>
  );
}

function GeneralKnowledgeNotice({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-secondary-300 bg-secondary-50 px-3 py-2.5">
      <Info className="mt-0.5 size-3.5 shrink-0 text-secondary-600" aria-hidden />
      <p className="text-xs leading-relaxed text-secondary-600">{text}</p>
    </div>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label="Copy answer"
      title="Copy answer"
      className="grid size-7 place-items-center rounded-lg text-muted-soft transition-colors hover:bg-surface-soft hover:text-ink-0"
    >
      {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
    </button>
  );
}

type TopicTab = "cloud" | "ask";

function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex h-8 items-center gap-1.5 rounded-full px-3 text-[12px] font-semibold transition-colors",
        active ? "bg-surface-card text-primary-700 shadow-sm" : "text-body hover:text-ink-0",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

export function TopicsView() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<TopicTab>("cloud");
  const { data: threadData, loading, setData: setThreads } = useAsync(() => repositories.topics.threads(), []);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [pendingUserMessage, setPendingUserMessage] = useState<{ threadId: string; message: ChatMessage } | null>(null);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const threads = threadData ?? [];
  const threadParam = searchParams.get("thread");
  const activeId = chosenId ?? threadParam ?? threads[0]?.id ?? null;
  const activeThread = threads.find((t) => t.id === activeId) ?? null;
  const messages = [
    ...(activeThread?.messages ?? []),
    ...(pendingUserMessage && pendingUserMessage.threadId === activeId ? [pendingUserMessage.message] : []),
  ];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  async function submit(question: string): Promise<ChatMessage | null> {
    const trimmed = question.trim();
    if (!trimmed || thinking) return null;
    if (tab !== "ask") setTab("ask");

    let threadId = activeId;
    if (!threadId) {
      const thread = await repositories.topics.createThread();
      setThreads([thread, ...threads]);
      setChosenId(thread.id);
      threadId = thread.id;
    }

    const now = new Date();
    setPendingUserMessage({
      threadId,
      message: {
        id: `pending-${now.getTime()}`,
        role: "user",
        content: trimmed,
        createdAt: now.toISOString(),
        citations: [],
      },
    });
    setInput("");
    setThinking(true);

    try {
      const answer = await repositories.topics.ask(threadId, trimmed);
      const freshThreads = await repositories.topics.threads();
      setThreads(freshThreads);
      return answer;
    } catch {
      return null;
    } finally {
      setPendingUserMessage(null);
      setThinking(false);
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(input);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-surface-card/80 px-3 backdrop-blur-sm sm:px-5">
        <span className="grid size-7 shrink-0 place-items-center rounded-lg bg-primary-600 text-white">
          <Cloud className="size-3.5" aria-hidden />
        </span>
        <span className="hidden text-[15px] font-semibold text-ink-0 sm:inline">Topic and Word Intelligence</span>

        <div className="ml-auto flex items-center gap-0.5 rounded-full bg-surface-soft p-0.5">
          <TabButton active={tab === "cloud"} onClick={() => setTab("cloud")} icon={<LayoutGrid className="size-3.5" aria-hidden />} label="Word Cloud" />
          <TabButton active={tab === "ask"} onClick={() => setTab("ask")} icon={<MessageSquareText className="size-3.5" aria-hidden />} label="Ask BHUMI" />
        </div>

        {tab === "ask" ? (
          <button
            type="button"
            onClick={async () => {
              const thread = await repositories.topics.createThread();
              setThreads([thread, ...threads]);
              setChosenId(thread.id);
            }}
            className="flex h-8 items-center gap-1.5 rounded-full bg-primary-600 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="size-3.5" aria-hidden />
            <span className="hidden sm:inline">New</span>
          </button>
        ) : null}
      </header>

      {tab === "cloud" ? (
        <div className="min-h-0 flex-1">
          <WordCloudPanel onAsk={() => setTab("ask")} />
        </div>
      ) : (
        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
            {loading ? (
              <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-2 px-4 text-center">
                <Loader2 className="size-5 animate-spin text-primary-600" aria-hidden />
                <p className="text-sm text-muted-soft">Loading conversation…</p>
              </div>
            ) : messages.length === 0 && !thinking ? (
              <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 text-center">
                <span className="relative grid size-16 place-items-center rounded-2xl bg-primary-600 text-white shadow-[0_16px_32px_-12px_rgba(18,48,74,0.5)]">
                  <Cloud className="size-8" aria-hidden />
                  <span
                    className="pointer-events-none absolute -inset-4 -z-10 rounded-full opacity-70 blur-2xl"
                    style={{ background: "radial-gradient(ellipse, rgba(242,183,5,0.25), transparent 70%)" }}
                    aria-hidden
                  />
                </span>
                <h2 className="display-sm mt-6 text-ink-0">Analyse terms, trends and priorities in your corpus</h2>
                <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-body">
                  Grounded in extracted, validated fields and document timelines — with trend
                  analysis, prioritisation and forward-looking outlook where the data supports it.
                </p>
                <div className="mt-8 grid w-full max-w-2xl gap-2.5 sm:grid-cols-1">
                  {SUGGESTED_QUESTIONS.map((question) => (
                    <button
                      key={question}
                      type="button"
                      onClick={() => void submit(question)}
                      className="rounded-2xl border border-hairline bg-surface-card px-4 py-3 text-left text-[13px] text-body shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary-200 hover:shadow-md"
                    >
                      {question}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <ul className="mx-auto max-w-3xl space-y-7 px-4 py-6 sm:px-6">
                {messages.map((message) => (
                  <li key={message.id} className="flex gap-3">
                    <span
                      className={cn(
                        "grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold shadow-sm",
                        message.role === "assistant" ? "bg-primary-600 text-white" : "bg-secondary-400 text-primary-700",
                      )}
                    >
                      {message.role === "assistant" ? <Cloud className="size-4" aria-hidden /> : "DO"}
                    </span>
                    <div className="min-w-0 flex-1 pt-1">
                      <p className="text-[13px] font-semibold text-ink-0">
                        {message.role === "assistant" ? "Topic Intelligence" : "You"}
                      </p>

                      {message.role === "assistant" ? (
                        (() => {
                          const { text, chart } = extractAnalysisChart(message.content);
                          return (
                            <div className="mt-1.5 space-y-3">
                              <div className="rounded-2xl border border-hairline bg-surface-card px-4 py-3.5 text-[14.5px] text-body-strong shadow-sm">
                                <MarkdownMessage content={text} />
                              </div>
                              {chart ? <AnalysisChartCard chart={chart} /> : null}
                            </div>
                          );
                        })()
                      ) : (
                        <div className="mt-1.5 rounded-2xl bg-primary-50 px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line text-body-strong">
                          {message.content}
                        </div>
                      )}

                      {message.evidence ? <EvidencePanel evidence={message.evidence} /> : null}

                      {message.citations.length > 0 ? (
                        message.citations[0].page === 0 ? (
                          <div className="mt-3">
                            <GeneralKnowledgeNotice text={message.citations[0].snippet} />
                          </div>
                        ) : (
                          <div className="mt-3">
                            <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-muted-soft uppercase">
                              Sources · {message.citations.length}
                            </p>
                            <div className="space-y-1.5">
                              {message.citations.map((citation) => (
                                <CitationCard key={citation.id} citation={citation} />
                              ))}
                            </div>
                          </div>
                        )
                      ) : null}

                      {message.role === "assistant" ? (
                        <div className="mt-2 flex items-center gap-0.5">
                          <CopyButton text={message.content} />
                          <button
                            type="button"
                            aria-label="Good response"
                            className="grid size-7 place-items-center rounded-lg text-muted-soft transition-colors hover:bg-surface-soft hover:text-success"
                          >
                            <ThumbsUp className="size-3.5" aria-hidden />
                          </button>
                          <button
                            type="button"
                            aria-label="Poor response"
                            className="grid size-7 place-items-center rounded-lg text-muted-soft transition-colors hover:bg-surface-soft hover:text-danger"
                          >
                            <ThumbsDown className="size-3.5" aria-hidden />
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                ))}

                {thinking ? (
                  <li className="flex gap-3">
                    <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-600 text-white shadow-sm">
                      <Cloud className="size-4" aria-hidden />
                    </span>
                    <div className="mt-1.5 flex items-center gap-2.5 rounded-2xl border border-hairline bg-surface-card px-4 py-3 shadow-sm">
                      <span className="flex items-center gap-1" aria-hidden>
                        {[0, 1, 2].map((i) => (
                          <span
                            key={i}
                            className="size-1.5 rounded-full bg-primary-500 animate-voice-bar"
                            style={{ animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </span>
                      <span className="text-sm text-muted">Analysing terms and topics…</span>
                    </div>
                  </li>
                ) : null}
              </ul>
            )}
          </div>

          <div className="shrink-0 bg-canvas px-4 pb-4 sm:px-6 sm:pb-6">
            <form
              onSubmit={onSubmit}
              className="mx-auto flex max-w-3xl items-end gap-1.5 rounded-3xl border border-hairline-strong bg-surface-card p-2 shadow-[0_8px_24px_-12px_rgba(18,48,74,0.18)] transition-colors focus-within:border-primary-400 focus-within:shadow-[0_12px_28px_-10px_rgba(18,48,74,0.28)]"
            >
              <label htmlFor="topic-input" className="sr-only">Ask a question about terms and topics</label>
              <textarea
                ref={textareaRef}
                id="topic-input"
                rows={1}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void submit(input);
                  }
                }}
                placeholder="Ask about trends, priorities, terms or topic clusters…"
                className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] text-ink-0 placeholder:text-muted-soft focus:outline-none focus-visible:outline-none"
                style={{ outline: "none" }}
              />

              <button
                type="submit"
                disabled={!input.trim() || thinking}
                aria-label="Send question"
                className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-600 text-white transition-all duration-200 enabled:hover:scale-105 enabled:hover:bg-primary-700 disabled:bg-hairline-strong disabled:text-muted-soft"
              >
                <Send className="size-4" aria-hidden />
              </button>
            </form>
            <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-soft">
              Analysis and predictions are AI-generated interpretation, not verified fact. Verify figures against the cited source before publication.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
