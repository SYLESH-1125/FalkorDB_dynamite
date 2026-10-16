import type { AppRole } from "@/src/domain/entities/user";

export interface RoleOption {
  id: AppRole;
  label: string;
  tagline: string;
  actions: string[];
  footnote: string;
  showcase: {
    eyebrow: string;
    headline: string;
    body: string;
    stats: [value: string, label: string][];
  };
}

export const USER_ROLES: RoleOption[] = [
  {
    id: "parliamentary",
    label: "Parliamentary Response Team",
    tagline: "Ask Question · Request Briefing",
    actions: ["Rapid, defensible answers"],
    footnote: "Rapid prepare defensible answers",
    showcase: {
      eyebrow: "Parliamentary Response Team",
      headline: "Defensible answers, drafted in minutes",
      body: "Table a question or request a briefing and get a drafted reply with every figure traced back to its source document and page — ready before the House deadline.",
      stats: [
        ["14-day", "average tabling deadline covered"],
        ["100%", "of claims traced to a source page"],
      ],
    },
  },
  {
    id: "ministry",
    label: "Ministry Policy & Monitoring Officers",
    tagline: "Explore Trends · Request Executive Report",
    actions: ["National level policy support"],
    footnote: "National level policy support",
    showcase: {
      eyebrow: "Ministry Policy & Monitoring",
      headline: "National trends, ready for executive review",
      body: "Explore performance across all nine subsidiaries and request an executive report in the exact format policy review expects — charts, annexures and commentary included.",
      stats: [
        ["9", "subsidiaries covered nationwide"],
        ["18,942", "documents indexed and query-ready"],
      ],
    },
  },
  {
    id: "domain-officer",
    label: "CMPDI / CIL Domain Officers",
    tagline: "Review Evidence · Validate Knowledge",
    actions: ["Data validation"],
    footnote: "Data validation",
    showcase: {
      eyebrow: "CMPDI / CIL Domain Officers",
      headline: "Review the evidence, validate the record",
      body: "Human-in-loop review of every extracted field, with the source scan alongside the parsed value — so what gets published matches what was actually filed.",
      stats: [
        ["94.7%", "extraction accuracy on validated fields"],
        ["1,986", "cases currently awaiting review"],
      ],
    },
  },
];

export const ADMIN_ROLE: RoleOption = {
  id: "admin",
  label: "Administrator",
  tagline: "Manage Users · Configure Platform",
  actions: ["Full system access"],
  footnote: "Credentials for all users are provisioned by Admin",
  showcase: {
    eyebrow: "Platform Administration",
    headline: "Provision access, configure the platform",
    body: "Create and manage every account, assign roles, configure subsidiary integrations, and review the full audit trail. No self-registration — every credential originates here.",
    stats: [
      ["4", "role types under platform control"],
      ["100%", "of access logged and auditable"],
    ],
  },
};
