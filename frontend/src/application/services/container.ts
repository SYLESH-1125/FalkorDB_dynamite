import * as api from "@/src/infrastructure/repositories/api-repositories";
import * as mock from "@/src/infrastructure/repositories/mock-repositories";

// Demo mode runs the app against an in-browser backend so it is fully usable with no server.
// On by default when no API URL is configured (e.g. a standalone Vercel deploy); force it with
// NEXT_PUBLIC_DEMO_MODE=true, or opt back into the live API by setting NEXT_PUBLIC_API_URL.
const DEMO = process.env.NEXT_PUBLIC_DEMO_MODE === "true" || !process.env.NEXT_PUBLIC_API_URL;
const impl = DEMO ? mock : api;

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
