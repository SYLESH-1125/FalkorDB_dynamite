import type { Metadata } from "next";
import { Suspense } from "react";
import { ReportsView } from "@/src/presentation/views/reports-view";
import { RouteFallback } from "@/src/presentation/components/shared/route-fallback";

export const metadata: Metadata = { title: "Report Generation" };

export default function ReportsPage() {
  return (
    <Suspense fallback={<RouteFallback />}>
      <ReportsView />
    </Suspense>
  );
}
