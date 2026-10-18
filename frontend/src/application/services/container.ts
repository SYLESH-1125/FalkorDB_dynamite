import * as api from "@/src/infrastructure/repositories/api-repositories";
import * as hybrid from "@/src/infrastructure/repositories/hybrid-repositories";
import * as mock from "@/src/infrastructure/repositories/mock-repositories";

// Default: in-browser mocks (no server). Live API: hybrid fills empty/error responses with demo fixtures.
const USE_LIVE_API = process.env.NEXT_PUBLIC_DEMO_MODE === "false" && !!process.env.NEXT_PUBLIC_API_URL;
const MOCK_WHEN_EMPTY = process.env.NEXT_PUBLIC_MOCK_EMPTY_FALLBACK !== "false";
const impl = USE_LIVE_API ? (MOCK_WHEN_EMPTY ? hybrid : api) : mock;

// single composition root — swap these bindings to move off the live API
export const repositories = {
  auth: impl.authRepository,
  documents: impl.documentRepository,
  validation: impl.validationRepository,
  query: impl.queryRepository,
  reports: impl.reportRepository,
  topics: impl.topicRepository,
  parliamentary: impl.parliamentaryRepository,
  analytics: impl.analyticsRepository,
  users: impl.userRepository,
  audit: impl.auditRepository,
  integrations: impl.integrationRepository,
  notifications: impl.notificationRepository,
  help: impl.helpRepository,
  graph: impl.graphRepository,
  brain: impl.brainRepository,
  voice: impl.voiceRepository,
};
