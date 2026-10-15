export type IntegrationStatus = "connected" | "degraded" | "disconnected";

export interface Integration {
  id: string;
  name: string;
  subsidiary: string;
  description: string;
  status: IntegrationStatus;
  endpoint: string;
  lastSyncAt: string;
  recordsSynced: number;
  syncIntervalMinutes: number;
}
