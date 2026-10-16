import type {
  AuthRepository, DocumentRepository, ValidationRepository, QueryRepository,
  ReportRepository, TopicRepository, ParliamentaryRepository, AnalyticsRepository,
  UserRepository, AuditRepository, IntegrationRepository, NotificationRepository,
  HelpRepository,
} from "@/src/domain/repositories";
import { apiClient } from "../http/api-client";
import type { Session } from "@/src/domain/entities/user";
import type { ChatMessage, ChatThread } from "@/src/domain/entities/query";
import type { DashboardSnapshot } from "@/src/domain/entities/analytics";
import type { ValidationRecord } from "@/src/domain/entities/validation";

const SESSION_KEY = "bhumi.session";

function writeSession(session: Session): Session {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }
  return session;
}

function clearSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SESSION_KEY);
  }
}

export const authRepository: AuthRepository = {
  signIn: (credentials) =>
    apiClient.post<Session>("/api/auth/sign-in", credentials).then(writeSession),
  signOut: () => apiClient.post<void>("/api/auth/sign-out").finally(clearSession),
  currentSession: () =>
    apiClient.get<Session>("/api/auth/session").catch(() => null),
};

export const documentRepository: DocumentRepository = {
  list: () => apiClient.get("/api/documents"),
  upload: (files) => apiClient.upload("/api/documents", files),
  retry: (id) => apiClient.post(`/api/documents/${id}/retry`),
  remove: (id) => apiClient.delete(`/api/documents/${id}`),
  jobs: () => apiClient.get("/api/documents/jobs"),
};

export const validationRepository: ValidationRepository = {
  list: () => apiClient.get("/api/validations"),
  byId: (id) => apiClient.get<ValidationRecord>(`/api/validations/${id}`).catch(() => null),
  saveField: (recordId, field) =>
    apiClient.put(`/api/validations/${recordId}/fields/${field.id}`, field),
  approve: (recordId) => apiClient.post(`/api/validations/${recordId}/approve`),
};

export const queryRepository: QueryRepository = {
  threads: () => apiClient.get<ChatThread[]>("/api/query/threads"),
  createThread: () => apiClient.post<ChatThread>("/api/query/threads"),
  ask: (threadId, question) =>
    apiClient.post<ChatMessage>(`/api/query/threads/${threadId}/ask`, { question }),
};

export const reportRepository: ReportRepository = {
  list: () => apiClient.get("/api/reports"),
  templates: () => apiClient.get("/api/reports/templates"),
  saveTemplate: (template) => apiClient.put(`/api/reports/templates/${template.id}`, template),
  versions: (reportId) => apiClient.get(`/api/reports/${reportId}/versions`),
  generate: (config) => apiClient.post("/api/reports/generate", config),
};

export const topicRepository: TopicRepository = {
  terms: () => apiClient.get("/api/topics/terms"),
  clusters: () => apiClient.get("/api/topics/clusters"),
};

export const parliamentaryRepository: ParliamentaryRepository = {
  list: () => apiClient.get("/api/parliamentary"),
  advanceStage: (id) => apiClient.post(`/api/parliamentary/${id}/advance`),
};

export const analyticsRepository: AnalyticsRepository = {
  kpis: () => apiClient.get("/api/analytics/kpis"),
  timeSeries: () => apiClient.get("/api/analytics/time-series"),
  categoryBreakdown: () => apiClient.get("/api/analytics/categories"),
  subsidiaryPerformance: () => apiClient.get("/api/analytics/performance"),
  activity: () => apiClient.get("/api/analytics/activity"),
  dashboard: () => apiClient.get<DashboardSnapshot>("/api/analytics/dashboard"),
};

export const userRepository: UserRepository = {
  list: () => apiClient.get("/api/users"),
  updateRole: (id, role) => apiClient.put(`/api/users/${id}/role`, { role }),
  setStatus: (id, status) => apiClient.put(`/api/users/${id}/status`, { status }),
};

export const auditRepository: AuditRepository = {
  list: () => apiClient.get("/api/audit"),
};

export const integrationRepository: IntegrationRepository = {
  list: () => apiClient.get("/api/integrations"),
  sync: (id) => apiClient.post(`/api/integrations/${id}/sync`),
};

export const notificationRepository: NotificationRepository = {
  list: () => apiClient.get("/api/notifications"),
  markRead: (id) => apiClient.put(`/api/notifications/${id}/read`, {}),
  markAllRead: () => apiClient.put("/api/notifications/read-all", {}),
};

export const helpRepository: HelpRepository = {
  resources: () => apiClient.get("/api/help/resources"),
  faqs: () => apiClient.get("/api/help/faqs"),
};
