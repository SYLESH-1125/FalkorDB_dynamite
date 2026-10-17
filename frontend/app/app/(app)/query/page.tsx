import type { Metadata } from "next";
import { Suspense } from "react";
import { QueryView } from "@/src/presentation/views/query-view";
import { RouteFallback } from "@/src/presentation/components/shared/route-fallback";

export const metadata: Metadata = { title: "AI Query System" };

export default function QueryPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <QueryView />
    </Suspense>
  );
}
