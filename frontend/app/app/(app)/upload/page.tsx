import type { Metadata } from "next";
import { UploadView } from "@/src/presentation/views/upload-view";

export const metadata: Metadata = { title: "Document Upload" };

export default function UploadPage() {
  return <UploadView />;
}
