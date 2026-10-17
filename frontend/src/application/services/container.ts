import * as api from "@/src/infrastructure/repositories/api-repositories";

// single composition root — swap these bindings to move off the live API
export const repositories = {
  auth: api.authRepository,
  documents: api.documentRepository,
  validation: api.validationRepository,
  query: api.queryRepository,
  reports: api.reportRepository,
  topics: api.topicRepository,
  parliamentary: api.parliamentaryRepository,
  analytics: api.analyticsRepository,
  users: api.userRepository,
  audit: api.auditRepository,
  integrations: api.integrationRepository,
  notifications: api.notificationRepository,
  help: api.helpRepository,
  graph: api.graphRepository,
  voice: api.voiceRepository,
};
