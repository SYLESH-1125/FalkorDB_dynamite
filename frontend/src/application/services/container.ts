import * as mock from "@/src/infrastructure/repositories/mock-repositories";

// single composition root — swap these bindings to move off mocks
export const repositories = {
  auth: mock.authRepository,
  documents: mock.documentRepository,
  validation: mock.validationRepository,
  query: mock.queryRepository,
  reports: mock.reportRepository,
  topics: mock.topicRepository,
  parliamentary: mock.parliamentaryRepository,
  analytics: mock.analyticsRepository,
  users: mock.userRepository,
  audit: mock.auditRepository,
  integrations: mock.integrationRepository,
  notifications: mock.notificationRepository,
  help: mock.helpRepository,
};
