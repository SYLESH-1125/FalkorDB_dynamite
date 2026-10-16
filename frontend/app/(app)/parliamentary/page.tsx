import type { Metadata } from "next";
import { ParliamentaryView } from "@/src/presentation/views/parliamentary-view";

export const metadata: Metadata = { title: "Parliamentary Tracker" };

export default function ParliamentaryPage() {
  return <ParliamentaryView />;
}
