import type { Metadata } from "next";
import { ReportEditorView } from "@/src/presentation/views/report-editor-view";

export const metadata: Metadata = { title: "Edit Report" };

export default async function ReportEditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ReportEditorView reportId={id} />;
}
