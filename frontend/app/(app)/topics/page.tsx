import type { Metadata } from "next";
import { TopicsView } from "@/src/presentation/views/topics-view";

export const metadata: Metadata = { title: "Word Cloud & Topics" };

export default function TopicsPage() {
  return <TopicsView />;
}
