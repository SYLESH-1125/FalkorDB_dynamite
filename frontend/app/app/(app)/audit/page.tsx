import type { Metadata } from "next";
import { AuditView } from "@/src/presentation/views/audit-view";

export const metadata: Metadata = { title: "Audit Log" };

export default function AuditPage() {
  return <AuditView />;
}
