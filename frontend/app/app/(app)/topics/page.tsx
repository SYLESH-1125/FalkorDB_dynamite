import type { Metadata } from "next";
import { Suspense } from "react";
import { TopicsView } from "@/src/presentation/views/topics-view";
import { RouteFallback } from "@/src/presentation/components/shared/route-fallback";

export const metadata: Metadata = { title: "Word Cloud & Topics" };

export default function TopicsPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <TopicsView />
    </Suspense>
  );
}
