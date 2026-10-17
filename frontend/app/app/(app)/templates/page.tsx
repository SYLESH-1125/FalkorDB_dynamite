import type { Metadata } from "next";
import { TemplatesView } from "@/src/presentation/views/templates-view";

export const metadata: Metadata = { title: "Report Templates" };

export default function TemplatesPage() {
  return <TemplatesView />;
}
