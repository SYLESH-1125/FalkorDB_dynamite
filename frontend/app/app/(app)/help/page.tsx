import type { Metadata } from "next";
import { HelpView } from "@/src/presentation/views/help-view";

export const metadata: Metadata = { title: "Help & Training" };

export default function HelpPage() {
  return <HelpView />;
}
