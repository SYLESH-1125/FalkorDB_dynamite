import type { Metadata } from "next";
import { ProblemView } from "@/src/presentation/views/problem-view";

export const metadata: Metadata = { title: "The Problem" };

export default function ProblemPage() {
  return <ProblemView />;
}
