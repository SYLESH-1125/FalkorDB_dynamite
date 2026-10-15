export type NotificationSeverity = "info" | "success" | "warning" | "critical";

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  severity: NotificationSeverity;
  createdAt: string;
  read: boolean;
  source: string;
  link?: string;
}
