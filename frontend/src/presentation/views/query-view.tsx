"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  Send, Sparkles, FileText, ChevronDown, Plus, Loader2, Quote,
  Mic, Languages, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { useVoiceInput } from "@/src/application/hooks/use-voice-input";
import { relativeTime } from "@/src/application/services/formatting";
import { SUGGESTED_QUERIES, VOICE_LANGUAGES } from "@/src/domain/entities/query";
import type { ChatMessage, Citation } from "@/src/domain/entities/query";
import { VoiceAssistantModal } from "../components/shared/voice-assistant-modal";
import { cn } from "../components/ui/cn";

function CitationCard({ citation }: { citation: Citation }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface-soft">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-surface-soft/80"
      >
        <FileText className="size-3.5 shrink-0 text-muted-soft" aria-hidden />
        <span className="min-w-0 flex-1 truncate text-xs text-body">{citation.documentName}</span>
        <span className="shrink-0 text-[10px] text-muted-soft">p. {citation.page}</span>
        <span className="shrink-0 bg-success/10 px-1.5 py-0.5 text-[9px] font-normal text-success">
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
        </blockquote>
      ) : null}
    </div>
  );
}

function LanguagePicker({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const current = VOICE_LANGUAGES.find((l) => l.code === value) ?? VOICE_LANGUAGES[0];

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label="Voice input language"
        title="Voice input language"
        className="flex h-9 items-center gap-1.5 rounded-full px-2.5 text-[12px] font-medium text-muted-soft transition-colors hover:bg-surface-soft hover:text-ink-0"
      >
        <Languages className="size-4" aria-hidden />
        <span className="hidden sm:inline">{current.label}</span>
      </button>
      {open ? (
        <div className="scrollbar-thin card-raise absolute bottom-full right-0 z-20 mb-2 max-h-72 w-48 overflow-y-auto rounded-xl border border-hairline bg-surface-card p-1">
          {VOICE_LANGUAGES.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => { onChange(l.code); setOpen(false); }}
              className={cn(
                "block w-full rounded-lg px-2.5 py-1.5 text-left text-[12.5px] transition-colors hover:bg-surface-soft",
                l.code === value ? "font-semibold text-primary-600" : "text-body",
              )}
            >
              {l.label}
            </button>
          ))}
        </div>
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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [voiceLang, setVoiceLang] = useState("en-IN");
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { supported: voiceSupported } = useVoiceInput(voiceLang, () => {});

  const threads = threadData ?? [];
  const activeId = chosenId ?? threads[0]?.id ?? null;
  const activeThread = threads.find((t) => t.id === activeId) ?? null;
  const messages = [...(activeThread?.messages ?? []), ...(activeId ? (appended[activeId] ?? []) : [])];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  function selectThread(id: string) {
    setChosenId(id);
    setSidebarOpen(false);
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
    <div className="flex h-[calc(100vh-4rem)] min-h-0 bg-surface-card">
      <aside
        className={cn(
          "flex w-64 shrink-0 flex-col border-r border-hairline bg-surface-soft transition-all",
          sidebarOpen ? "flex" : "hidden lg:flex",
        )}
      >
        <div className="flex items-center gap-2 p-3">
          <button
            type="button"
            onClick={async () => {
              const thread = await repositories.query.createThread();
              setThreads([thread, ...threads]);
              setChosenId(thread.id);
              setSidebarOpen(false);
            }}
            className="flex h-10 flex-1 items-center gap-2 rounded-full border border-hairline-strong px-3.5 text-[13px] font-medium text-body-strong transition-colors hover:bg-surface-card"
          >
            <Plus className="size-4" aria-hidden />
            New conversation
          </button>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Collapse sidebar"
            className="grid size-10 shrink-0 place-items-center rounded-full text-muted-soft transition-colors hover:bg-surface-card hover:text-ink-0 lg:hidden"
          >
            <PanelLeftClose className="size-4" aria-hidden />
          </button>
        </div>
        <ul className="scrollbar-thin flex-1 space-y-0.5 overflow-y-auto px-2 pb-3">
          {threads.map((thread) => (
            <li key={thread.id}>
              <button
                type="button"
                onClick={() => selectThread(thread.id)}
                className={cn(
                  "w-full truncate rounded-lg px-3 py-2.5 text-left text-[13px] transition-colors hover:bg-surface-card",
                  thread.id === activeId ? "bg-surface-card font-medium text-ink-0" : "text-body",
                )}
              >
                <p className="truncate">{thread.title}</p>
                <p className="mt-0.5 text-[10px] text-muted-soft">{relativeTime(thread.updatedAt)}</p>
              </button>
            </li>
          ))}
        </ul>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline px-3 sm:px-5">
          <button
            type="button"
            onClick={() => setSidebarOpen((v) => !v)}
            aria-label="Toggle threads"
            className="grid size-9 place-items-center rounded-full text-body transition-colors hover:bg-surface-soft lg:hidden"
          >
            {sidebarOpen ? <PanelLeftClose className="size-4.5" aria-hidden /> : <PanelLeftOpen className="size-4.5" aria-hidden />}
          </button>
          <span className="flex items-center gap-1.5 text-[15px] font-semibold text-ink-0">
            <Sparkles className="size-4 text-primary-600" aria-hidden />
            BHUMI Assistant
          </span>
        </header>

        <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
          {loading ? (
            <p className="mt-10 text-center text-sm text-muted-soft">Loading conversation…</p>
          ) : messages.length === 0 && !thinking ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 text-center">
              <span className="grid size-14 place-items-center rounded-full bg-primary-50 text-primary-600">
                <Sparkles className="size-7" aria-hidden />
              </span>
              <h2 className="title-lg mt-5 text-ink-0">Ask anything about the corpus</h2>
              <p className="mt-1.5 max-w-md text-sm text-muted">
                18,942 indexed documents across nine subsidiaries. Every answer cites the
                source document and page it came from — type or speak, in any of 23 languages.
              </p>
              <div className="mt-7 grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                {SUGGESTED_QUERIES.map((query) => (
                  <button
                    key={query}
                    type="button"
                    onClick={() => void submit(query)}
                    className="rounded-2xl border border-hairline bg-surface-soft px-4 py-3 text-left text-[13px] text-body transition-colors hover:border-hairline-strong hover:bg-surface-elevated/50"
                  >
                    {query}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <ul className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6">
              {messages.map((message) => (
                <li key={message.id} className="flex gap-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full",
                      message.role === "assistant" ? "bg-primary-600 text-white" : "bg-surface-soft text-body-strong",
                    )}
                  >
                    {message.role === "assistant" ? <Sparkles className="size-4" aria-hidden /> : "You"}
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[13px] font-semibold text-ink-0">
                      {message.role === "assistant" ? "BHUMI Assistant" : "You"}
                    </p>
                    <div className="mt-1 text-[15px] leading-relaxed whitespace-pre-line text-body-strong">
                      {message.content}
                    </div>

                    {message.citations.length > 0 ? (
                      <div className="mt-3">
                        <p className="mb-1.5 text-[10px] font-normal tracking-wider text-muted-soft uppercase">
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
                <li className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-600 text-white">
                    <Sparkles className="size-4" aria-hidden />
                  </span>
                  <div className="flex items-center gap-2 pt-2.5">
                    <Loader2 className="size-3.5 animate-spin text-ink-0" aria-hidden />
                    <span className="text-sm text-muted">Searching the corpus…</span>
                  </div>
                </li>
              ) : null}
            </ul>
          )}
        </div>

        <div className="shrink-0 px-4 pb-4 sm:px-6 sm:pb-6">
          <form
            onSubmit={onSubmit}
            className="mx-auto flex max-w-3xl items-end gap-1.5 rounded-3xl border border-hairline-strong bg-surface-card p-2 shadow-sm focus-within:border-ink-0"
          >
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
              placeholder="Message BHUMI Assistant, or use the mic to speak…"
              className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] text-ink-0 placeholder:text-muted-soft focus:outline-none"
            />

            <LanguagePicker value={voiceLang} onChange={setVoiceLang} />

            {voiceSupported ? (
              <button
                type="button"
                onClick={() => setVoiceModalOpen(true)}
                aria-label="Speak to Bhumi"
                title="Speak your question"
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted-soft transition-colors hover:bg-surface-soft hover:text-ink-0"
              >
                <Mic className="size-4.5" aria-hidden />
              </button>
            ) : null}

            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label="Send question"
              className="grid size-9 shrink-0 place-items-center rounded-full bg-ink-0 text-white transition-colors disabled:bg-hairline-strong disabled:text-muted-soft"
            >
              <Send className="size-4" aria-hidden />
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-soft">
            Answers are generated from indexed documents only. Verify figures against the cited source before publication.
          </p>
        </div>
      </div>

      <VoiceAssistantModal
        open={voiceModalOpen}
        lang={voiceLang}
        onClose={() => setVoiceModalOpen(false)}
        onSubmit={(text) => {
          setVoiceModalOpen(false);
          void submit(text);
        }}
      />
    </div>
  );
}
