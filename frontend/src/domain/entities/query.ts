export type ChatRole = "user" | "assistant";

export interface Citation {
  id: string;
  documentName: string;
  page: number;
  snippet: string;
  relevance: number;
  // provenance trace — report → page → table → cell
  table?: string;
  cell?: string;
}

// evidence framing shown above an answer: proof over promises
export interface EvidenceSummary {
  facts: number;
  factsExpected: number;
  sources: number;
  conflicts: number;
  validated: boolean;
  asOf?: string;
  gap?: string;
  gapOwner?: string;
  contradiction?: string;
  revisionImpact?: string[];
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  citations: Citation[];
  evidence?: EvidenceSummary;
  pending?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export interface VoiceLanguage {
  code: string;
  label: string;
}

// the 22 languages of the Eighth Schedule plus English
export const VOICE_LANGUAGES: VoiceLanguage[] = [
  { code: "en-IN", label: "English" },
  { code: "hi-IN", label: "Hindi" },
  { code: "bn-IN", label: "Bengali" },
  { code: "te-IN", label: "Telugu" },
  { code: "mr-IN", label: "Marathi" },
  { code: "ta-IN", label: "Tamil" },
  { code: "ur-IN", label: "Urdu" },
  { code: "gu-IN", label: "Gujarati" },
  { code: "kn-IN", label: "Kannada" },
  { code: "or-IN", label: "Odia" },
  { code: "ml-IN", label: "Malayalam" },
  { code: "pa-IN", label: "Punjabi" },
  { code: "as-IN", label: "Assamese" },
  { code: "mai-IN", label: "Maithili" },
  { code: "sat-IN", label: "Santali" },
  { code: "ks-IN", label: "Kashmiri" },
  { code: "ne-IN", label: "Nepali" },
  { code: "sd-IN", label: "Sindhi" },
  { code: "kok-IN", label: "Konkani" },
  { code: "doi-IN", label: "Dogri" },
  { code: "mni-IN", label: "Manipuri" },
  { code: "brx-IN", label: "Bodo" },
  { code: "sa-IN", label: "Sanskrit" },
];
