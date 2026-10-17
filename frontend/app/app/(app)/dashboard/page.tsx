import type { Metadata } from "next";
import { DashboardView } from "@/src/presentation/views/dashboard-view";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return <DashboardView />;
}
