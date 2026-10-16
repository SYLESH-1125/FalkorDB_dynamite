import type { Metadata } from "next";
import { GraphExplorerView } from "@/src/presentation/views/graph-explorer-view";

export const metadata: Metadata = { title: "Knowledge Graph" };

export default function GraphPage() {
  return <GraphExplorerView />;
}
