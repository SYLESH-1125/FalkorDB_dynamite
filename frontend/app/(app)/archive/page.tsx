import type { Metadata } from "next";
import { ArchiveView } from "@/src/presentation/views/archive-view";

export const metadata: Metadata = { title: "Report Archive" };

export default function ArchivePage() {
  return <ArchiveView />;
}
