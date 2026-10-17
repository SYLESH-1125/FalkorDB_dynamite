"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, Sparkles, X } from "lucide-react";
import { useSarvamVoice } from "@/src/application/hooks/use-sarvam-voice";
import { useVoiceInput } from "@/src/application/hooks/use-voice-input";
import { useSpeechSynthesis } from "@/src/application/hooks/use-speech-synthesis";
import { VOICE_LANGUAGES } from "@/src/domain/entities/query";
import type { ChatMessage } from "@/src/domain/entities/query";
import { cn } from "../ui/cn";

const GREETING =
  "I'm Bhumi, Voice Assistant from Ministry of Coal, able to speak in 22 Indian languages. How can I help you today?";

// the Web Speech API can't auto-detect language, so the browser fallback starts
// from the page locale as its best guess rather than forcing a manual picker
const BROWSER_FALLBACK_LANG = typeof navigator !== "undefined" ? navigator.language || "en-IN" : "en-IN";

type Phase = "greeting" | "listening" | "thinking" | "speaking" | "idle";

export function VoiceAssistantModal({
  open, onClose, onAsk,
}: {
  open: boolean;
  onClose: () => void;
  onAsk: (question: string) => Promise<ChatMessage | null>;
}) {
  if (!open) return null;
  return <VoiceAssistantSession onClose={onClose} onAsk={onAsk} />;
}

function VoiceAssistantSession({
  onClose, onAsk,
}: {
  onClose: () => void;
  onAsk: (question: string) => Promise<ChatMessage | null>;
}) {
  const [phase, setPhase] = useState<Phase>("greeting");
  const [transcript, setTranscript] = useState("");
  const [answerText, setAnswerText] = useState("");
  const [detectedLang, setDetectedLang] = useState<string | null>(null);
  const sessionActiveRef = useRef(true);
  // sarvam.supported resolves one tick after mount (it can't be known during SSR); the
  // greeting must wait for that to settle so it isn't started once on the browser
  // fallback and then restarted on Sarvam a moment later, cutting itself off mid-sentence
  const [voiceReady, setVoiceReady] = useState(false);

  const sarvam = useSarvamVoice();
  const browserSpeech = useSpeechSynthesis();
  const browserInput = useVoiceInput(BROWSER_FALLBACK_LANG, (text, isFinal) => {
    setTranscript(text);
    if (isFinal && text.trim()) void handleFinalTranscript(text.trim(), BROWSER_FALLBACK_LANG);
  });

  useEffect(() => {
    setVoiceReady(true);
  }, []);

  // Sarvam (server-side, Indian-language tuned, true auto-detect) is the primary path;
  // if the mic/API isn't available it falls back to the browser's native APIs.
  const useServerVoice = sarvam.supported && !sarvam.unavailable;
  const voiceSupported = useServerVoice || browserInput.supported;

  async function handleFinalTranscript(text: string, languageCode: string) {
    if (!sessionActiveRef.current) return;
    setDetectedLang(languageCode);
    setTranscript(text);
    setPhase("thinking");

    const answer = await onAsk(text);
    if (!sessionActiveRef.current) return;

    if (!answer) {
      setPhase("idle");
      return;
    }

    setAnswerText(answer.content);
    setPhase("speaking");

    const speakEnded = () => {
      if (!sessionActiveRef.current) return;
      beginListening(languageCode);
    };

    if (useServerVoice) {
      void sarvam.speak(answer.content, languageCode, speakEnded);
    } else {
      void browserSpeech.speak(answer.content, languageCode, speakEnded);
    }
  }

  function beginListening(languageCode?: string) {
    if (!sessionActiveRef.current) return;
    setTranscript("");
    setPhase("listening");
    if (useServerVoice) {
      void sarvam.start(
        (text, detected) => void handleFinalTranscript(text, detected),
        () => sessionActiveRef.current && setPhase("idle"),
        languageCode ?? "unknown",
      );
    } else {
      browserInput.start();
    }
  }

  useEffect(() => {
    if (!voiceReady) return undefined;

    sessionActiveRef.current = true;
    let timer: ReturnType<typeof setTimeout> | undefined;

    function afterGreeting() {
      if (!sessionActiveRef.current) return;
      timer = setTimeout(() => beginListening(), 350);
    }

    if (useServerVoice) {
      void sarvam.speak(GREETING, "en-IN", afterGreeting);
    } else {
      void browserSpeech.speak(GREETING, BROWSER_FALLBACK_LANG, afterGreeting);
    }

    return () => {
      sessionActiveRef.current = false;
      if (timer) clearTimeout(timer);
      sarvam.cancelSpeech();
      sarvam.stop();
      browserSpeech.cancel();
      browserInput.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceReady]);

  function handleClose() {
    sessionActiveRef.current = false;
    sarvam.cancelSpeech();
    sarvam.stop();
    browserSpeech.cancel();
    browserInput.stop();
    onClose();
  }

  function retry() {
    beginListening(detectedLang ?? undefined);
  }

  const languageLabel = detectedLang
    ? (VOICE_LANGUAGES.find((l) => l.code === detectedLang)?.label ?? detectedLang)
    : null;
  const isGreeting = phase === "greeting";
  const isListening = phase === "listening";
  const isThinking = phase === "thinking";
  const isSpeaking = phase === "speaking";
  const isTalking = isGreeting || isSpeaking;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink-0/60 backdrop-blur-sm" onClick={handleClose} aria-hidden />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Bhumi voice assistant"
        className="card-float relative flex w-full max-w-md flex-col items-center overflow-hidden rounded-3xl bg-surface-card px-6 py-10 text-center"
      >
        <div
          className="pointer-events-none absolute -top-24 left-1/2 h-56 w-80 -translate-x-1/2 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(ellipse, rgba(242,183,5,0.22), transparent 65%)" }}
          aria-hidden
        />

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
              isTalking ? "bg-primary-600" : isListening ? "bg-danger" : isThinking ? "bg-secondary-500" : "bg-ink-0",
            )}
          >
            {isTalking ? (
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
            ) : isThinking ? (
              <Sparkles className="size-9 animate-pulse" aria-hidden />
            ) : (
              <MicOff className="size-9" aria-hidden />
            )}
          </span>
        </div>

        <p className="relative mt-6 flex items-center gap-1.5 text-[13px] font-semibold text-primary-600">
          <Sparkles className="size-3.5" aria-hidden />
          Bhumi Voice Assistant
        </p>

        <h2 className="title-md relative mt-1.5 text-ink-0">
          {isGreeting
            ? "Speaking…"
            : isListening
              ? "Listening…"
              : isThinking
                ? "Thinking…"
                : isSpeaking
                  ? "Speaking…"
                  : "Didn't catch that"}
        </h2>

        <p className="relative mt-2 min-h-11 max-w-sm text-sm leading-relaxed text-body">
          {isGreeting
            ? GREETING
            : isThinking
              ? transcript
              : isSpeaking
                ? answerText
                : transcript
                  ? transcript
                  : isListening
                    ? "Speak now, in any Indian language — I'll reply in the same one."
                    : "No speech detected. Try again, or close and type your question instead."}
        </p>

        {!voiceSupported ? (
          <p className="relative mt-4 rounded-xl bg-danger/10 px-4 py-2.5 text-[12.5px] text-danger">
            Voice input isn&apos;t supported in this browser. Please type your question instead.
          </p>
        ) : phase === "idle" ? (
          <button
            type="button"
            onClick={retry}
            className="relative mt-5 rounded-full bg-ink-0 px-5 py-2.5 text-[13px] font-medium text-white transition-colors hover:bg-ink-0/90"
          >
            Try again
          </button>
        ) : null}

        <p className="relative mt-6 text-[10.5px] text-muted-soft">
          {useServerVoice ? "Powered by Sarvam AI" : "Browser speech"}
          {languageLabel ? ` · Detected ${languageLabel}` : " · Auto-detects your language"}
        </p>
      </div>
    </div>
  );
}
