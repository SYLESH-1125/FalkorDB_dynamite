import type { Metadata } from "next";
import { ProcessingView } from "@/src/presentation/views/processing-view";

export const metadata: Metadata = { title: "Processing Status" };

export default function ProcessingPage() {
  return <ProcessingView />;
}
