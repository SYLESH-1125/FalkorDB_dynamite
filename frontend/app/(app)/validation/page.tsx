import type { Metadata } from "next";
import { ValidationView } from "@/src/presentation/views/validation-view";

export const metadata: Metadata = { title: "Data Validation" };

export default function ValidationPage() {
  return <ValidationView />;
}
