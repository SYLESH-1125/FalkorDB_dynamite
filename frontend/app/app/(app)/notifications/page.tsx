import type { Metadata } from "next";
import { NotificationsView } from "@/src/presentation/views/notifications-view";

export const metadata: Metadata = { title: "Notifications & Alerts" };

export default function NotificationsPage() {
  return <NotificationsView />;
}
