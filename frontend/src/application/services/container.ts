import * as api from "@/src/infrastructure/repositories/api-repositories";
import * as mock from "@/src/infrastructure/repositories/mock-repositories";

// The in-browser engine is the DEFAULT so the frontend is fully usable with no server —
// a standalone deploy never calls a backend that isn't there. To point at a live backend,
// set BOTH NEXT_PUBLIC_DEMO_MODE=false AND NEXT_PUBLIC_API_URL.
const USE_LIVE_API = process.env.NEXT_PUBLIC_DEMO_MODE === "false" && !!process.env.NEXT_PUBLIC_API_URL;
const impl = USE_LIVE_API ? api : mock;

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
  voice: impl.voiceRepository,
};
