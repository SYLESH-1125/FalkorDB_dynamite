export type GraphFlowStory = {
  track: string;
  ask: string;
  walk: string;
  prove: string;
};

const DEFAULT: GraphFlowStory = {
  track: "Graph Hacks · FalkorDB",
  ask: "Your question becomes a node in the company graph.",
  walk: "FalkorDB walks OWNS → KNOWS → DECIDED_BY edges in milliseconds.",
  prove: "Every screen shows the path — not a black-box paragraph.",
};

const BY_PREFIX: { prefix: string; story: GraphFlowStory }[] = [
  {
    prefix: "/brain",
    story: {
      track: "Company Brain",
      ask: "Who owns this project? Which decision supports the reply?",
      walk: "Agent picks intent → runs Cypher → returns nodes on the path.",
      prove: "Answers cite Person, Project, Decision — the same graph you explore.",
    },
  },
  {
    prefix: "/graph",
    story: {
      track: "Knowledge Graph",
      ask: "How do mines, people, and documents connect?",
      walk: "Force layout renders live FalkorDB nodes and relationships.",
      prove: "Click any node — neighbours and edge types are the ground truth.",
    },
  },
  {
    prefix: "/query",
    story: {
      track: "AI Query",
      ask: "Plain-language question over the indexed corpus.",
      walk: "Retrieval finds evidence chunks; graph links them to owners and projects.",
      prove: "Citations map to document pages — traceable to the scan.",
    },
  },
  {
    prefix: "/reports",
    story: {
      track: "Reports",
      ask: "Template asks for subsidiary KPIs and annexures.",
      walk: "Figures pull from validated fields wired into the graph.",
      prove: "Published numbers stay tied to source documents in FalkorDB.",
    },
  },
  {
    prefix: "/parliamentary",
    story: {
      track: "Parliamentary",
      ask: "A tabled question needs a brief before the deadline.",
      walk: "Threads link to decisions, projects, and evidence nodes.",
      prove: "Draft replies show which graph path supported each claim.",
    },
  },
  {
    prefix: "/topics",
    story: {
      track: "Topics",
      ask: "What themes dominate the corpus right now?",
      walk: "Terms cluster; clusters map to Topic nodes and linked documents.",
      prove: "Emerging issues surface before they become audit findings.",
    },
  },
  {
    prefix: "/analytics",
    story: {
      track: "Analytics",
      ask: "How are subsidiaries performing against targets?",
      walk: "Dashboard KPIs align with Project and Subsidiary nodes in the graph.",
      prove: "Drill-down stays consistent with Company Brain ownership.",
    },
  },
  {
    prefix: "/validation",
    story: {
      track: "Validation",
      ask: "Is this extracted field trustworthy?",
      walk: "Human review updates Document nodes — graph stays current.",
      prove: "Only validated facts feed queries and reports.",
    },
  },
  {
    prefix: "/dashboard",
    story: {
      track: "Dashboard",
      ask: "What needs attention across the ministry today?",
      walk: "Activity events mirror uploads, validations, and graph updates.",
      prove: "One pulse on operations — all modules share the same graph.",
    },
  },
  {
    prefix: "/users",
    story: {
      track: "Administration",
      ask: "Who can access which subsidiary data?",
      walk: "Users map to Person roles; RBAC gates graph traversals.",
      prove: "Provisioned accounts — no self-registration.",
    },
  },
];

export function graphFlowForPath(pathname: string): GraphFlowStory {
  const hit = BY_PREFIX.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));
  return hit?.story ?? DEFAULT;
}
