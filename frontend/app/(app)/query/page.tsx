import type { Metadata } from "next";
import { QueryView } from "@/src/presentation/views/query-view";

export const metadata: Metadata = { title: "AI Query System" };

export default function QueryPage() {
  return <QueryView />;
}
