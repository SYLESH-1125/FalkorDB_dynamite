import type {
  AuthRepository, DocumentRepository, ValidationRepository, QueryRepository,
  ReportRepository, TopicRepository, ParliamentaryRepository, AnalyticsRepository,
  UserRepository, AuditRepository, IntegrationRepository, NotificationRepository,
  HelpRepository, GraphRepository, BrainRepository, VoiceRepository,
} from "@/src/domain/repositories";
import * as api from "./api-repositories";
import * as mock from "./mock-repositories";
import {
  isEmptyArray,
  isEmptyBrainBrief,
  isEmptyDashboard,
  isEmptyGraph,
  isEmptyReportDocument,
  isWeakBrainAnswer,
  isWeakChatMessage,
  preferLive,
  withArrayFallback,
  withNullableFallback,
  withValueFallback,
} from "./empty-fallback";

export const authRepository: AuthRepository = api.authRepository;

export const documentRepository: DocumentRepository = {
  list: () => withArrayFallback(() => api.documentRepository.list(), () => mock.documentRepository.list()),
  upload: (files) => preferLive(() => api.documentRepository.upload(files), () => mock.documentRepository.upload(files)),
  retry: (id) => preferLive(() => api.documentRepository.retry(id), () => mock.documentRepository.retry(id)),
  remove: (id) => preferLive(() => api.documentRepository.remove(id), () => mock.documentRepository.remove(id)),
  jobs: () => withArrayFallback(() => api.documentRepository.jobs(), () => mock.documentRepository.jobs()),
};

export const validationRepository: ValidationRepository = {
  list: () => withArrayFallback(() => api.validationRepository.list(), () => mock.validationRepository.list()),
  byId: (id) => withNullableFallback(() => api.validationRepository.byId(id), () => mock.validationRepository.byId(id)),
  saveField: (recordId, field) =>
    preferLive(() => api.validationRepository.saveField(recordId, field), () => mock.validationRepository.saveField(recordId, field)),
  approve: (recordId) =>
    preferLive(() => api.validationRepository.approve(recordId), () => mock.validationRepository.approve(recordId)),
};

async function askWithDemoReply(
  live: (threadId: string, question: string) => Promise<import("@/src/domain/entities/query").ChatMessage>,
  mockAsk: (threadId: string, question: string) => Promise<import("@/src/domain/entities/query").ChatMessage>,
  threadId: string,
  question: string,
) {
  try {
    const message = await live(threadId, question);
    if (isWeakChatMessage(message)) return mockAsk(threadId, question);
    return message;
  } catch {
    return mockAsk(threadId, question);
  }
}

export const queryRepository: QueryRepository = {
  threads: () => withArrayFallback(() => api.queryRepository.threads(), () => mock.queryRepository.threads()),
  createThread: () => preferLive(() => api.queryRepository.createThread(), () => mock.queryRepository.createThread()),
  ask: (threadId, question) => askWithDemoReply(api.queryRepository.ask, mock.queryRepository.ask, threadId, question),
};

export const topicRepository: TopicRepository = {
  terms: () => withArrayFallback(() => api.topicRepository.terms(), () => mock.topicRepository.terms()),
  clusters: () => withArrayFallback(() => api.topicRepository.clusters(), () => mock.topicRepository.clusters()),
  threads: () => withArrayFallback(() => api.topicRepository.threads(), () => mock.topicRepository.threads()),
  createThread: () => preferLive(() => api.topicRepository.createThread(), () => mock.topicRepository.createThread()),
  ask: (threadId, question) => askWithDemoReply(api.topicRepository.ask, mock.topicRepository.ask, threadId, question),
};

export const reportRepository: ReportRepository = {
  list: () => withArrayFallback(() => api.reportRepository.list(), () => mock.reportRepository.list()),
  templates: () => withArrayFallback(() => api.reportRepository.templates(), () => mock.reportRepository.templates()),
  saveTemplate: (template) =>
    preferLive(() => api.reportRepository.saveTemplate(template), () => mock.reportRepository.saveTemplate(template)),
  templateFileBlob: (templateId) =>
    preferLive(() => api.reportRepository.templateFileBlob(templateId), () => mock.reportRepository.templateFileBlob(templateId)),
  versions: (reportId) =>
    withArrayFallback(() => api.reportRepository.versions(reportId), () => mock.reportRepository.versions(reportId)),
  generate: (config) => preferLive(() => api.reportRepository.generate(config), () => mock.reportRepository.generate(config)),
  draft: (request) => preferLive(() => api.reportRepository.draft(request), () => mock.reportRepository.draft(request)),
  getDocument: (reportId) =>
    withValueFallback(
      () => api.reportRepository.getDocument(reportId),
      () => mock.reportRepository.getDocument(reportId),
      isEmptyReportDocument,
    ),
  saveDocument: (reportId, content) =>
    preferLive(() => api.reportRepository.saveDocument(reportId, content), () => mock.reportRepository.saveDocument(reportId, content)),
  exportBlob: (reportId, format) =>
    preferLive(() => api.reportRepository.exportBlob(reportId, format), () => mock.reportRepository.exportBlob(reportId, format)),
  createShareLink: (reportId, expiresInDays) =>
    preferLive(
      () => api.reportRepository.createShareLink(reportId, expiresInDays),
      () => mock.reportRepository.createShareLink(reportId, expiresInDays),
    ),
  revokeShareLink: (reportId) =>
    preferLive(() => api.reportRepository.revokeShareLink(reportId), () => mock.reportRepository.revokeShareLink(reportId)),
  getSharedReport: (token) =>
    preferLive(() => api.reportRepository.getSharedReport(token), () => mock.reportRepository.getSharedReport(token)),
};

export const parliamentaryRepository: ParliamentaryRepository = {
  list: () => withArrayFallback(() => api.parliamentaryRepository.list(), () => mock.parliamentaryRepository.list()),
  advanceStage: (id) =>
    preferLive(() => api.parliamentaryRepository.advanceStage(id), () => mock.parliamentaryRepository.advanceStage(id)),
};

export const analyticsRepository: AnalyticsRepository = {
  kpis: () => withArrayFallback(() => api.analyticsRepository.kpis(), () => mock.analyticsRepository.kpis()),
  timeSeries: () => withArrayFallback(() => api.analyticsRepository.timeSeries(), () => mock.analyticsRepository.timeSeries()),
  categoryBreakdown: () =>
    withArrayFallback(() => api.analyticsRepository.categoryBreakdown(), () => mock.analyticsRepository.categoryBreakdown()),
  subsidiaryPerformance: () =>
    withArrayFallback(() => api.analyticsRepository.subsidiaryPerformance(), () => mock.analyticsRepository.subsidiaryPerformance()),
  activity: () => withArrayFallback(() => api.analyticsRepository.activity(), () => mock.analyticsRepository.activity()),
  dashboard: () =>
    withValueFallback(
      () => api.analyticsRepository.dashboard(),
      () => mock.analyticsRepository.dashboard(),
      isEmptyDashboard,
    ),
};

export const userRepository: UserRepository = {
  list: () => withArrayFallback(() => api.userRepository.list(), () => mock.userRepository.list()),
  updateRole: (id, role) => preferLive(() => api.userRepository.updateRole(id, role), () => mock.userRepository.updateRole(id, role)),
  setStatus: (id, status) => preferLive(() => api.userRepository.setStatus(id, status), () => mock.userRepository.setStatus(id, status)),
};

export const auditRepository: AuditRepository = {
  list: () => withArrayFallback(() => api.auditRepository.list(), () => mock.auditRepository.list()),
};

export const integrationRepository: IntegrationRepository = {
  list: () => withArrayFallback(() => api.integrationRepository.list(), () => mock.integrationRepository.list()),
  sync: (id) => preferLive(() => api.integrationRepository.sync(id), () => mock.integrationRepository.sync(id)),
};

export const notificationRepository: NotificationRepository = {
  list: () => withArrayFallback(() => api.notificationRepository.list(), () => mock.notificationRepository.list()),
  markRead: (id) => preferLive(() => api.notificationRepository.markRead(id), () => mock.notificationRepository.markRead(id)),
  markAllRead: () => preferLive(() => api.notificationRepository.markAllRead(), () => mock.notificationRepository.markAllRead()),
};

export const helpRepository: HelpRepository = {
  resources: () => withArrayFallback(() => api.helpRepository.resources(), () => mock.helpRepository.resources()),
  faqs: () => withArrayFallback(() => api.helpRepository.faqs(), () => mock.helpRepository.faqs()),
};

export const graphRepository: GraphRepository = {
  knowledgeGraph: () =>
    withValueFallback(
      () => api.graphRepository.knowledgeGraph(),
      () => mock.graphRepository.knowledgeGraph(),
      isEmptyGraph,
    ),
};

export const brainRepository: BrainRepository = {
  brief: () =>
    withValueFallback(() => api.brainRepository.brief(), () => mock.brainRepository.brief(), isEmptyBrainBrief),
  ask: async (question) => {
    try {
      const answer = await api.brainRepository.ask(question);
      if (isWeakBrainAnswer(answer)) return mock.brainRepository.ask(question);
      return answer;
    } catch {
      return mock.brainRepository.ask(question);
    }
  },
  record: (fact) => preferLive(() => api.brainRepository.record(fact), () => mock.brainRepository.record(fact)),
};

export const voiceRepository: VoiceRepository = {
  transcribe: (audio, languageCode) =>
    preferLive(() => api.voiceRepository.transcribe(audio, languageCode), () => mock.voiceRepository.transcribe(audio, languageCode)),
  speak: (text, languageCode) =>
    preferLive(() => api.voiceRepository.speak(text, languageCode), () => mock.voiceRepository.speak(text, languageCode)),
};
