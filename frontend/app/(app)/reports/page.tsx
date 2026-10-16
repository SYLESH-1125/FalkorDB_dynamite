import type { Metadata } from "next";
import { ReportsView } from "@/src/presentation/views/reports-view";

export const metadata: Metadata = { title: "Report Generation" };

export default function ReportsPage() {
  return <ReportsView />;
}
