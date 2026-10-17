import type { Metadata } from "next";
import { ConversationsView } from "@/src/presentation/views/conversations-view";

export const metadata: Metadata = { title: "Conversations" };

export default function TopicConversationsPage() {
  return (
    <ConversationsView
      source="topics"
      title="Conversations"
      description="Every question asked of Topic and Word Intelligence, across every thread."
      parentLabel="Word Cloud & Topics"
      parentHref="/topics"
    />
  );
}
