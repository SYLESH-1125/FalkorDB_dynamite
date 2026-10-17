import type { Metadata } from "next";
import { CompanyBrainView } from "@/src/presentation/views/company-brain-view";

export const metadata: Metadata = { title: "Company Brain" };

export default function BrainPage() {
  return <CompanyBrainView />;
}
