"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { repositories } from "@/src/application/services/container";

function pickRecorderMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) return type;
  }
  return "";
}

// voice-activity thresholds: below this RMS is treated as silence
const SILENCE_THRESHOLD = 0.02;
// how long the user must be silent, after having spoken, before we auto-stop
const SILENCE_HANGOVER_MS = 1200;
// safety cap so a stuck stream can't record forever
const MAX_RECORDING_MS = 20_000;
const VAD_POLL_MS = 100;

export function useSarvamVoice() {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [unavailable, setUnavailable] = useState(false);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const vadTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const maxDurationTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSupported("MediaRecorder" in window && !!navigator.mediaDevices);
  }, []);

  const teardownVad = useCallback(() => {
    if (vadTimerRef.current) { clearInterval(vadTimerRef.current); vadTimerRef.current = null; }
    if (maxDurationTimerRef.current) { clearTimeout(maxDurationTimerRef.current); maxDurationTimerRef.current = null; }
    if (audioCtxRef.current) { void audioCtxRef.current.close(); audioCtxRef.current = null; }
  }, []);

  const stop = useCallback(() => {
    teardownVad();
    recorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    setListening(false);
  }, [teardownVad]);

  // "unknown" tells Sarvam to auto-detect the spoken language rather than assume one
  const start = useCallback(
    async (
      onTranscript: (text: string, detectedLanguageCode: string) => void,
      onError?: () => void,
      languageCode = "unknown",
    ) => {
      if (!supported) return;
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        chunksRef.current = [];

        const mimeType = pickRecorderMimeType();
        const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
        recorder.ondataavailable = (e) => {
          if (e.data.size > 0) chunksRef.current.push(e.data);
        };
        recorder.onstop = async () => {
          teardownVad();
          stream.getTracks().forEach((t) => t.stop());
          setListening(false);
          if (chunksRef.current.length === 0) return;

          const blob = new Blob(chunksRef.current, { type: mimeType || "audio/webm" });
          try {
            const { transcript, languageCode: detected } = await repositories.voice.transcribe(blob, languageCode);
            if (transcript.trim()) onTranscript(transcript.trim(), detected || languageCode);
            else onError?.();
          } catch {
            setUnavailable(true);
            onError?.();
          }
        };

        // voice-activity detection: auto-stop once the user has spoken and then paused,
        // so the recording is submitted without requiring a manual "stop" action
        const AudioCtx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const audioCtx = new AudioCtx();
        audioCtxRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 512;
        source.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);

        let hasSpoken = false;
        let silenceStartedAt: number | null = null;

        vadTimerRef.current = setInterval(() => {
          analyser.getByteTimeDomainData(data);
          let sumSquares = 0;
          for (let i = 0; i < data.length; i += 1) {
            const normalized = (data[i] - 128) / 128;
            sumSquares += normalized * normalized;
          }
          const rms = Math.sqrt(sumSquares / data.length);

          if (rms > SILENCE_THRESHOLD) {
            hasSpoken = true;
            silenceStartedAt = null;
          } else if (hasSpoken) {
            if (silenceStartedAt === null) silenceStartedAt = Date.now();
            else if (Date.now() - silenceStartedAt >= SILENCE_HANGOVER_MS) {
              stop();
            }
          }
        }, VAD_POLL_MS);

        maxDurationTimerRef.current = setTimeout(stop, MAX_RECORDING_MS);

        recorderRef.current = recorder;
        recorder.start();
        setListening(true);
      } catch {
        setUnavailable(true);
        onError?.();
      }
    },
    [supported, stop, teardownVad],
  );

  const speak = useCallback(async (text: string, languageCode: string, onEnd?: () => void) => {
    try {
      const blob = await repositories.voice.speak(text, languageCode);
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onplay = () => setSpeaking(true);
      audio.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); onEnd?.(); };
      audio.onerror = () => { setSpeaking(false); URL.revokeObjectURL(url); onEnd?.(); };
      await audio.play();
    } catch {
      setUnavailable(true);
      onEnd?.();
    }
  }, []);

  const cancelSpeech = useCallback(() => {
    audioRef.current?.pause();
    setSpeaking(false);
  }, []);

  return { supported, unavailable, listening, speaking, start, stop, speak, cancelSpeech };
}
