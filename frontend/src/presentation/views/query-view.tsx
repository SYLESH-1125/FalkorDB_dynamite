"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import {
  Send, FileText, ChevronDown, Plus, Loader2, Quote,
  Mic, Copy, Check, ThumbsUp, ThumbsDown, Languages, Info,
} from "lucide-react";
import bhumiLogo from "@/app/assets/bhumi-logo.png";
import { repositories } from "@/src/application/services/container";
import { useAsync } from "@/src/application/hooks/use-async";
import { useSarvamVoice } from "@/src/application/hooks/use-sarvam-voice";
import type { ChatMessage, Citation } from "@/src/domain/entities/query";
import { getQueryStrings, QUERY_UI_LANGUAGES } from "@/src/domain/entities/query-i18n";
import { VoiceAssistantModal } from "../components/shared/voice-assistant-modal";
import { MarkdownMessage } from "../components/shared/markdown-message";
import { cn } from "../components/ui/cn";

function PageLanguagePicker({ value, onChange, label }: { value: string; onChange: (code: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const current = QUERY_UI_LANGUAGES.find((l) => l.code === value) ?? QUERY_UI_LANGUAGES[0];

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
        aria-label={label}
        title={label}
        className="flex h-8 items-center gap-1.5 rounded-full border border-hairline px-2.5 text-[12px] font-medium text-body transition-colors hover:bg-surface-soft hover:text-ink-0"
      >
        <Languages className="size-3.5" aria-hidden />
        {current.label}
      </button>
      {open ? (
        <div className="scrollbar-thin card-raise absolute top-full right-0 z-20 mt-2 max-h-72 w-40 overflow-y-auto rounded-xl border border-hairline bg-surface-card p-1">
          {QUERY_UI_LANGUAGES.map((l) => (
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

function CitationCard({ citation, sourcesLabel }: { citation: Citation; sourcesLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface-soft transition-colors hover:border-hairline-strong">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={sourcesLabel}
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

function CopyButton({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      aria-label={label}
      title={label}
      className="grid size-7 place-items-center rounded-lg text-muted-soft transition-colors hover:bg-surface-soft hover:text-ink-0"
    >
      {copied ? <Check className="size-3.5 text-success" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
    </button>
  );
}

export function QueryView() {
  const searchParams = useSearchParams();
  const { data: threadData, loading, setData: setThreads } = useAsync(() => repositories.query.threads(), []);
  const [chosenId, setChosenId] = useState<string | null>(null);
  const [appended, setAppended] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);
  const [pageLang, setPageLang] = useState("en-IN");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const strings = getQueryStrings(pageLang);

  const { supported: sarvamSupported } = useSarvamVoice();
  const [browserSpeechSupported, setBrowserSpeechSupported] = useState(false);
  useEffect(() => {
    setBrowserSpeechSupported("SpeechRecognition" in window || "webkitSpeechRecognition" in window);
  }, []);
  const voiceSupported = sarvamSupported || browserSpeechSupported;

  const threads = threadData ?? [];
  const threadParam = searchParams.get("thread");
  const activeId = chosenId ?? threadParam ?? threads[0]?.id ?? null;
  const activeThread = threads.find((t) => t.id === activeId) ?? null;
  const messages = [...(activeThread?.messages ?? []), ...(activeId ? (appended[activeId] ?? []) : [])];

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages.length, thinking]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  function append(threadId: string, message: ChatMessage) {
    setAppended((prev) => ({ ...prev, [threadId]: [...(prev[threadId] ?? []), message] }));
  }

  async function submit(question: string): Promise<ChatMessage | null> {
    const trimmed = question.trim();
    if (!trimmed || thinking) return null;

    let threadId = activeId;
    if (!threadId) {
      const thread = await repositories.query.createThread();
      setThreads([thread, ...threads]);
      setChosenId(thread.id);
      threadId = thread.id;
    }

    const now = new Date();
    append(threadId, {
      id: `msg-${now.getTime()}`,
      role: "user",
      content: trimmed,
      createdAt: now.toISOString(),
      citations: [],
    });
    setInput("");
    setThinking(true);

    const answer = await repositories.query.ask(threadId, trimmed);
    append(threadId, answer);
    setThinking(false);
    return answer;
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void submit(input);
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-canvas">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b border-hairline bg-surface-card/80 px-3 backdrop-blur-sm sm:px-5">
          <span className="grid size-7 shrink-0 place-items-center overflow-hidden rounded-lg bg-white ring-1 ring-hairline">
            <Image src={bhumiLogo} alt="" width={28} height={28} className="size-full object-contain p-0.5" />
          </span>
          <span className="text-[15px] font-semibold text-ink-0">{strings.assistantName}</span>
          <span className="ml-1 hidden items-center gap-1 rounded-full bg-tint-leaf px-2 py-0.5 text-[10.5px] font-semibold text-success sm:inline-flex">
            <span className="size-1.5 rounded-full bg-success" aria-hidden />
            {strings.online}
          </span>

          <button
            type="button"
            onClick={async () => {
              const thread = await repositories.query.createThread();
              setThreads([thread, ...threads]);
              setChosenId(thread.id);
            }}
            className="ml-auto flex h-8 items-center gap-1.5 rounded-full bg-primary-600 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-primary-700"
          >
            <Plus className="size-3.5" aria-hidden />
            {strings.newConversation}
          </button>

          <PageLanguagePicker value={pageLang} onChange={setPageLang} label={strings.pageLanguage} />
        </header>

        <div ref={scrollRef} className="scrollbar-thin flex-1 overflow-y-auto">
          {loading ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center gap-2 px-4 text-center">
              <Loader2 className="size-5 animate-spin text-primary-600" aria-hidden />
              <p className="text-sm text-muted-soft">{strings.loadingConversation}</p>
            </div>
          ) : messages.length === 0 && !thinking ? (
            <div className="mx-auto flex h-full max-w-3xl flex-col items-center justify-center px-4 text-center">
              <span className="relative grid size-16 place-items-center overflow-hidden rounded-2xl bg-white shadow-[0_16px_32px_-12px_rgba(18,48,74,0.5)] ring-1 ring-hairline">
                <Image src={bhumiLogo} alt="" width={64} height={64} className="size-full object-contain p-2" />
                <span
                  className="pointer-events-none absolute -inset-4 -z-10 rounded-full opacity-70 blur-2xl"
                  style={{ background: "radial-gradient(ellipse, rgba(242,183,5,0.25), transparent 70%)" }}
                  aria-hidden
                />
              </span>
              <h2 className="display-sm mt-6 text-ink-0">{strings.emptyTitle}</h2>
              <p className="mt-2 max-w-md text-[14.5px] leading-relaxed text-body">
                {strings.emptyBody}
              </p>
            </div>
          ) : (
            <ul className="mx-auto max-w-3xl space-y-7 px-4 py-6 sm:px-6">
              {messages.map((message) => (
                <li key={message.id} className="flex gap-3">
                  <span
                    className={cn(
                      "grid size-8 shrink-0 place-items-center rounded-full text-[12px] font-semibold shadow-sm",
                      message.role === "assistant" ? "overflow-hidden bg-white ring-1 ring-hairline" : "bg-secondary-400 text-primary-700",
                    )}
                  >
                    {message.role === "assistant" ? (
                      <Image src={bhumiLogo} alt="" width={32} height={32} className="size-full object-contain p-1" />
                    ) : "PR"}
                  </span>
                  <div className="min-w-0 flex-1 pt-1">
                    <p className="text-[13px] font-semibold text-ink-0">
                      {message.role === "assistant" ? strings.assistantName : strings.you}
                    </p>

                    {message.role === "assistant" ? (
                      <div className="mt-1.5 rounded-2xl border border-hairline bg-surface-card px-4 py-3.5 text-[14.5px] text-body-strong shadow-sm">
                        <MarkdownMessage content={message.content} />
                      </div>
                    ) : (
                      <div className="mt-1.5 rounded-2xl bg-primary-50 px-4 py-3 text-[15px] leading-relaxed whitespace-pre-line text-body-strong">
                        {message.content}
                      </div>
                    )}

                    {message.citations.length > 0 ? (
                      message.citations[0].page === 0 ? (
                        <div className="mt-3">
                          <GeneralKnowledgeNotice text={message.citations[0].snippet} />
                        </div>
                      ) : (
                        <div className="mt-3">
                          <p className="mb-1.5 text-[10px] font-semibold tracking-wider text-muted-soft uppercase">
                            {strings.sources} · {message.citations.length}
                          </p>
                          <div className="space-y-1.5">
                            {message.citations.map((citation) => (
                              <CitationCard key={citation.id} citation={citation} sourcesLabel={strings.sources} />
                            ))}
                          </div>
                        </div>
                      )
                    ) : null}

                    {message.role === "assistant" ? (
                      <div className="mt-2 flex items-center gap-0.5">
                        <CopyButton text={message.content} label={strings.copyAnswer} />
                        <button
                          type="button"
                          aria-label={strings.goodResponse}
                          className="grid size-7 place-items-center rounded-lg text-muted-soft transition-colors hover:bg-surface-soft hover:text-success"
                        >
                          <ThumbsUp className="size-3.5" aria-hidden />
                        </button>
                        <button
                          type="button"
                          aria-label={strings.poorResponse}
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
                  <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-hairline">
                    <Image src={bhumiLogo} alt="" width={32} height={32} className="size-full object-contain p-1" />
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
                    <span className="text-sm text-muted">{strings.searching}</span>
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
            <label htmlFor="query-input" className="sr-only">{strings.askAQuestion}</label>
            <textarea
              ref={textareaRef}
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
              placeholder={strings.inputPlaceholder}
              className="max-h-40 min-h-10 flex-1 resize-none bg-transparent px-2.5 py-2 text-[15px] text-ink-0 placeholder:text-muted-soft focus:outline-none focus-visible:outline-none"
              style={{ outline: "none" }}
            />

            {voiceSupported ? (
              <button
                type="button"
                onClick={() => setVoiceModalOpen(true)}
                aria-label={strings.speakToBhumi}
                title={strings.speakToBhumi}
                className="grid size-9 shrink-0 place-items-center rounded-full text-muted-soft transition-colors hover:bg-surface-soft hover:text-primary-600"
              >
                <Mic className="size-4.5" aria-hidden />
              </button>
            ) : null}

            <button
              type="submit"
              disabled={!input.trim() || thinking}
              aria-label={strings.sendQuestion}
              className="grid size-9 shrink-0 place-items-center rounded-full bg-primary-600 text-white transition-all duration-200 enabled:hover:scale-105 enabled:hover:bg-primary-700 disabled:bg-hairline-strong disabled:text-muted-soft"
            >
              <Send className="size-4" aria-hidden />
            </button>
          </form>
          <p className="mx-auto mt-2 max-w-3xl text-center text-[10px] text-muted-soft">
            {strings.disclaimer}
          </p>
        </div>
      </div>

      <VoiceAssistantModal
        open={voiceModalOpen}
        onClose={() => setVoiceModalOpen(false)}
        onAsk={submit}
      />
    </div>
  );
}
