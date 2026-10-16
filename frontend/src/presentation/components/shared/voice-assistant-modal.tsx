"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Sparkles, X } from "lucide-react";
import { useVoiceInput } from "@/src/application/hooks/use-voice-input";
import { useSpeechSynthesis } from "@/src/application/hooks/use-speech-synthesis";
import { VOICE_LANGUAGES } from "@/src/domain/entities/query";
import { cn } from "../ui/cn";

const GREETING =
  "I'm Bhumi, Voice Assistant from Ministry of Coal, able to speak in 22 Indian languages. How can I help you today?";

type Phase = "greeting" | "listening" | "idle";

export function VoiceAssistantModal({
  open, lang, onClose, onSubmit,
}: {
  open: boolean;
  lang: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  if (!open) return null;
  return <VoiceAssistantSession key={lang} lang={lang} onClose={onClose} onSubmit={onSubmit} />;
}

function VoiceAssistantSession({
  lang, onClose, onSubmit,
}: {
  lang: string;
  onClose: () => void;
  onSubmit: (text: string) => void;
}) {
  const [phase, setPhase] = useState<Phase>("greeting");
  const [transcript, setTranscript] = useState("");
  const submittedRef = useRef(false);

  const { speak, cancel: cancelSpeech } = useSpeechSynthesis();
  const { supported: voiceSupported, listening, start, stop } = useVoiceInput(lang, (text, isFinal) => {
    setTranscript(text);
    if (isFinal && text.trim()) {
      submittedRef.current = true;
      onSubmit(text.trim());
    }
  });

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    void speak(GREETING, lang, () => {
      if (cancelled) return;
      // let the audio device release before requesting the mic, or Chrome drops the session immediately
      timer = setTimeout(() => {
        if (cancelled) return;
        setPhase("listening");
        start();
      }, 350);
    });

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      cancelSpeech();
      stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!listening && phase === "listening" && !submittedRef.current) setPhase("idle");
  }, [listening, phase]);

  function handleClose() {
    cancelSpeech();
    stop();
    onClose();
  }

  function retry() {
    setTranscript("");
    setPhase("listening");
    start();
  }

  const languageLabel = VOICE_LANGUAGES.find((l) => l.code === lang)?.label ?? "English";
  const isSpeaking = phase === "greeting";
  const isListening = phase === "listening";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-0/60 backdrop-blur-sm" onClick={handleClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bhumi voice assistant"
        className="card-float relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-3xl bg-surface-card px-6 py-10 text-center"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="Close voice assistant"
          className="absolute right-4 top-4 grid size-9 place-items-center rounded-full text-muted-soft transition-colors hover:bg-surface-soft hover:text-ink-0"
        >
          <X className="size-4.5" aria-hidden />
        </button>

        <div className="relative grid size-32 shrink-0 place-items-center">
          {isListening ? (
            <>
              <span className="absolute inset-0 rounded-full bg-primary-500/20 animate-voice-ring" aria-hidden />
              <span
                className="absolute inset-0 rounded-full bg-primary-500/20 animate-voice-ring"
                style={{ animationDelay: "0.6s" }}
                aria-hidden
              />
              <span
                className="absolute inset-0 rounded-full bg-primary-500/20 animate-voice-ring"
                style={{ animationDelay: "1.2s" }}
                aria-hidden
              />
            </>
          ) : null}

          <span
            className={cn(
              "relative grid size-24 place-items-center rounded-full text-white shadow-lg transition-colors",
              isSpeaking ? "bg-primary-600" : isListening ? "bg-danger" : "bg-ink-0",
            )}
          >
            {isSpeaking ? (
              <span className="flex items-end gap-1" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className="w-1 rounded-full bg-white animate-voice-bar"
                    style={{ height: 22, animationDelay: `${i * 0.12}s` }}
                  />
                ))}
              </span>
            ) : isListening ? (
              <Mic className="size-9" aria-hidden />
            ) : (
              <MicOff className="size-9" aria-hidden />
            )}
          </span>
        </div>

        <p className="mt-6 flex items-center gap-1.5 text-[13px] font-semibold text-primary-600">
          <Sparkles className="size-3.5" aria-hidden />
          Bhumi Voice Assistant
        </p>

        <h2 className="title-md mt-1.5 text-ink-0">
          {isSpeaking ? "Speaking…" : isListening ? "Listening…" : "Didn't catch that"}
        </h2>

        <p className="mt-2 min-h-11 max-w-sm text-sm leading-relaxed text-body">
          {isSpeaking
            ? GREETING
            : transcript
              ? transcript
              : isListening
                ? `Speak now, in ${languageLabel} or any of 22 Indian languages.`
                : "No speech detected. Try again, or close and type your question instead."}
        </p>

        {!voiceSupported ? (
          <p className="mt-4 rounded-xl bg-danger/10 px-4 py-2.5 text-[12.5px] text-danger">
            Voice input isn&apos;t supported in this browser. Please type your question instead.
          </p>
        ) : phase === "idle" ? (
          <button
            type="button"
            onClick={retry}
            className="mt-5 rounded-full bg-ink-0 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-ink-0/90"
          >
            Try again
          </button>
        ) : null}

        <p className="mt-6 text-[10.5px] text-muted-soft">Currently set to {languageLabel} · change language from the composer</p>
      </div>
    </div>
  );
}
