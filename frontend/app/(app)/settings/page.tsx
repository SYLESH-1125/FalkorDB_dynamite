import type { Metadata } from "next";
import { SettingsView } from "@/src/presentation/views/settings-view";

export const metadata: Metadata = { title: "Integrations & Settings" };

export default function SettingsPage() {
  return <SettingsView />;
}
