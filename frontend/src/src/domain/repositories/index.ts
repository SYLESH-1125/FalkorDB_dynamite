import type { Session, Credentials, SignUpInput, User } from "../entities/user";
import type { IngestedDocument, ProcessingJob } from "../entities/document";
import type { ValidationRecord, ExtractedField } from "../entities/validation";
import type { ChatThread, ChatMessage } from "../entities/query";
import type {
  Report, ReportTemplate, ReportVersion, ReportWizardConfig, ReportDraftRequest,
  ReportDocument, TiptapContent, ShareLink, SharedReport,
} from "../entities/report";
import type { TopicTerm, TopicCluster } from "../entities/topic";
import type { ParliamentaryQuery } from "../entities/parliamentary";
import type {
  KpiMetric, TimeSeriesPoint, CategoryDatum, SubsidiaryPerformance, ActivityEvent,
  DashboardSnapshot,
} from "../entities/analytics";
import type { AuditEntry } from "../entities/audit";
import type { Integration } from "../entities/integration";
import type { AppNotification } from "../entities/notification";
import type { HelpResource, FaqItem } from "../entities/help";
import type { KnowledgeGraph } from "../entities/graph";
import type { BrainAnswer, BrainBrief, BrainFact } from "../entities/brain";

export interface AuthRepository {
  signIn(credentials: Credentials): Promise<Session>;
  signUp(input: SignUpInput): Promise<Session>;
  signOut(): Promise<void>;
  currentSession(): Promise<Session | null>;
}

export interface DocumentRepository {
  list(): Promise<IngestedDocument[]>;
  upload(files: File[]): Promise<IngestedDocument[]>;
  retry(id: string): Promise<IngestedDocument>;
  remove(id: string): Promise<void>;
  jobs(): Promise<ProcessingJob[]>;
}

export interface ValidationRepository {
  list(): Promise<ValidationRecord[]>;
  byId(id: string): Promise<ValidationRecord | null>;
  saveField(recordId: string, field: ExtractedField): Promise<ValidationRecord>;
  approve(recordId: string): Promise<ValidationRecord>;
}

export interface QueryRepository {
  threads(): Promise<ChatThread[]>;
  ask(threadId: string, question: string): Promise<ChatMessage>;
  createThread(): Promise<ChatThread>;
}

export interface ReportRepository {
  list(): Promise<Report[]>;
  templates(): Promise<ReportTemplate[]>;
  saveTemplate(template: ReportTemplate): Promise<ReportTemplate>;
  templateFileBlob(templateId: string): Promise<Blob>;
  versions(reportId: string): Promise<ReportVersion[]>;
  generate(config: ReportWizardConfig): Promise<Report>;
  draft(request: ReportDraftRequest): Promise<Report>;
  getDocument(reportId: string): Promise<ReportDocument>;
  saveDocument(reportId: string, content: TiptapContent): Promise<ReportDocument>;
  exportBlob(reportId: string, format: "pdf" | "docx"): Promise<Blob>;
  createShareLink(reportId: string, expiresInDays: number): Promise<ShareLink>;
  revokeShareLink(reportId: string): Promise<void>;
  getSharedReport(token: string): Promise<SharedReport>;
}

export interface TopicRepository {
  terms(): Promise<TopicTerm[]>;
  clusters(): Promise<TopicCluster[]>;
  threads(): Promise<ChatThread[]>;
  ask(threadId: string, question: string): Promise<ChatMessage>;
  createThread(): Promise<ChatThread>;
}

export interface ParliamentaryRepository {
  list(): Promise<ParliamentaryQuery[]>;
  advanceStage(id: string): Promise<ParliamentaryQuery>;
}

export interface AnalyticsRepository {
  kpis(): Promise<KpiMetric[]>;
  timeSeries(): Promise<TimeSeriesPoint[]>;
  categoryBreakdown(): Promise<CategoryDatum[]>;
  subsidiaryPerformance(): Promise<SubsidiaryPerformance[]>;
  activity(): Promise<ActivityEvent[]>;
  dashboard(): Promise<DashboardSnapshot>;
}

export interface UserRepository {
  list(): Promise<User[]>;
  updateRole(id: string, role: User["role"]): Promise<User>;
  setStatus(id: string, status: User["status"]): Promise<User>;
}

export interface AuditRepository {
  list(): Promise<AuditEntry[]>;
}

export interface IntegrationRepository {
  list(): Promise<Integration[]>;
  sync(id: string): Promise<Integration>;
}

export interface NotificationRepository {
  list(): Promise<AppNotification[]>;
  markRead(id: string): Promise<AppNotification[]>;
  markAllRead(): Promise<AppNotification[]>;
}

export interface HelpRepository {
  resources(): Promise<HelpResource[]>;
  faqs(): Promise<FaqItem[]>;
}

export interface GraphRepository {
  knowledgeGraph(): Promise<KnowledgeGraph>;
}

export interface BrainRepository {
  brief(): Promise<BrainBrief>;
  ask(question: string): Promise<BrainAnswer>;
  record(fact: BrainFact): Promise<{ id: string; title: string }>;
}

export interface Transcription {
  transcript: string;
  languageCode: string;
}

export interface VoiceRepository {
  transcribe(audio: Blob, languageCode: string): Promise<Transcription>;
  speak(text: string, languageCode: string): Promise<Blob>;
}
