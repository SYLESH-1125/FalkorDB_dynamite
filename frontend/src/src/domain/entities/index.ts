import type { Session, Credentials, SignUpInput, User } from "../entities/user";
import type { IngestedDocument, ProcessingJob } from "../entities/document";
import type { ValidationRecord, ExtractedField } from "../entities/validation";
import type { ChatThread, ChatMessage } from "../entities/query";
import type { Report, ReportTemplate, ReportVersion, ReportWizardConfig } from "../entities/report";
import type { TopicTerm, TopicCluster } from "../entities/topic";
import type { ParliamentaryQuery } from "../entities/parliamentary";
import type {
  KpiMetric, TimeSeriesPoint, CategoryDatum, SubsidiaryPerformance, ActivityEvent,
} from "../entities/analytics";
import type { AuditEntry } from "../entities/audit";
import type { Integration } from "../entities/integration";
import type { AppNotification } from "../entities/notification";
import type { HelpResource, FaqItem } from "../entities/help";

export interface AuthRepository {
  signIn(credentials: Credentials): Promise<Session>;
  signUp(input: SignUpInput): Promise<Session>;
  signOut(): Promise<void>;
  currentSession(): Promise<Session | null>;
}

export interface DocumentRepository {
  list(): Promise<IngestedDocument[]>;
  upload(files: { name: string; sizeBytes: number }[]): Promise<IngestedDocument[]>;
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
  versions(reportId: string): Promise<ReportVersion[]>;
  generate(config: ReportWizardConfig): Promise<Report>;
}

export interface TopicRepository {
  terms(): Promise<TopicTerm[]>;
  clusters(): Promise<TopicCluster[]>;
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
