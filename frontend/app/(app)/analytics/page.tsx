import type { Metadata } from "next";
import { AnalyticsView } from "@/src/presentation/views/analytics-view";

export const metadata: Metadata = { title: "Analytics & Insights" };

export default function AnalyticsPage() {
  return <AnalyticsView />;
}
