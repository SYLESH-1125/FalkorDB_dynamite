export type AuditOutcome = "success" | "failure" | "warning";

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  action: string;
  resource: string;
  resourceId: string;
  ipAddress: string;
  outcome: AuditOutcome;
  details: string;
}
