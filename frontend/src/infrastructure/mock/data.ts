import type { User } from "@/src/domain/entities/user";
import type { IngestedDocument, ProcessingJob } from "@/src/domain/entities/document";
import type { ValidationRecord } from "@/src/domain/entities/validation";
import type { ChatThread } from "@/src/domain/entities/query";
import type { Report, ReportTemplate } from "@/src/domain/entities/report";
import type { TopicTerm, TopicCluster } from "@/src/domain/entities/topic";
import type { ParliamentaryQuery } from "@/src/domain/entities/parliamentary";
import type {
  KpiMetric, TimeSeriesPoint, CategoryDatum, SubsidiaryPerformance, ActivityEvent,
  PipelineStageSummary, IngestionHeatCell, AccuracyTrendPoint, StorageBreakdown,
  QueryHighlight, DeadlineItem, SystemHealth,
} from "@/src/domain/entities/analytics";
import type { AuditEntry } from "@/src/domain/entities/audit";
import type { Integration } from "@/src/domain/entities/integration";
import type { AppNotification } from "@/src/domain/entities/notification";
import type { HelpResource, FaqItem } from "@/src/domain/entities/help";
import { isoDaysAgo, seeded, pick } from "./seed";

export const CURRENT_USER: User = {
  id: "usr-001",
  name: "Priyanka Menon",
  email: "p.menon@cmpdi.co.in",
  role: "Administrator",
  subsidiary: "CMPDI",
  designation: "Chief Manager (Systems)",
  status: "active",
  lastActive: isoDaysAgo(0, 10),
  createdAt: isoDaysAgo(420),
};

const NAMES = [
  "Priyanka Menon", "Rajesh Kumar Sinha", "Anjali Deshmukh", "S. Venkatraman",
  "Mohammed Irfan", "Kavita Bhattacharya", "Arun Prakash Nair", "Deepak Mahto",
  "Sunita Rani Gupta", "T. Selvaraj", "Neha Agarwal", "Bikash Chandra Das",
];

const DESIGNATIONS = [
  "Chief Manager (Systems)", "Senior Manager (Planning)", "Deputy Manager (Geology)",
  "General Manager (Operations)", "Manager (Environment)", "Executive (Data Cell)",
  "Senior Analyst", "Additional General Manager",
];

const SUBS = ["ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC", "CMPDI"];

export const USERS: User[] = NAMES.map((name, i) => {
  const rand = seeded(i * 977 + 13);
  const roles: User["role"][] = ["Administrator", "Analyst", "Reviewer", "Viewer"];
  return {
    id: `usr-${String(i + 1).padStart(3, "0")}`,
    name,
    email: `${name.split(" ")[0].toLowerCase()}.${name.split(" ").pop()!.toLowerCase()}@${
      i % 3 === 0 ? "cmpdi" : "coalindia"
    }.co.in`,
    role: i === 0 ? "Administrator" : roles[Math.floor(rand() * 4)],
    subsidiary: SUBS[i % SUBS.length],
    designation: DESIGNATIONS[i % DESIGNATIONS.length],
    status: i === 5 ? "suspended" : i === 9 ? "invited" : "active",
    lastActive: isoDaysAgo(Math.floor(rand() * 14)),
    createdAt: isoDaysAgo(120 + Math.floor(rand() * 400)),
  };
});

const DOC_NAMES: [string, IngestedDocument["kind"]][] = [
  ["Annual-Coal-Production-Report-FY2025-26.pdf", "pdf"],
  ["Geological-Survey-Jharia-Block-VII.pdf", "pdf"],
  ["Overburden-Removal-Q2-Statement.xlsx", "spreadsheet"],
  ["Mine-Closure-Plan-Sohagpur-Scan.pdf", "scan"],
  ["Environmental-Clearance-Talcher-2019.pdf", "scan"],
  ["Washery-Throughput-Monthly-Aug.xlsx", "spreadsheet"],
  ["Borehole-Log-Section-Raniganj.jpg", "image"],
  ["Safety-Audit-Findings-Korba.docx", "docx"],
  ["Exploration-Drilling-Progress-NCL.pdf", "pdf"],
  ["Land-Acquisition-Records-1987-Vol3.pdf", "scan"],
  ["Coal-Grade-Slippage-Analysis.xlsx", "spreadsheet"],
  ["Subsidence-Monitoring-Photographs.jpg", "image"],
  ["Rehabilitation-Colony-Layout-Plan.pdf", "pdf"],
  ["Quarterly-Dispatch-Reconciliation.xlsx", "spreadsheet"],
  ["Ventilation-Survey-Underground-Mine-4.pdf", "scan"],
  ["CSR-Expenditure-Statement-FY25.docx", "docx"],
  ["Hydrogeological-Assessment-Singrauli.pdf", "pdf"],
  ["Stowing-Material-Consumption-Log.xlsx", "spreadsheet"],
];

const STATUSES: IngestedDocument["status"][] = [
  "validated", "validated", "validated", "processing", "extracted",
  "error", "validated", "uploading", "queued", "validated",
  "extracted", "validated", "processing", "validated", "error",
  "validated", "extracted", "validated",
];

export const DOCUMENTS: IngestedDocument[] = DOC_NAMES.map(([name, kind], i) => {
  const rand = seeded(i * 613 + 41);
  const status = STATUSES[i];
  return {
    id: `doc-${String(i + 1).padStart(3, "0")}`,
    name,
    kind,
    sizeBytes: Math.floor(180_000 + rand() * 24_000_000),
    status,
    progress:
      status === "uploading" ? 62 : status === "processing" ? 41 :
      status === "queued" ? 0 : 100,
    subsidiary: SUBS[i % SUBS.length],
    uploadedBy: NAMES[i % NAMES.length],
    uploadedAt: isoDaysAgo(Math.floor(rand() * 30), 8 + (i % 9)),
    pageCount: Math.floor(4 + rand() * 240),
    confidence: status === "error" ? 0 : Math.round((78 + rand() * 21) * 10) / 10,
    errorMessage:
      status === "error"
        ? i === 5
          ? "OCR failed: page 14 resolution below 150 DPI threshold"
          : "Table extraction aborted: malformed merged cells on sheet 3"
        : undefined,
  };
});

export const JOBS: ProcessingJob[] = DOCUMENTS.filter((d) =>
  ["processing", "extracted", "queued", "error"].includes(d.status),
).map((doc, i) => {
  const rand = seeded(i * 331 + 7);
  const stageNames = [
    "Ingestion", "OCR / Digitization", "Table Extraction",
    "Entity Recognition", "Indexing",
  ] as const;
  const reached = doc.status === "queued" ? 0 : doc.status === "error" ? 2 : doc.status === "extracted" ? 4 : 2;
  return {
    id: `job-${String(i + 1).padStart(3, "0")}`,
    documentId: doc.id,
    documentName: doc.name,
    startedAt: doc.uploadedAt,
    ocrEngine: doc.kind === "scan" || doc.kind === "image" ? "Tesseract 5.3 + LayoutLMv3" : "Native text layer",
    language: rand() > 0.75 ? "Hindi + English" : "English",
    stages: stageNames.map((name, s) => {
      const failed = doc.status === "error" && s === reached;
      const status =
        failed ? "failed" as const :
        s < reached ? "complete" as const :
        s === reached && doc.status !== "queued" ? "running" as const :
        "pending" as const;
      return {
        name,
        status,
        progress: status === "complete" ? 100 : status === "running" ? Math.floor(30 + rand() * 50) : 0,
        durationMs: status === "complete" ? Math.floor(800 + rand() * 42_000) : 0,
        message:
          failed ? doc.errorMessage ?? "Stage failed" :
          status === "complete" ? "Completed" :
          status === "running" ? "In progress" : "Awaiting upstream stage",
      };
    }),
  };
});

const FIELD_LABELS = [
  "Report Period", "Subsidiary", "Mine Name", "Coal Grade", "Production (MT)",
  "Overburden Removed (Mm³)", "Stripping Ratio", "Manpower Deployed",
  "Despatch (MT)", "Stock at Pithead (MT)", "Capital Expenditure (₹ Cr)",
  "Environmental Clearance No.",
];

const FIELD_VALUES = [
  "FY 2025-26 Q2", "South Eastern Coalfields Ltd", "Gevra Opencast Project", "G-11",
  "12,480,300", "68.42", "3.71", "4,182", "12,105,880", "374,420", "1,284.60",
  "J-11015/122/2019-IA.II(M)",
];

export const VALIDATION_RECORDS: ValidationRecord[] = DOCUMENTS
  .filter((d) => d.status === "extracted" || d.status === "validated")
  .slice(0, 6)
  .map((doc, i) => {
    const rand = seeded(i * 811 + 29);
    return {
      id: `val-${String(i + 1).padStart(3, "0")}`,
      documentId: doc.id,
      documentName: doc.name,
      subsidiary: doc.subsidiary,
      assignedTo: NAMES[(i + 2) % NAMES.length],
      submittedAt: doc.uploadedAt,
      fields: FIELD_LABELS.map((label, f) => {
        const confidence = Math.round((62 + rand() * 37) * 10) / 10;
        const status =
          confidence < 75 ? "error" as const :
          confidence < 88 ? "pending" as const : "validated" as const;
        return {
          id: `${doc.id}-f${f}`,
          label,
          extractedValue: FIELD_VALUES[f],
          correctedValue: null,
          confidence,
          status,
          pageRef: 1 + Math.floor(rand() * 12),
          boundingBoxHint: `p.${1 + Math.floor(rand() * 12)} · table ${1 + (f % 3)}`,
        };
      }),
    };
  });

export const CHAT_THREADS: ChatThread[] = [
  {
    id: "thr-001",
    title: "Production trends across subsidiaries",
    updatedAt: isoDaysAgo(0, 11),
    messages: [
      {
        id: "msg-001",
        role: "user",
        content: "Summarise coal production trends across subsidiaries for FY 2025-26 so far.",
        createdAt: isoDaysAgo(0, 11),
        citations: [],
      },
      {
        id: "msg-002",
        role: "assistant",
        content:
          "Across the first two quarters of FY 2025-26, aggregate raw coal production reached 412.7 MT, tracking 3.8% above the corresponding period last year and 1.2% below the internal target of 417.6 MT.\n\nSECL and MCL together contributed 46% of the total, with MCL posting the strongest year-on-year growth at 8.4% on the back of the Talcher expansion. NCL held steady at 2.1% growth. ECL and BCCL both slipped against target — ECL by 4.6% owing to monsoon-related disruption at Rajmahal, and BCCL by 6.9% attributable to land acquisition delays in the Jharia master plan area.\n\nStripping ratios rose marginally across opencast operations, from 3.42 to 3.71 m³/tonne, consistent with deeper working horizons.",
        createdAt: isoDaysAgo(0, 11),
        citations: [
          {
            id: "cit-001",
            documentName: "Annual-Coal-Production-Report-FY2025-26.pdf",
            page: 24,
            snippet: "Aggregate raw coal production for H1 FY 2025-26 stood at 412.7 MT against a target of 417.6 MT, representing an achievement of 98.8%.",
            relevance: 0.96,
          },
          {
            id: "cit-002",
            documentName: "Quarterly-Dispatch-Reconciliation.xlsx",
            page: 3,
            snippet: "MCL: 94.2 MT (YoY +8.4%); SECL: 96.1 MT (YoY +2.7%); NCL: 71.4 MT (YoY +2.1%)",
            relevance: 0.91,
          },
          {
            id: "cit-003",
            documentName: "Coal-Grade-Slippage-Analysis.xlsx",
            page: 1,
            snippet: "Average stripping ratio for opencast operations increased to 3.71 m³/t from 3.42 m³/t in the prior year.",
            relevance: 0.84,
          },
        ],
      },
    ],
  },
  {
    id: "thr-002",
    title: "Environmental clearance status",
    updatedAt: isoDaysAgo(2, 15),
    messages: [],
  },
  {
    id: "thr-003",
    title: "Washery throughput comparison",
    updatedAt: isoDaysAgo(5, 14),
    messages: [],
  },
];

const TEMPLATE_SECTIONS = [
  ["Executive Summary", "Auto-generated overview with key figures and variance callouts"],
  ["Production Statistics", "Subsidiary-wise output, target achievement and YoY comparison"],
  ["Operational Performance", "Stripping ratio, manpower productivity, equipment availability"],
  ["Environmental Compliance", "Clearance status, monitoring results, remediation progress"],
  ["Financial Overview", "Capital expenditure, revenue realisation, cost per tonne"],
  ["Risk & Exceptions", "Flagged anomalies, pending validations and data gaps"],
  ["Annexures", "Source document index with page-level citations"],
];

export const TEMPLATES: ReportTemplate[] = [
  ["tpl-001", "Annual Production Review", "Statutory", "Comprehensive yearly production and performance report submitted to the Ministry of Coal.", true],
  ["tpl-002", "Parliamentary Question Brief", "Parliamentary", "Concise fact-checked brief with source citations for Lok Sabha / Rajya Sabha replies.", false],
  ["tpl-003", "Monthly Operations Digest", "Operational", "Subsidiary operations snapshot circulated to functional directors.", false],
  ["tpl-004", "Environmental Compliance Statement", "Environmental", "Clearance conditions, monitoring data and compliance attestation.", false],
  ["tpl-005", "Quarterly Financial Summary", "Financial", "Capex, opex and realisation figures consolidated across subsidiaries.", false],
  ["tpl-006", "Exploration Progress Report", "Operational", "Drilling metreage, borehole logs and resource estimation updates.", false],
].map(([id, name, category, description, isDefault], i) => {
  const rand = seeded(i * 457 + 19);
  return {
    id: id as string,
    name: name as string,
    category: category as ReportTemplate["category"],
    description: description as string,
    isDefault: isDefault as boolean,
    updatedAt: isoDaysAgo(Math.floor(rand() * 90)),
    usageCount: Math.floor(12 + rand() * 340),
    sections: TEMPLATE_SECTIONS.map(([title, desc], s) => ({
      id: `${id}-s${s}`,
      title: title as string,
      description: desc as string,
      enabled: s < 5 || rand() > 0.4,
    })),
  };
});

const REPORT_TITLES = [
  "Annual Production Review FY 2025-26 (H1)",
  "Parliamentary Brief — Jharia Rehabilitation Progress",
  "Monthly Operations Digest — August 2026",
  "Environmental Compliance Statement — Talcher Coalfield",
  "Quarterly Financial Summary Q2 FY 2025-26",
  "Exploration Progress Report — Raniganj Extension",
  "Coal Grade Slippage Investigation",
  "Safety Audit Consolidated Findings — Korba Area",
  "Land Acquisition Status — Jharia Master Plan",
  "Washery Performance Benchmark Study",
  "Overburden Removal Efficiency Analysis",
  "Subsidence Monitoring Annual Report",
];

export const REPORTS: Report[] = REPORT_TITLES.map((title, i) => {
  const rand = seeded(i * 727 + 53);
  const tpl = TEMPLATES[i % TEMPLATES.length];
  const statuses: Report["status"][] = ["published", "published", "draft", "generating", "archived", "published"];
  return {
    id: `rep-${String(i + 1).padStart(3, "0")}`,
    title,
    templateId: tpl.id,
    templateName: tpl.name,
    status: statuses[i % statuses.length],
    version: 1 + Math.floor(rand() * 5),
    subsidiary: SUBS[i % SUBS.length],
    createdBy: NAMES[i % NAMES.length],
    createdAt: isoDaysAgo(10 + Math.floor(rand() * 200)),
    updatedAt: isoDaysAgo(Math.floor(rand() * 10)),
    pageCount: Math.floor(8 + rand() * 90),
    formats: rand() > 0.5 ? ["PDF", "DOCX"] : ["PDF"],
  };
});

export const TOPIC_TERMS: TopicTerm[] = [
  ["coal production", 100, "Operations"], ["overburden removal", 86, "Operations"],
  ["environmental clearance", 79, "Compliance"], ["stripping ratio", 71, "Operations"],
  ["land acquisition", 68, "Compliance"], ["mine closure", 64, "Compliance"],
  ["washery throughput", 61, "Operations"], ["grade slippage", 58, "Quality"],
  ["safety audit", 55, "Safety"], ["manpower productivity", 52, "Operations"],
  ["rehabilitation", 49, "Social"], ["borehole logging", 46, "Exploration"],
  ["subsidence", 44, "Safety"], ["despatch", 42, "Logistics"],
  ["capital expenditure", 40, "Finance"], ["ventilation survey", 37, "Safety"],
  ["resource estimation", 35, "Exploration"], ["stowing material", 33, "Operations"],
  ["CSR expenditure", 31, "Social"], ["pithead stock", 29, "Logistics"],
  ["drilling metreage", 27, "Exploration"], ["water quality", 25, "Compliance"],
  ["equipment availability", 24, "Operations"], ["blasting", 22, "Operations"],
  ["afforestation", 21, "Compliance"], ["haul road", 19, "Logistics"],
  ["seam thickness", 18, "Exploration"], ["dragline", 17, "Operations"],
  ["conveyor system", 16, "Logistics"], ["ash content", 15, "Quality"],
  ["moisture content", 14, "Quality"], ["royalty", 13, "Finance"],
  ["dust suppression", 12, "Compliance"], ["evacuation capacity", 11, "Logistics"],
  ["geotechnical", 10, "Exploration"],
].map(([text, weight, category]) => ({
  text: text as string,
  weight: weight as number,
  category: category as string,
  documentCount: Math.max(1, Math.round((weight as number) / 4)),
}));

export const TOPIC_CLUSTERS: TopicCluster[] = [
  ["Production & Output", 284, 0.62, ["coal production", "despatch", "pithead stock", "grade slippage"]],
  ["Environmental Compliance", 219, 0.18, ["environmental clearance", "afforestation", "water quality", "dust suppression"]],
  ["Mining Operations", 196, 0.54, ["overburden removal", "stripping ratio", "dragline", "blasting"]],
  ["Safety & Risk", 154, -0.12, ["safety audit", "subsidence", "ventilation survey", "geotechnical"]],
  ["Exploration & Geology", 132, 0.47, ["borehole logging", "resource estimation", "drilling metreage", "seam thickness"]],
  ["Land & Rehabilitation", 118, -0.24, ["land acquisition", "rehabilitation", "mine closure", "CSR expenditure"]],
  ["Logistics & Evacuation", 97, 0.31, ["haul road", "conveyor system", "evacuation capacity", "despatch"]],
  ["Financial Performance", 84, 0.44, ["capital expenditure", "royalty", "cost per tonne"]],
].map(([label, frequency, sentiment, terms], i) => ({
  id: `tc-${i + 1}`,
  label: label as string,
  frequency: frequency as number,
  sentiment: sentiment as number,
  terms: terms as string[],
}));

const PQ_SUBJECTS = [
  "Progress of Jharia Master Plan rehabilitation and resettlement",
  "Coal production shortfall against annual targets in Eastern Coalfields",
  "Status of environmental clearances pending for new mining projects",
  "Employment generation in coal-bearing districts over last five years",
  "Measures taken to curb illegal mining in Dhanbad region",
  "Investment in coal gasification projects under CIL subsidiaries",
  "Compensation disbursed for land acquired in Talcher coalfield",
  "Safety incidents reported in underground mines during FY 2025-26",
  "Renewable energy capacity commissioned by Coal India Limited",
  "Coal import substitution progress and domestic supply adequacy",
];

export const PARLIAMENTARY_QUERIES: ParliamentaryQuery[] = PQ_SUBJECTS.map((subject, i) => {
  const rand = seeded(i * 907 + 61);
  const priorities: ParliamentaryQuery["priority"][] = ["critical", "high", "normal"];
  const stages: ParliamentaryQuery["stage"][] = ["received", "assigned", "drafting", "review", "answered"];
  const received = Math.floor(rand() * 20);
  return {
    id: `pq-${String(i + 1).padStart(3, "0")}`,
    referenceNo: `LS/USQ/${2026}/${1840 + i * 7}`,
    subject,
    house: i % 3 === 0 ? "Rajya Sabha" : "Lok Sabha",
    memberName: pick(rand, [
      "Shri A. Raghunathan", "Smt. Meenakshi Lekhi Sharma", "Dr. Amar Patnaik",
      "Shri Vinod Kumar Yadav", "Smt. Sushmita Deb", "Shri Ravi Kishan Shukla",
    ]),
    priority: priorities[i % 3],
    stage: stages[i % 5],
    receivedAt: isoDaysAgo(received),
    dueAt: isoDaysAgo(received - 14),
    assignedTo: NAMES[(i + 3) % NAMES.length],
    subsidiary: SUBS[i % SUBS.length],
    linkedReportIds: [REPORTS[i % REPORTS.length].id],
  };
});

export const KPIS: KpiMetric[] = [
  { id: "k1", label: "Reports Generated", value: "1,284", rawValue: 1284, delta: 12.4, unit: "this quarter", trend: "up", helpText: "Total reports produced across all templates in the current quarter." },
  { id: "k2", label: "Avg. Processing Time", value: "4m 12s", rawValue: 252, delta: -18.6, unit: "per document", trend: "down", helpText: "Mean end-to-end time from upload to indexed and query-ready." },
  { id: "k3", label: "Extraction Accuracy", value: "94.7%", rawValue: 94.7, delta: 2.1, unit: "validated fields", trend: "up", helpText: "Share of extracted fields accepted without human correction." },
  { id: "k4", label: "Pending Queries", value: "37", rawValue: 37, delta: -9.2, unit: "awaiting response", trend: "down", helpText: "Parliamentary and internal queries not yet answered." },
  { id: "k5", label: "Documents Ingested", value: "18,942", rawValue: 18942, delta: 7.8, unit: "cumulative", trend: "up", helpText: "Total documents digitised and indexed since deployment." },
  { id: "k6", label: "Validation Backlog", value: "126", rawValue: 126, delta: 4.3, unit: "fields flagged", trend: "up", helpText: "Low-confidence fields awaiting human-in-loop review." },
];

const PERIODS = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];

export const TIME_SERIES: TimeSeriesPoint[] = PERIODS.map((period, i) => {
  const rand = seeded(i * 199 + 5);
  return {
    period,
    reports: Math.round(72 + i * 6 + rand() * 40),
    queries: Math.round(28 + rand() * 34 + (i > 7 ? 18 : 0)),
    documents: Math.round(880 + i * 42 + rand() * 320),
  };
});

export const CATEGORY_BREAKDOWN: CategoryDatum[] = [
  { name: "Statutory", value: 384 },
  { name: "Operational", value: 462 },
  { name: "Parliamentary", value: 186 },
  { name: "Environmental", value: 158 },
  { name: "Financial", value: 94 },
];

export const SUBSIDIARY_PERFORMANCE: SubsidiaryPerformance[] = [
  ["SECL", 96.1, 94.0, 96.2, 214, 4],
  ["MCL", 94.2, 88.5, 95.8, 198, 6],
  ["NCL", 71.4, 70.2, 97.1, 156, 3],
  ["CCL", 52.8, 55.4, 92.4, 132, 8],
  ["WCL", 41.6, 42.9, 93.7, 118, 5],
  ["ECL", 38.4, 40.8, 89.6, 104, 7],
  ["BCCL", 24.9, 27.1, 88.2, 88, 9],
  ["NEC", 3.2, 3.0, 91.5, 24, 1],
].map(([subsidiary, production, target, accuracy, reports, pendingQueries]) => ({
  subsidiary: subsidiary as string,
  production: production as number,
  target: target as number,
  accuracy: accuracy as number,
  reports: reports as number,
  pendingQueries: pendingQueries as number,
  variance: Math.round((((production as number) - (target as number)) / (target as number)) * 1000) / 10,
}));

const ACTIVITY_TEMPLATES: [ActivityEvent["kind"], string, string][] = [
  ["upload", "uploaded", "Annual-Coal-Production-Report-FY2025-26.pdf"],
  ["report", "published", "Quarterly Financial Summary Q2 FY 2025-26"],
  ["validation", "approved 12 fields in", "Overburden-Removal-Q2-Statement.xlsx"],
  ["query", "answered parliamentary query", "LS/USQ/2026/1847"],
  ["upload", "uploaded", "Mine-Closure-Plan-Sohagpur-Scan.pdf"],
  ["system", "completed OCR pipeline for", "14 documents"],
  ["report", "created draft", "Monthly Operations Digest — August 2026"],
  ["validation", "flagged low-confidence field in", "Coal-Grade-Slippage-Analysis.xlsx"],
  ["query", "asked", "Washery throughput comparison SECL vs MCL"],
  ["system", "synced", "SECL Production MIS — 1,284 records"],
  ["report", "exported to DOCX", "Parliamentary Brief — Jharia Rehabilitation"],
  ["upload", "retried failed ingestion of", "Ventilation-Survey-Underground-Mine-4.pdf"],
];

export const ACTIVITY: ActivityEvent[] = ACTIVITY_TEMPLATES.map(([kind, action, target], i) => ({
  id: `act-${String(i + 1).padStart(3, "0")}`,
  actor: NAMES[i % NAMES.length],
  action,
  target,
  kind,
  createdAt: isoDaysAgo(Math.floor(i / 3), 16 - (i % 8)),
}));

const AUDIT_ACTIONS: [string, string, AuditEntry["outcome"]][] = [
  ["USER_LOGIN", "Authentication", "success"],
  ["DOCUMENT_UPLOAD", "Document", "success"],
  ["FIELD_CORRECTION", "ValidationRecord", "success"],
  ["REPORT_GENERATE", "Report", "success"],
  ["REPORT_EXPORT", "Report", "success"],
  ["USER_ROLE_CHANGE", "User", "warning"],
  ["USER_LOGIN", "Authentication", "failure"],
  ["INTEGRATION_SYNC", "Integration", "success"],
  ["TEMPLATE_MODIFY", "ReportTemplate", "success"],
  ["DOCUMENT_DELETE", "Document", "warning"],
  ["QUERY_SUBMIT", "ChatThread", "success"],
  ["INTEGRATION_SYNC", "Integration", "failure"],
  ["PERMISSION_DENIED", "Report", "failure"],
  ["VALIDATION_APPROVE", "ValidationRecord", "success"],
  ["SETTINGS_UPDATE", "Configuration", "success"],
  ["USER_SUSPEND", "User", "warning"],
  ["BULK_EXPORT", "Report", "success"],
  ["SESSION_EXPIRED", "Authentication", "warning"],
];

export const AUDIT_ENTRIES: AuditEntry[] = Array.from({ length: 42 }, (_, i) => {
  const rand = seeded(i * 373 + 11);
  const [action, resource, outcome] = AUDIT_ACTIONS[i % AUDIT_ACTIONS.length];
  const user = USERS[i % USERS.length];
  return {
    id: `aud-${String(i + 1).padStart(4, "0")}`,
    timestamp: isoDaysAgo(Math.floor(i / 4), 18 - (i % 11)),
    actor: user.name,
    actorRole: user.role,
    action,
    resource,
    resourceId: `${resource.slice(0, 3).toLowerCase()}-${String(1 + Math.floor(rand() * 200)).padStart(3, "0")}`,
    ipAddress: `10.${12 + (i % 40)}.${1 + (i % 200)}.${2 + (i % 250)}`,
    outcome,
    details:
      outcome === "failure" ? "Request rejected — insufficient privileges for the requested scope" :
      outcome === "warning" ? "Action completed with elevated privileges; recorded for review" :
      "Action completed successfully",
  };
});

export const INTEGRATIONS: Integration[] = [
  ["Coal Net Production MIS", "CIL", "Central production reporting system feeding daily output figures.", "connected", 45, 12_840],
  ["SECL Operations Gateway", "SECL", "Subsidiary operational data — despatch, stock and equipment availability.", "connected", 30, 8_412],
  ["MCL Environmental Portal", "MCL", "Clearance status, monitoring readings and compliance filings.", "connected", 120, 2_190],
  ["NCL Exploration Database", "NCL", "Borehole logs, drilling metreage and resource estimates.", "degraded", 60, 940],
  ["BCCL Land Records Interface", "BCCL", "Land acquisition, compensation and rehabilitation records.", "connected", 240, 1_486],
  ["Ministry of Coal e-Office", "MoC", "Parliamentary query intake and reply submission channel.", "connected", 15, 372],
  ["ECL Legacy Archive (FTP)", "ECL", "Historical scanned records prior to 2015 digitisation drive.", "disconnected", 1440, 0],
  ["CMPDI Geological Repository", "CMPDI", "Survey reports, seam correlation and geotechnical assessments.", "connected", 180, 3_628],
].map(([name, subsidiary, description, status, syncIntervalMinutes, recordsSynced], i) => ({
  id: `int-${String(i + 1).padStart(3, "0")}`,
  name: name as string,
  subsidiary: subsidiary as string,
  description: description as string,
  status: status as Integration["status"],
  endpoint: `https://${(name as string).toLowerCase().replace(/[^a-z]+/g, "-")}.coalindia.internal/api/v2`,
  lastSyncAt: status === "disconnected" ? isoDaysAgo(21) : isoDaysAgo(0, 12 - i),
  recordsSynced: recordsSynced as number,
  syncIntervalMinutes: syncIntervalMinutes as number,
}));

export const NOTIFICATIONS: AppNotification[] = [
  ["Parliamentary query due in 48 hours", "LS/USQ/2026/1847 on Jharia rehabilitation requires a drafted reply before 25 Aug.", "critical", "Parliamentary Tracker", "/parliamentary"],
  ["Ingestion failed for 2 documents", "OCR could not process Ventilation-Survey-Underground-Mine-4.pdf — resolution below threshold.", "warning", "Document Pipeline", "/upload"],
  ["Report published", "Quarterly Financial Summary Q2 FY 2025-26 has been published and is available for export.", "success", "Report Generation", "/reports"],
  ["126 fields awaiting validation", "Low-confidence extractions across 6 documents need human review.", "warning", "Data Validation", "/validation"],
  ["ECL Legacy Archive disconnected", "The FTP integration has not synced for 21 days. Credentials may have expired.", "critical", "Integrations", "/settings"],
  ["New user invited", "Sunita Rani Gupta has been invited as Reviewer for WCL.", "info", "User Management", "/users"],
  ["Monthly digest ready", "August 2026 Operations Digest generated from 412 source documents.", "success", "Report Generation", "/reports"],
  ["Scheduled maintenance", "Platform maintenance window on 30 Aug, 02:00–04:00 IST. Uploads will be queued.", "info", "System", undefined],
].map(([title, body, severity, source, link], i) => ({
  id: `ntf-${String(i + 1).padStart(3, "0")}`,
  title: title as string,
  body: body as string,
  severity: severity as AppNotification["severity"],
  source: source as string,
  link: link as string | undefined,
  read: i > 4,
  createdAt: isoDaysAgo(Math.floor(i / 2), 17 - i),
}));

export const HELP_RESOURCES: HelpResource[] = [
  ["Getting Started with the CMPDI Platform", "End-to-end walkthrough covering login, navigation and your first document upload.", "guide", "Onboarding", "12 min read"],
  ["Uploading and Digitising Legacy Records", "Best practices for scanning quality, batch uploads and handling multi-language documents.", "guide", "Document Management", "8 min read"],
  ["Human-in-Loop Validation Workflow", "How to review low-confidence extractions, apply corrections and approve records.", "video", "Data Quality", "14 min"],
  ["Asking Effective Questions in the AI Query System", "Phrasing queries for precise answers and interpreting source citations.", "guide", "AI Query", "6 min read"],
  ["Building and Customising Report Templates", "Configure sections, parameters and export formats for recurring reports.", "video", "Reporting", "18 min"],
  ["Parliamentary Query Response Protocol", "Escalation paths, timelines and approval chain for parliamentary replies.", "guide", "Compliance", "10 min read"],
  ["Interpreting Word Cloud and Topic Analysis", "Understand term weighting, clustering and how to drill into source documents.", "guide", "Analytics", "7 min read"],
  ["Role-Based Access Control Reference", "Permission matrix for Administrator, Analyst, Reviewer and Viewer roles.", "download", "Administration", "PDF · 420 KB"],
  ["Data Retention and Audit Policy", "Statutory retention periods, audit log scope and traceability guarantees.", "download", "Compliance", "PDF · 1.2 MB"],
  ["Keyboard Shortcuts Quick Reference", "Navigation and action shortcuts across all modules.", "download", "Productivity", "PDF · 180 KB"],
].map(([title, description, kind, category, duration], i) => ({
  id: `hlp-${String(i + 1).padStart(3, "0")}`,
  title: title as string,
  description: description as string,
  kind: kind as HelpResource["kind"],
  category: category as string,
  duration: duration as string,
  updatedAt: isoDaysAgo(14 + i * 9),
}));

export const FAQS: FaqItem[] = [
  ["Why is my scanned document showing low extraction confidence?", "Confidence depends heavily on scan resolution. Documents below 200 DPI, or with skewed pages and handwritten annotations, produce weaker OCR output. Re-scan at 300 DPI where possible, then use the retry action on the Upload page. Fields below 75% confidence are always routed to human validation rather than being accepted automatically.", "Document Management"],
  ["Can I correct a value the AI extracted incorrectly?", "Yes. On the Data Validation page, every extracted field can be edited inline. Your correction is recorded against your user ID in the audit log, and the original extracted value is preserved alongside it so the change remains fully traceable.", "Data Quality"],
  ["How does the AI Query System decide which documents to cite?", "Queries are matched against the indexed document corpus using semantic similarity. The system returns the highest-relevance passages and surfaces them as expandable citation cards beneath each answer, with the source document name and page number. Answers are generated only from indexed material — the system does not draw on outside knowledge.", "AI Query"],
  ["What happens to a report when I edit a published version?", "Editing a published report creates a new version. The prior version remains immutable in the Report Archive, so any figure quoted externally can always be traced back to the exact document that produced it.", "Reporting"],
  ["Who can see parliamentary queries marked critical?", "Critical queries are visible to Administrators and to the Analyst assigned to the query, along with any Reviewer in the same subsidiary. Viewers do not have access to the Parliamentary Tracker.", "Compliance"],
  ["How long are audit logs retained?", "Audit entries are retained for seven years in line with statutory record-keeping requirements, and cannot be deleted or modified by any role, including Administrators.", "Compliance"],
  ["Can I use the platform on a tablet or phone?", "Yes. All modules are responsive. On narrower screens the navigation sidebar collapses into a drawer, and dense data tables scroll horizontally within their panel rather than breaking the page layout.", "Onboarding"],
  ["What file formats can I upload?", "PDF (both native-text and scanned), Excel spreadsheets (XLSX and XLS), Word documents (DOCX), and images (JPG, PNG, TIFF). Individual files may be up to 200 MB.", "Document Management"],
].map(([question, answer, category], i) => ({
  id: `faq-${String(i + 1).padStart(3, "0")}`,
  question: question as string,
  answer: answer as string,
  category: category as string,
}));


export const PIPELINE_SUMMARY: PipelineStageSummary[] = [
  ["Ingested", 18942], ["OCR complete", 18488], ["Tables extracted", 17904],
  ["Entities tagged", 17322], ["Indexed", 16994],
].map(([stage, count]) => ({
  stage: stage as string,
  count: count as number,
  share: Math.round(((count as number) / 18942) * 1000) / 10,
}));

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export const INGESTION_HEATMAP: IngestionHeatCell[] = DAYS.flatMap((day, d) =>
  Array.from({ length: 12 }, (_, h) => {
    const rand = seeded(d * 131 + h * 17 + 3);
    const hour = 8 + h;
    const weekend = d >= 5;
    // office hours carry the load; weekends are batch-upload only
    const peak = hour >= 10 && hour <= 16 ? 1 : 0.35;
    const base = weekend ? 0.18 : 1;
    return { day, hour, value: Math.round(rand() * 46 * peak * base) };
  }),
);

export const ACCURACY_TREND: AccuracyTrendPoint[] = [
  ["Mar", 88.2, 412], ["Apr", 89.1, 388], ["May", 90.4, 351],
  ["Jun", 91.2, 334], ["Jul", 91.9, 318], ["Aug", 92.6, 296],
  ["Sep", 93.1, 281], ["Oct", 93.4, 268], ["Nov", 93.9, 244],
  ["Dec", 94.2, 231], ["Jan", 94.5, 218], ["Feb", 94.7, 204],
].map(([period, accuracy, humanCorrections]) => ({
  period: period as string,
  accuracy: accuracy as number,
  humanCorrections: humanCorrections as number,
}));

export const STORAGE_BREAKDOWN: StorageBreakdown[] = [
  ["Scanned PDF", 8420, 412.6], ["Native PDF", 5218, 96.4],
  ["Spreadsheet", 3106, 28.2], ["Images", 1642, 184.8], ["Word", 556, 7.1],
].map(([kind, documents, sizeGb]) => ({
  kind: kind as string,
  documents: documents as number,
  sizeGb: sizeGb as number,
}));

export const TOP_QUERIES: QueryHighlight[] = [
  ["Summarise coal production trends across subsidiaries for FY 2025-26", 3, 1240],
  ["Which mines exceeded their sanctioned stripping ratio?", 2, 980],
  ["Status of environmental clearances pending with MoEFCC", 4, 1510],
  ["Jharia Master Plan rehabilitation progress and compensation", 2, 1120],
  ["Compare washery throughput between SECL and MCL", 3, 890],
].map(([question, citationCount, responseMs], i) => ({
  id: `qh-${i + 1}`,
  question: question as string,
  askedBy: NAMES[(i + 1) % NAMES.length],
  askedAt: isoDaysAgo(Math.floor(i / 2), 15 - i),
  citationCount: citationCount as number,
  responseMs: responseMs as number,
}));

export const DEADLINES: DeadlineItem[] = PARLIAMENTARY_QUERIES
  .filter((q) => q.stage !== "answered")
  .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
  .slice(0, 5)
  .map((q) => ({
    id: q.id,
    referenceNo: q.referenceNo,
    subject: q.subject,
    dueAt: q.dueAt,
    priority: q.priority,
    assignedTo: q.assignedTo,
  }));

export const SYSTEM_HEALTH: SystemHealth = {
  ocrQueueDepth: 14,
  avgLatencyMs: 248,
  uptimePercent: 99.94,
  indexFreshnessMin: 6,
  activeUsers: 87,
  storageUsedGb: 729.1,
  storageTotalGb: 2048,
};

export const DASHBOARD_TERMS = TOPIC_TERMS.slice(0, 14).map((t) => ({
  text: t.text,
  weight: t.weight,
}));
