export type ChatRole = "user" | "assistant";

export interface Citation {
  id: string;
  documentName: string;
  page: number;
  snippet: string;
  relevance: number;
}

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  citations: Citation[];
  pending?: boolean;
}

export interface ChatThread {
  id: string;
  title: string;
  updatedAt: string;
  messages: ChatMessage[];
}

export const SUGGESTED_QUERIES: string[] = [
  "Summarise coal production trends across subsidiaries for FY 2025-26",
  "Which mines reported the highest overburden removal last quarter?",
  "List pending environmental clearance issues by state",
  "Compare washery throughput between SECL and MCL",
];

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
