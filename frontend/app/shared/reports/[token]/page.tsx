import type { Metadata } from "next";
import { SharedReportView } from "@/src/presentation/views/shared-report-view";

export const metadata: Metadata = { title: "Shared Report" };

export default async function SharedReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <SharedReportView token={token} />;
}
