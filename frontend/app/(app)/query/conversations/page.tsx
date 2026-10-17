import type { Metadata } from "next";
import { ConversationsView } from "@/src/presentation/views/conversations-view";

export const metadata: Metadata = { title: "Conversations" };

export default function ConversationsPage() {
  return <ConversationsView />;
}
