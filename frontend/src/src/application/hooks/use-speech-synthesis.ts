"use client";

import { useEffect, useRef, useState } from "react";

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  const existing = window.speechSynthesis.getVoices();
  if (existing.length > 0) return Promise.resolve(existing);
  return new Promise((resolve) => {
    const onVoicesChanged = () => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    };
    window.speechSynthesis.addEventListener("voiceschanged", onVoicesChanged);
    setTimeout(() => {
      window.speechSynthesis.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(window.speechSynthesis.getVoices());
    }, 1000);
  });
}

function pickIndianFemaleVoice(voices: SpeechSynthesisVoice[], lang: string): SpeechSynthesisVoice | null {
  const byLang = voices.filter((v) => v.lang?.toLowerCase() === lang.toLowerCase());
  const pool = byLang.length > 0 ? byLang : voices.filter((v) => v.lang?.toLowerCase().startsWith("en"));

  const femaleNames = ["female", "heera", "veena", "raveena", "priya", "swara", "kajal", "neerja", "zira"];
  const female = pool.find((v) => femaleNames.some((n) => v.name.toLowerCase().includes(n)));
  if (female) return female;

  const indianEnglish = voices.find((v) => v.lang?.toLowerCase() === "en-in");
  if (indianEnglish) return indianEnglish;

  return pool[0] ?? voices[0] ?? null;
}

export function useSpeechSynthesis() {
  const [supported] = useState(() => typeof window !== "undefined" && "speechSynthesis" in window);
  const [speaking, setSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
  }, [supported]);

  async function speak(text: string, lang: string, onEnd?: () => void) {
    if (!supported) {
      onEnd?.();
      return;
    }
    window.speechSynthesis.cancel();

    const voices = await loadVoices();
    const voice = pickIndianFemaleVoice(voices, lang);

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = voice?.lang ?? lang;
    if (voice) utterance.voice = voice;
    utterance.rate = 0.96;
    utterance.pitch = 1.15;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => { setSpeaking(false); onEnd?.(); };
    utterance.onerror = () => { setSpeaking(false); onEnd?.(); };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }

  function cancel() {
    if (supported) window.speechSynthesis.cancel();
    setSpeaking(false);
  }

  return { supported, speaking, speak, cancel };
}
