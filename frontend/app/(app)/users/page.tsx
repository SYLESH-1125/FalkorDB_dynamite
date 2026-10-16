import type { Metadata } from "next";
import { UsersView } from "@/src/presentation/views/users-view";

export const metadata: Metadata = { title: "User Management" };

export default function UsersPage() {
  return <UsersView />;
}
