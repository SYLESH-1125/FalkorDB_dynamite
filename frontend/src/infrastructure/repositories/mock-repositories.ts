// In-browser demo backend. Selected by the composition root when no NEXT_PUBLIC_API_URL
// is configured, so the whole app is fully usable with no server behind it.
import type {
  AuthRepository, DocumentRepository, ValidationRepository, QueryRepository,
  ReportRepository, TopicRepository, ParliamentaryRepository, AnalyticsRepository,
  UserRepository, AuditRepository, IntegrationRepository, NotificationRepository,
  HelpRepository, GraphRepository, BrainRepository, VoiceRepository, Transcription,
} from "@/src/domain/repositories";
import type { AppRole, Credentials, Session, SignUpInput, User, UserRole } from "@/src/domain/entities/user";
import type { IngestedDocument, ProcessingJob } from "@/src/domain/entities/document";
import type { ExtractedField, ValidationRecord } from "@/src/domain/entities/validation";
import type { ChatMessage, ChatThread } from "@/src/domain/entities/query";
import type {
  Report, ReportTemplate, ReportVersion, ReportWizardConfig, ReportDraftRequest,
  ReportDocument, ReportEvidence, ShareLink, SharedReport,
} from "@/src/domain/entities/report";
import type { TopicCluster, TopicTerm } from "@/src/domain/entities/topic";
import type { ParliamentaryQuery, QueryStage } from "@/src/domain/entities/parliamentary";
import type { DashboardSnapshot } from "@/src/domain/entities/analytics";
import type { AuditEntry } from "@/src/domain/entities/audit";
import type { Integration } from "@/src/domain/entities/integration";
import type { AppNotification } from "@/src/domain/entities/notification";
import type { FaqItem, HelpResource } from "@/src/domain/entities/help";
import type { KnowledgeGraph } from "@/src/domain/entities/graph";
import type { BrainAnswer, BrainBrief, BrainFact } from "@/src/domain/entities/brain";
import { answerQuestion, computeTerms, computeClusters, assembleReport } from "@/src/infrastructure/engine/knowledge-engine";
import { demoBrainAnswer } from "@/src/infrastructure/engine/demo-brain-answer";

const SESSION_KEY = "bhumi.session";
const SUBS = ["ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC"];

// fixed clock so demo data reads as fresh against the app's formatting anchor (2026-08-23)
const NOW = Date.parse("2026-08-23T12:00:00Z");
const iso = (offsetMinutes: number): string => new Date(NOW + offsetMinutes * 60_000).toISOString();
const ok = <T>(value: T): Promise<T> => Promise.resolve(value);
let counter = 1000;
const nextId = (prefix: string): string => `${prefix}-${++counter}`;

// ── Auth ─────────────────────────────────────────────────────────────────────
const ROLE_PROFILE: Record<AppRole, { name: string; role: UserRole; subsidiary: string; designation: string }> = {
  admin: { name: "Ananya Rao", role: "Administrator", subsidiary: "CIL HQ", designation: "Platform Administrator" },
  ministry: { name: "Rajesh Kumar", role: "Analyst", subsidiary: "Ministry of Coal", designation: "Policy & Monitoring Officer" },
  "domain-officer": { name: "Meera Nair", role: "Reviewer", subsidiary: "CMPDI", designation: "Domain Officer" },
  parliamentary: { name: "Vikram Singh", role: "Analyst", subsidiary: "CIL HQ", designation: "Parliamentary Response" },
};

function buildUser(credentials: Credentials): User {
  const profile = ROLE_PROFILE[credentials.appRole];
  return {
    id: `emp-${credentials.employeeId}`,
    name: profile.name,
    email: `${profile.name.toLowerCase().replace(/\s+/g, ".")}@coal.gov.in`,
    role: profile.role,
    appRole: credentials.appRole,
    subsidiary: profile.subsidiary,
    designation: profile.designation,
    status: "active",
    lastActive: iso(-5),
    createdAt: "2025-04-01T09:00:00.000Z",
  };
}

function readSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export const authRepository: AuthRepository = {
  signIn: (credentials) => {
    const session: Session = { user: buildUser(credentials), token: `demo.${credentials.appRole}.${credentials.employeeId}`, issuedAt: iso(0) };
    if (typeof window !== "undefined") window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return ok(session);
  },
  signUp: (input: SignUpInput) => {
    const profile = ROLE_PROFILE[input.appRole];
    const user: User = {
      id: `emp-${input.employeeId}`,
      name: input.name,
      email: input.email,
      role: profile.role,
      appRole: input.appRole,
      subsidiary: input.subsidiary,
      designation: input.designation ?? profile.designation,
      status: "active",
      lastActive: iso(0),
      createdAt: iso(0),
    };
    const session: Session = { user, token: `demo.${input.appRole}.${input.employeeId}`, issuedAt: iso(0) };
    if (typeof window !== "undefined") window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return ok(session);
  },
  signOut: () => {
    if (typeof window !== "undefined") window.localStorage.removeItem(SESSION_KEY);
    return ok(undefined);
  },
  currentSession: () => ok(readSession()),
};

// ── Documents ────────────────────────────────────────────────────────────────
let documents: IngestedDocument[] = [
  { id: "doc-1", name: "SECL-Gevra-Production-Return-FY25.pdf", kind: "pdf", sizeBytes: 4_812_004, status: "validated", progress: 100, subsidiary: "SECL", uploadedBy: "Meera Nair", uploadedAt: iso(-2880), pageCount: 42, confidence: 0.972 },
  { id: "doc-2", name: "MCL-Talcher-Env-Clearance-2024.pdf", kind: "pdf", sizeBytes: 7_390_221, status: "validated", progress: 100, subsidiary: "MCL", uploadedBy: "Meera Nair", uploadedAt: iso(-1500), pageCount: 88, confidence: 0.951 },
  { id: "doc-3", name: "NCL-Amlohri-Safety-Audit-scan.tiff", kind: "scan", sizeBytes: 12_004_552, status: "processing", progress: 64, subsidiary: "NCL", uploadedBy: "Arun Das", uploadedAt: iso(-40), pageCount: 31, confidence: 0.0 },
  { id: "doc-4", name: "CCL-Quarterly-Dispatch.xlsx", kind: "spreadsheet", sizeBytes: 244_113, status: "extracted", progress: 100, subsidiary: "CCL", uploadedBy: "Rajesh Kumar", uploadedAt: iso(-220), pageCount: 6, confidence: 0.918 },
  { id: "doc-5", name: "BCCL-Rehabilitation-Progress.docx", kind: "docx", sizeBytes: 1_003_884, status: "extracted", progress: 100, subsidiary: "BCCL", uploadedBy: "Priya Sharma", uploadedAt: iso(-320), pageCount: 18, confidence: 0.933 },
  { id: "doc-6", name: "ECL-Rajmahal-Overburden-photo.jpg", kind: "image", sizeBytes: 3_551_090, status: "error", progress: 100, subsidiary: "ECL", uploadedBy: "Arun Das", uploadedAt: iso(-95), pageCount: 1, confidence: 0.41, errorMessage: "Low-resolution scan — OCR confidence below threshold. Re-upload at 300 DPI." },
  { id: "doc-7", name: "WCL-Production-Targets-FY26.pdf", kind: "pdf", sizeBytes: 2_119_776, status: "queued", progress: 0, subsidiary: "WCL", uploadedBy: "Rajesh Kumar", uploadedAt: iso(-8), pageCount: 24, confidence: 0.0 },
  { id: "doc-8", name: "NEC-Margherita-Mine-Plan.pdf", kind: "pdf", sizeBytes: 5_664_201, status: "validated", progress: 100, subsidiary: "NEC", uploadedBy: "Meera Nair", uploadedAt: iso(-5000), pageCount: 55, confidence: 0.964 },
];

const KIND_BY_EXT: Record<string, IngestedDocument["kind"]> = {
  pdf: "pdf", xlsx: "spreadsheet", xls: "spreadsheet", csv: "spreadsheet",
  docx: "docx", doc: "docx", png: "image", jpg: "image", jpeg: "image", tiff: "scan", tif: "scan",
};

export const documentRepository: DocumentRepository = {
  list: () => ok([...documents]),
  upload: (files) => {
    const created = files.map((file) => {
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "pdf";
      const doc: IngestedDocument = {
        id: nextId("doc"), name: file.name, kind: KIND_BY_EXT[ext] ?? "pdf", sizeBytes: file.size,
        status: "processing", progress: 12, subsidiary: SUBS[counter % SUBS.length], uploadedBy: "You",
        uploadedAt: iso(0), pageCount: Math.max(1, Math.round(file.size / 90_000)), confidence: 0,
      };
      return doc;
    });
    documents = [...created, ...documents];
    return ok(created);
  },
  retry: (id) => {
    documents = documents.map((d) => (d.id === id ? { ...d, status: "processing", progress: 20, errorMessage: undefined } : d));
    return ok(documents.find((d) => d.id === id)!);
  },
  remove: (id) => {
    documents = documents.filter((d) => d.id !== id);
    return ok(undefined);
  },
  jobs: () => ok(processingJobs()),
};

function processingJobs(): ProcessingJob[] {
  return [
    {
      id: "job-1", documentId: "doc-3", documentName: "NCL-Amlohri-Safety-Audit-scan.tiff", startedAt: iso(-40),
      ocrEngine: "Tesseract 5 + layout LM", language: "English + Hindi",
      stages: [
        { name: "Ingestion", status: "complete", progress: 100, durationMs: 1400, message: "31 pages queued" },
        { name: "OCR / Digitization", status: "running", progress: 64, durationMs: 21800, message: "Page 20 of 31" },
        { name: "Table Extraction", status: "pending", progress: 0, durationMs: 0, message: "Awaiting OCR" },
        { name: "Entity Recognition", status: "pending", progress: 0, durationMs: 0, message: "Queued" },
        { name: "Indexing", status: "pending", progress: 0, durationMs: 0, message: "Queued" },
      ],
    },
    {
      id: "job-2", documentId: "doc-7", documentName: "WCL-Production-Targets-FY26.pdf", startedAt: iso(-8),
      ocrEngine: "Native PDF text", language: "English",
      stages: [
        { name: "Ingestion", status: "running", progress: 45, durationMs: 900, message: "Splitting 24 pages" },
        { name: "OCR / Digitization", status: "pending", progress: 0, durationMs: 0, message: "Queued" },
        { name: "Table Extraction", status: "pending", progress: 0, durationMs: 0, message: "Queued" },
        { name: "Entity Recognition", status: "pending", progress: 0, durationMs: 0, message: "Queued" },
        { name: "Indexing", status: "pending", progress: 0, durationMs: 0, message: "Queued" },
      ],
    },
  ];
}

// ── Validation ───────────────────────────────────────────────────────────────
function seedFields(): ExtractedField[] {
  return [
    { id: "f-1", label: "Coal Grade", extractedValue: "G8 (Non-Coking)", correctedValue: null, confidence: 0.97, status: "validated", pageRef: 3, boundingBoxHint: "Table 2, Row 4" },
    { id: "f-2", label: "Annual Production (MT)", extractedValue: "44.2", correctedValue: null, confidence: 0.89, status: "pending", pageRef: 5, boundingBoxHint: "Summary, Line 12" },
    { id: "f-3", label: "Stripping Ratio", extractedValue: "2.31", correctedValue: null, confidence: 0.62, status: "error", pageRef: 8, boundingBoxHint: "Fig 4 caption" },
    { id: "f-4", label: "Environmental Clearance No.", extractedValue: "J-11015/22/2019-IA.II(M)", correctedValue: null, confidence: 0.94, status: "validated", pageRef: 12, boundingBoxHint: "Header, Page 12" },
    { id: "f-5", label: "Rehabilitation Beneficiaries", extractedValue: "1,842", correctedValue: null, confidence: 0.78, status: "pending", pageRef: 15, boundingBoxHint: "Table 6" },
  ];
}

let validations: ValidationRecord[] = [
  { id: "val-1", documentId: "doc-1", documentName: "SECL-Gevra-Production-Return-FY25.pdf", subsidiary: "SECL", assignedTo: "Meera Nair", submittedAt: iso(-2800), fields: seedFields() },
  { id: "val-2", documentId: "doc-4", documentName: "CCL-Quarterly-Dispatch.xlsx", subsidiary: "CCL", assignedTo: "Meera Nair", submittedAt: iso(-210), fields: seedFields().slice(0, 4) },
  { id: "val-3", documentId: "doc-5", documentName: "BCCL-Rehabilitation-Progress.docx", subsidiary: "BCCL", assignedTo: "Arun Das", submittedAt: iso(-300), fields: seedFields().slice(1) },
];

export const validationRepository: ValidationRepository = {
  list: () => ok([...validations]),
  byId: (id) => ok(validations.find((v) => v.id === id) ?? null),
  saveField: (recordId, field) => {
    validations = validations.map((v) =>
      v.id === recordId
        ? { ...v, fields: v.fields.map((f) => (f.id === field.id ? { ...field, status: "validated" } : f)) }
        : v,
    );
    return ok(validations.find((v) => v.id === recordId)!);
  },
  approve: (recordId) => {
    validations = validations.map((v) =>
      v.id === recordId ? { ...v, fields: v.fields.map((f) => ({ ...f, status: "validated" as const })) } : v,
    );
    return ok(validations.find((v) => v.id === recordId)!);
  },
};

// ── Query / Topics chat (answers computed by the knowledge engine) ─────────────
function buildReply(question: string): ChatMessage {
  const a = answerQuestion(question);
  return { id: nextId("msg"), role: "assistant", content: a.content, createdAt: iso(0), citations: a.citations, evidence: a.evidence };
}

let queryThreads: ChatThread[] = [
  {
    id: "qt-1", title: "Dispatch vs targets, FY26", updatedAt: iso(-120),
    messages: [
      { id: "m-1", role: "user", content: "How is coal dispatch tracking against targets this year?", createdAt: iso(-125), citations: [] },
      buildReply("How is coal dispatch tracking against targets this year?"),
    ],
  },
  { id: "qt-2", title: "Environmental clearances status", updatedAt: iso(-900), messages: [] },
];

let topicThreads: ChatThread[] = [
  { id: "tt-1", title: "Emerging safety themes", updatedAt: iso(-300), messages: [] },
];

function chatRepo(store: () => ChatThread[], set: (t: ChatThread[]) => void) {
  return {
    threads: () => ok([...store()]),
    createThread: () => {
      const thread: ChatThread = { id: nextId("thread"), title: "New conversation", updatedAt: iso(0), messages: [] };
      set([thread, ...store()]);
      return ok(thread);
    },
    ask: (threadId: string, question: string) => {
      const reply = buildReply(question);
      set(
        store().map((t) =>
          t.id === threadId
            ? {
                ...t,
                updatedAt: iso(0),
                title: t.messages.length === 0 ? question.slice(0, 48) : t.title,
                messages: [...t.messages, { id: nextId("msg"), role: "user" as const, content: question, createdAt: iso(0), citations: [] }, reply],
              }
            : t,
        ),
      );
      return ok(reply);
    },
  };
}

const queryChat = chatRepo(() => queryThreads, (t) => { queryThreads = t; });
const topicChat = chatRepo(() => topicThreads, (t) => { topicThreads = t; });

export const queryRepository: QueryRepository = {
  threads: queryChat.threads,
  createThread: queryChat.createThread,
  ask: queryChat.ask,
};

// ── Topics (word cloud + clusters computed from the corpus) ────────────────────
const TERMS: TopicTerm[] = computeTerms();
const CLUSTERS: TopicCluster[] = computeClusters();

export const topicRepository: TopicRepository = {
  terms: () => ok([...TERMS]),
  clusters: () => ok([...CLUSTERS]),
  threads: topicChat.threads,
  createThread: topicChat.createThread,
  ask: topicChat.ask,
};

// ── Reports (documents assembled from the corpus by the engine) ────────────────
function approvalForStatus(status: Report["status"]): ReportEvidence["approval"] {
  if (status === "published") return { state: "frozen", officer: "Meera Nair", at: iso(-1500) };
  if (status === "archived") return { state: "frozen", officer: "Rajesh Kumar", at: iso(-6200) };
  return { state: "draft" };
}

function buildDoc(reportId: string, prompt: string, subsidiary: string, period: string, title: string): ReportDocument {
  const { content, evidence } = assembleReport(prompt, subsidiary, period, title);
  return { reportId, prompt, content, updatedAt: iso(0), evidence };
}

function seedDoc(report: Report): ReportDocument {
  const doc = buildDoc(report.id, report.title, report.subsidiary, "FY 2025-26", report.title);
  const approval = approvalForStatus(report.status);
  return {
    ...doc,
    evidence: doc.evidence ? { ...doc.evidence, approval, assayGatesPassed: approval.state === "draft" ? 6 : 7 } : undefined,
  };
}

let reportTemplates: ReportTemplate[] = [
  { id: "tpl-1", name: "Parliamentary Question Response", category: "Parliamentary", description: "Structured reply with claim-to-source traceability for Lok Sabha / Rajya Sabha questions.", updatedAt: iso(-4000), usageCount: 214, isDefault: true, fileKey: "tpl-1.docx", fileSizeBytes: 48_221, hasFile: true, sections: [
    { id: "s-1", title: "Question & Context", enabled: true, description: "Restate the tabled question and reference number." },
    { id: "s-2", title: "Response", enabled: true, description: "Point-wise answer with figures." },
    { id: "s-3", title: "Source Annexure", enabled: true, description: "Every figure traced to document and page." },
  ] },
  { id: "tpl-2", name: "Monthly Production Return", category: "Operational", description: "Subsidiary-wise production, dispatch and stock position.", updatedAt: iso(-2000), usageCount: 512, isDefault: false, fileKey: "tpl-2.xlsx", fileSizeBytes: 33_004, hasFile: true, sections: [
    { id: "s-1", title: "Production Summary", enabled: true, description: "MT by subsidiary and grade." },
    { id: "s-2", title: "Dispatch & Stock", enabled: true, description: "Rail, road and MGR movement." },
    { id: "s-3", title: "Variance Notes", enabled: false, description: "Commentary on target variance." },
  ] },
  { id: "tpl-3", name: "Environmental Compliance Digest", category: "Environmental", description: "Clearance status, monitoring and closure obligations.", updatedAt: iso(-6000), usageCount: 96, isDefault: false, fileKey: null, fileSizeBytes: 0, hasFile: false, sections: [
    { id: "s-1", title: "Clearance Register", enabled: true, description: "EC numbers and validity." },
    { id: "s-2", title: "Monitoring Results", enabled: true, description: "Air, water and noise." },
  ] },
  { id: "tpl-4", name: "Executive Policy Brief", category: "Financial", description: "One-page brief for ministry review with charts.", updatedAt: iso(-1200), usageCount: 143, isDefault: false, fileKey: "tpl-4.docx", fileSizeBytes: 51_770, hasFile: true, sections: [
    { id: "s-1", title: "Headline Metrics", enabled: true, description: "KPIs at a glance." },
    { id: "s-2", title: "Trend Analysis", enabled: true, description: "Charts and commentary." },
    { id: "s-3", title: "Recommendations", enabled: true, description: "Policy options." },
  ] },
];

let reports: Report[] = [
  { id: "rpt-1", title: "Coal Production Return — August 2026", templateId: "tpl-2", templateName: "Monthly Production Return", status: "published", version: 3, subsidiary: "All subsidiaries", createdBy: "Rajesh Kumar", createdAt: iso(-4300), updatedAt: iso(-1500), pageCount: 12, formats: ["PDF", "XLSX"], shareUrl: null, shareExpiresAt: null },
  { id: "rpt-2", title: "PQ 2418 — Rehabilitation Progress in Jharia", templateId: "tpl-1", templateName: "Parliamentary Question Response", status: "published", version: 2, subsidiary: "BCCL", createdBy: "Vikram Singh", createdAt: iso(-2600), updatedAt: iso(-900), pageCount: 6, formats: ["PDF", "DOCX"], shareUrl: null, shareExpiresAt: null },
  { id: "rpt-3", title: "Environmental Compliance Digest — Q1 FY26", templateId: "tpl-3", templateName: "Environmental Compliance Digest", status: "draft", version: 1, subsidiary: "MCL", createdBy: "Meera Nair", createdAt: iso(-260), updatedAt: iso(-30), pageCount: 9, formats: ["PDF"], shareUrl: null, shareExpiresAt: null },
  { id: "rpt-4", title: "Executive Policy Brief — Dispatch Trends", templateId: "tpl-4", templateName: "Executive Policy Brief", status: "archived", version: 5, subsidiary: "All subsidiaries", createdBy: "Rajesh Kumar", createdAt: iso(-9000), updatedAt: iso(-6200), pageCount: 3, formats: ["PDF", "DOCX"], shareUrl: null, shareExpiresAt: null },
];

const reportDocs = new Map<string, ReportDocument>(reports.map((r) => [r.id, seedDoc(r)]));

const sharedReports = new Map<string, SharedReport>();

function versionsFor(reportId: string): ReportVersion[] {
  const report = reports.find((r) => r.id === reportId);
  const total = report?.version ?? 1;
  return Array.from({ length: total }, (_, i) => ({
    version: total - i,
    changedBy: i === 0 ? report?.createdBy ?? "System" : "Meera Nair",
    changedAt: iso(-1500 - i * 1440),
    summary: i === 0 ? "Current published version." : `Revision ${total - i}: figures reconciled with validated source fields.`,
  }));
}

function createReport(title: string, templateId: string, subsidiary: string, prompt: string): Report {
  const template = reportTemplates.find((t) => t.id === templateId) ?? reportTemplates[0];
  const report: Report = {
    id: nextId("rpt"), title, templateId: template.id, templateName: template.name, status: "draft", version: 1,
    subsidiary, createdBy: "You", createdAt: iso(0), updatedAt: iso(0), pageCount: 8, formats: ["PDF", "DOCX"],
    shareUrl: null, shareExpiresAt: null,
  };
  reports = [report, ...reports];
  reportDocs.set(report.id, buildDoc(report.id, prompt, subsidiary, "FY 2025-26", title));
  return report;
}

export const reportRepository: ReportRepository = {
  list: () => ok([...reports]),
  templates: () => ok([...reportTemplates]),
  saveTemplate: (template) => {
    reportTemplates = reportTemplates.some((t) => t.id === template.id)
      ? reportTemplates.map((t) => (t.id === template.id ? template : t))
      : [...reportTemplates, template];
    return ok(template);
  },
  templateFileBlob: (templateId) => {
    const template = reportTemplates.find((t) => t.id === templateId);
    return ok(new Blob([`BHUMI demo template file for ${template?.name ?? templateId}.`], { type: "application/octet-stream" }));
  },
  versions: (reportId) => ok(versionsFor(reportId)),
  generate: (config: ReportWizardConfig) => ok(createReport(config.title || "Untitled Report", config.templateId, config.subsidiary, config.title)),
  draft: (request: ReportDraftRequest) => ok(createReport(request.prompt.slice(0, 60) || "AI Draft Report", request.templateId, request.subsidiary, request.prompt)),
  getDocument: (reportId) => ok(reportDocs.get(reportId) ?? buildDoc(reportId, "", "All subsidiaries", "FY 2025-26", "Report")),
  saveDocument: (reportId, content) => {
    const prev = reportDocs.get(reportId);
    const doc: ReportDocument = { reportId, prompt: prev?.prompt ?? "", content, updatedAt: iso(0), evidence: prev?.evidence };
    reportDocs.set(reportId, doc);
    reports = reports.map((r) => (r.id === reportId ? { ...r, updatedAt: iso(0) } : r));
    return ok(doc);
  },
  exportBlob: (reportId, format) => {
    const report = reports.find((r) => r.id === reportId);
    const type = format === "pdf" ? "application/pdf" : "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return ok(new Blob([`BHUMI demo export of "${report?.title ?? reportId}" (${format.toUpperCase()}).`], { type }));
  },
  createShareLink: (reportId, expiresInDays) => {
    const token = nextId("share");
    const report = reports.find((r) => r.id === reportId);
    const doc = reportDocs.get(reportId);
    const expiresAt = iso(expiresInDays * 24 * 60);
    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/shared/reports/${token}` : `/shared/reports/${token}`;
    if (report) {
      sharedReports.set(token, { title: report.title, templateName: report.templateName, subsidiary: report.subsidiary, createdBy: report.createdBy, updatedAt: iso(0), content: doc?.content ?? buildDoc(reportId, report.title, report.subsidiary, "FY 2025-26", report.title).content });
      reports = reports.map((r) => (r.id === reportId ? { ...r, shareUrl, shareExpiresAt: expiresAt } : r));
    }
    return ok({ shareUrl, expiresAt });
  },
  revokeShareLink: (reportId) => {
    reports = reports.map((r) => (r.id === reportId ? { ...r, shareUrl: null, shareExpiresAt: null } : r));
    return ok(undefined);
  },
  getSharedReport: (token) =>
    ok(
      sharedReports.get(token) ?? {
        title: "Coal Production Return — August 2026", templateName: "Monthly Production Return", subsidiary: "All subsidiaries",
        createdBy: "Rajesh Kumar", updatedAt: iso(-1500), content: buildDoc("rpt-1", "Coal Production Return", "All subsidiaries", "FY 2025-26", "Coal Production Return — August 2026").content,
      },
    ),
};

// ── Parliamentary ─────────────────────────────────────────────────────────────
const STAGE_ORDER: QueryStage[] = ["received", "assigned", "drafting", "review", "answered"];
let parliamentary: ParliamentaryQuery[] = [
  { id: "pq-1", referenceNo: "LS-2418", subject: "Rehabilitation progress for displaced families in Jharia coalfield", house: "Lok Sabha", memberName: "Shri A. Mahato", priority: "critical", stage: "review", receivedAt: iso(-8000), dueAt: iso(2880), assignedTo: "Vikram Singh", subsidiary: "BCCL", linkedReportIds: ["rpt-2"] },
  { id: "pq-2", referenceNo: "RS-1190", subject: "Coal production and dispatch targets for FY 2025-26", house: "Rajya Sabha", memberName: "Dr. S. Iyer", priority: "high", stage: "drafting", receivedAt: iso(-5000), dueAt: iso(5760), assignedTo: "Rajesh Kumar", subsidiary: "All subsidiaries", linkedReportIds: ["rpt-1"] },
  { id: "pq-3", referenceNo: "LS-2455", subject: "Status of environmental clearances for opencast projects", house: "Lok Sabha", memberName: "Smt. R. Devi", priority: "normal", stage: "assigned", receivedAt: iso(-2000), dueAt: iso(11520), assignedTo: "Meera Nair", subsidiary: "MCL", linkedReportIds: [] },
  { id: "pq-4", referenceNo: "RS-1205", subject: "Safety incidents and audit compliance in underground mines", house: "Rajya Sabha", memberName: "Shri K. Reddy", priority: "high", stage: "received", receivedAt: iso(-200), dueAt: iso(14400), assignedTo: "Unassigned", subsidiary: "NCL", linkedReportIds: [] },
  { id: "pq-5", referenceNo: "LS-2390", subject: "Washery capacity utilisation across subsidiaries", house: "Lok Sabha", memberName: "Shri P. Nayak", priority: "normal", stage: "answered", receivedAt: iso(-14000), dueAt: iso(-2880), assignedTo: "Rajesh Kumar", subsidiary: "CCL", linkedReportIds: ["rpt-4"] },
];

export const parliamentaryRepository: ParliamentaryRepository = {
  list: () => ok([...parliamentary]),
  advanceStage: (id) => {
    parliamentary = parliamentary.map((q) => {
      if (q.id !== id) return q;
      const next = STAGE_ORDER[Math.min(STAGE_ORDER.indexOf(q.stage) + 1, STAGE_ORDER.length - 1)];
      return { ...q, stage: next };
    });
    return ok(parliamentary.find((q) => q.id === id)!);
  },
};

// ── Analytics ─────────────────────────────────────────────────────────────────
const dashboard: DashboardSnapshot = {
  kpis: [
    { id: "k-1", label: "Documents Indexed", value: "18,942", rawValue: 18942, delta: 4.2, unit: "", trend: "up", helpText: "Total documents digitised and query-ready." },
    { id: "k-2", label: "Extraction Accuracy", value: "94.7%", rawValue: 94.7, delta: 1.1, unit: "%", trend: "up", helpText: "Field-level accuracy on validated documents." },
    { id: "k-3", label: "Pending Validation", value: "1,986", rawValue: 1986, delta: -6.4, unit: "", trend: "down", helpText: "Extracted fields awaiting human review." },
    { id: "k-4", label: "Reports Generated", value: "2,314", rawValue: 2314, delta: 8.9, unit: "", trend: "up", helpText: "Reports produced this financial year." },
    { id: "k-5", label: "Avg Query Response", value: "1.8s", rawValue: 1.8, delta: -12.0, unit: "s", trend: "down", helpText: "Median AI query latency." },
    { id: "k-6", label: "Open PQ Deadlines", value: "23", rawValue: 23, delta: 2.0, unit: "", trend: "up", helpText: "Parliamentary questions awaiting response." },
  ],
  timeSeries: [
    { period: "Mar", reports: 142, queries: 980, documents: 1210 },
    { period: "Apr", reports: 168, queries: 1120, documents: 1440 },
    { period: "May", reports: 155, queries: 1290, documents: 1370 },
    { period: "Jun", reports: 189, queries: 1510, documents: 1620 },
    { period: "Jul", reports: 204, queries: 1740, documents: 1810 },
    { period: "Aug", reports: 231, queries: 1980, documents: 2020 },
  ],
  categories: [
    { name: "Production", value: 34 }, { name: "Environmental", value: 24 }, { name: "Safety", value: 18 },
    { name: "Financial", value: 14 }, { name: "Social", value: 10 },
  ],
  performance: SUBS.map((s, i) => {
    const production = [167, 34, 79, 131, 61, 172, 152, 9][i];
    const target = [170, 40, 82, 140, 64, 175, 150, 11][i];
    return {
      subsidiary: s, production, target,
      accuracy: 0.9 + ((i * 7) % 9) / 100,
      reports: 40 + ((i * 13) % 60),
      pendingQueries: (i * 3 + 2) % 9,
      variance: Number((((production - target) / target) * 100).toFixed(1)),
    };
  }),
  activity: [
    { id: "a-1", actor: "Meera Nair", action: "validated", target: "SECL-Gevra-Production-Return-FY25.pdf", createdAt: iso(-30), kind: "validation" },
    { id: "a-2", actor: "Rajesh Kumar", action: "generated", target: "Coal Production Return — August 2026", createdAt: iso(-90), kind: "report" },
    { id: "a-3", actor: "Arun Das", action: "uploaded", target: "NCL-Amlohri-Safety-Audit-scan.tiff", createdAt: iso(-40), kind: "upload" },
    { id: "a-4", actor: "Vikram Singh", action: "answered PQ", target: "LS-2390", createdAt: iso(-160), kind: "query" },
    { id: "a-5", actor: "System", action: "reindexed", target: "knowledge graph (18,942 docs)", createdAt: iso(-300), kind: "system" },
    { id: "a-6", actor: "Priya Sharma", action: "uploaded", target: "BCCL-Rehabilitation-Progress.docx", createdAt: iso(-320), kind: "upload" },
  ],
  pipeline: [
    { stage: "Ingestion", count: 18942, share: 100 },
    { stage: "OCR / Digitization", count: 18510, share: 97.7 },
    { stage: "Table Extraction", count: 17720, share: 93.5 },
    { stage: "Entity Recognition", count: 17240, share: 91.0 },
    { stage: "Indexing", count: 16956, share: 89.5 },
  ],
  heatmap: Array.from({ length: 7 }, (_, d) =>
    Array.from({ length: 6 }, (_, h) => ({ day: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][d], hour: 9 + h * 2, value: ((d * 7 + h * 3) % 10) + (h === 2 ? 6 : 1) })),
  ).flat(),
  accuracyTrend: [
    { period: "Mar", accuracy: 91.2, humanCorrections: 412 },
    { period: "Apr", accuracy: 92.0, humanCorrections: 388 },
    { period: "May", accuracy: 92.8, humanCorrections: 351 },
    { period: "Jun", accuracy: 93.5, humanCorrections: 322 },
    { period: "Jul", accuracy: 94.1, humanCorrections: 297 },
    { period: "Aug", accuracy: 94.7, humanCorrections: 268 },
  ],
  storage: [
    { kind: "PDF", documents: 11200, sizeGb: 214.5 },
    { kind: "Scans", documents: 4100, sizeGb: 402.2 },
    { kind: "Spreadsheets", documents: 2300, sizeGb: 18.7 },
    { kind: "Documents", documents: 980, sizeGb: 9.1 },
    { kind: "Images", documents: 362, sizeGb: 41.3 },
  ],
  topQueries: [
    { id: "tq-1", question: "Dispatch vs targets by subsidiary, FY26", askedBy: "Rajesh Kumar", askedAt: iso(-120), citationCount: 6, responseMs: 1640 },
    { id: "tq-2", question: "Which mines have EC expiring in 2026?", askedBy: "Meera Nair", askedAt: iso(-260), citationCount: 4, responseMs: 2010 },
    { id: "tq-3", question: "Rehabilitation beneficiaries in BCCL", askedBy: "Vikram Singh", askedAt: iso(-420), citationCount: 3, responseMs: 1490 },
    { id: "tq-4", question: "Safety incidents in underground mines", askedBy: "Arun Das", askedAt: iso(-900), citationCount: 5, responseMs: 1880 },
  ],
  deadlines: [
    { id: "d-1", referenceNo: "LS-2418", subject: "Rehabilitation progress in Jharia", dueAt: iso(2880), priority: "critical", assignedTo: "Vikram Singh" },
    { id: "d-2", referenceNo: "RS-1190", subject: "Production & dispatch targets FY26", dueAt: iso(5760), priority: "high", assignedTo: "Rajesh Kumar" },
    { id: "d-3", referenceNo: "LS-2455", subject: "Environmental clearances status", dueAt: iso(11520), priority: "normal", assignedTo: "Meera Nair" },
  ],
  health: { ocrQueueDepth: 2, avgLatencyMs: 1800, uptimePercent: 99.95, indexFreshnessMin: 7, activeUsers: 34, storageUsedGb: 685.8, storageTotalGb: 2048 },
  topTerms: TERMS.map((t) => ({ text: t.text, weight: t.weight })),
};

export const analyticsRepository: AnalyticsRepository = {
  kpis: () => ok(dashboard.kpis),
  timeSeries: () => ok(dashboard.timeSeries),
  categoryBreakdown: () => ok(dashboard.categories),
  subsidiaryPerformance: () => ok(dashboard.performance),
  activity: () => ok(dashboard.activity),
  dashboard: () => ok(dashboard),
};

// ── Users ─────────────────────────────────────────────────────────────────────
let users: User[] = [
  { id: "u-1001", name: "Ananya Rao", email: "ananya.rao@coal.gov.in", role: "Administrator", appRole: "admin", subsidiary: "CIL HQ", designation: "Platform Administrator", status: "active", lastActive: iso(-5), createdAt: "2025-04-01T09:00:00.000Z" },
  { id: "u-1002", name: "Rajesh Kumar", email: "rajesh.kumar@coal.gov.in", role: "Analyst", appRole: "ministry", subsidiary: "Ministry of Coal", designation: "Policy & Monitoring Officer", status: "active", lastActive: iso(-40), createdAt: "2025-04-12T09:00:00.000Z" },
  { id: "u-1003", name: "Meera Nair", email: "meera.nair@coal.gov.in", role: "Reviewer", appRole: "domain-officer", subsidiary: "CMPDI", designation: "Domain Officer", status: "active", lastActive: iso(-30), createdAt: "2025-05-02T09:00:00.000Z" },
  { id: "u-1004", name: "Vikram Singh", email: "vikram.singh@coal.gov.in", role: "Analyst", appRole: "parliamentary", subsidiary: "CIL HQ", designation: "Parliamentary Response", status: "active", lastActive: iso(-160), createdAt: "2025-05-19T09:00:00.000Z" },
  { id: "u-1005", name: "Priya Sharma", email: "priya.sharma@coal.gov.in", role: "Viewer", appRole: "ministry", subsidiary: "Ministry of Coal", designation: "Monitoring Assistant", status: "invited", lastActive: iso(-4000), createdAt: "2026-08-10T09:00:00.000Z" },
  { id: "u-1006", name: "Arun Das", email: "arun.das@coal.gov.in", role: "Reviewer", appRole: "domain-officer", subsidiary: "ECL", designation: "Field Officer", status: "suspended", lastActive: iso(-20000), createdAt: "2025-06-30T09:00:00.000Z" },
];

export const userRepository: UserRepository = {
  list: () => ok([...users]),
  updateRole: (id, role) => {
    users = users.map((u) => (u.id === id ? { ...u, role } : u));
    return ok(users.find((u) => u.id === id)!);
  },
  setStatus: (id, status) => {
    users = users.map((u) => (u.id === id ? { ...u, status } : u));
    return ok(users.find((u) => u.id === id)!);
  },
};

// ── Audit ─────────────────────────────────────────────────────────────────────
const audit: AuditEntry[] = [
  { id: "au-1", timestamp: iso(-30), actor: "Meera Nair", actorRole: "Reviewer", action: "VALIDATE_FIELD", resource: "Document", resourceId: "doc-1", ipAddress: "10.12.4.21", outcome: "success", details: "Validated 'Coal Grade' field." },
  { id: "au-2", timestamp: iso(-90), actor: "Rajesh Kumar", actorRole: "Analyst", action: "GENERATE_REPORT", resource: "Report", resourceId: "rpt-1", ipAddress: "10.12.4.55", outcome: "success", details: "Generated monthly production return." },
  { id: "au-3", timestamp: iso(-140), actor: "Unknown", actorRole: "—", action: "SIGN_IN", resource: "Auth", resourceId: "session", ipAddress: "203.0.113.9", outcome: "failure", details: "Invalid credentials (3rd attempt)." },
  { id: "au-4", timestamp: iso(-300), actor: "System", actorRole: "System", action: "REINDEX", resource: "KnowledgeGraph", resourceId: "graph", ipAddress: "127.0.0.1", outcome: "success", details: "Reindexed 18,942 documents." },
  { id: "au-5", timestamp: iso(-520), actor: "Ananya Rao", actorRole: "Administrator", action: "UPDATE_ROLE", resource: "User", resourceId: "u-1005", ipAddress: "10.12.4.2", outcome: "success", details: "Set Priya Sharma to Viewer." },
  { id: "au-6", timestamp: iso(-800), actor: "Arun Das", actorRole: "Reviewer", action: "UPLOAD", resource: "Document", resourceId: "doc-6", ipAddress: "10.20.1.7", outcome: "warning", details: "Upload accepted with low OCR confidence." },
  { id: "au-7", timestamp: iso(-1300), actor: "Vikram Singh", actorRole: "Analyst", action: "SHARE_REPORT", resource: "Report", resourceId: "rpt-2", ipAddress: "10.12.4.61", outcome: "success", details: "Created 7-day share link." },
];

export const auditRepository: AuditRepository = { list: () => ok([...audit]) };

// ── Integrations ────────────────────────────────────────────────────────────
let integrations: Integration[] = [
  { id: "int-1", name: "Coalnet ERP", subsidiary: "All subsidiaries", description: "Production and dispatch master data.", status: "connected", endpoint: "https://coalnet.cil.internal/api", lastSyncAt: iso(-15), recordsSynced: 128_400, syncIntervalMinutes: 60 },
  { id: "int-2", name: "MDMS Dispatch Feed", subsidiary: "SECL", description: "Mine dispatch monitoring system.", status: "connected", endpoint: "https://mdms.secl.internal", lastSyncAt: iso(-45), recordsSynced: 44_120, syncIntervalMinutes: 30 },
  { id: "int-3", name: "PARIVESH EC Portal", subsidiary: "All subsidiaries", description: "Environmental clearance status.", status: "degraded", endpoint: "https://parivesh.nic.in/api", lastSyncAt: iso(-620), recordsSynced: 9_880, syncIntervalMinutes: 720 },
  { id: "int-4", name: "e-Office DMS", subsidiary: "CIL HQ", description: "File and correspondence management.", status: "connected", endpoint: "https://eoffice.cil.internal", lastSyncAt: iso(-120), recordsSynced: 61_540, syncIntervalMinutes: 120 },
  { id: "int-5", name: "Legacy Records FTP", subsidiary: "BCCL", description: "Scanned archive drop.", status: "disconnected", endpoint: "ftp://records.bccl.internal", lastSyncAt: iso(-8000), recordsSynced: 2_014, syncIntervalMinutes: 1440 },
];

export const integrationRepository: IntegrationRepository = {
  list: () => ok([...integrations]),
  sync: (id) => {
    integrations = integrations.map((i) => (i.id === id ? { ...i, status: "connected", lastSyncAt: iso(0), recordsSynced: i.recordsSynced + 128 } : i));
    return ok(integrations.find((i) => i.id === id)!);
  },
};

// ── Notifications ──────────────────────────────────────────────────────────────
let notifications: AppNotification[] = [
  { id: "n-1", title: "PQ LS-2418 due in 48 hours", body: "Rehabilitation progress in Jharia — review stage. Assigned to Vikram Singh.", severity: "critical", createdAt: iso(-25), read: false, source: "Parliamentary", link: "/parliamentary" },
  { id: "n-2", title: "OCR confidence low", body: "ECL-Rajmahal-Overburden-photo.jpg fell below threshold. Re-upload recommended.", severity: "warning", createdAt: iso(-95), read: false, source: "Processing", link: "/processing" },
  { id: "n-3", title: "Report published", body: "Coal Production Return — August 2026 is now published.", severity: "success", createdAt: iso(-90), read: false, source: "Reports", link: "/reports" },
  { id: "n-4", title: "PARIVESH sync degraded", body: "Environmental clearance feed is responding slowly.", severity: "warning", createdAt: iso(-620), read: true, source: "Integrations", link: "/settings" },
  { id: "n-5", title: "Knowledge graph reindexed", body: "18,942 documents reindexed successfully.", severity: "info", createdAt: iso(-300), read: true, source: "System" },
];

export const notificationRepository: NotificationRepository = {
  list: () => ok([...notifications]),
  markRead: (id) => {
    notifications = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    return ok([...notifications]);
  },
  markAllRead: () => {
    notifications = notifications.map((n) => ({ ...n, read: true }));
    return ok([...notifications]);
  },
};

// ── Help ──────────────────────────────────────────────────────────────────────
const helpResources: HelpResource[] = [
  { id: "h-1", title: "Getting started with BHUMI", description: "A 6-minute tour of upload, validation and reporting.", kind: "video", category: "Onboarding", duration: "6 min", updatedAt: iso(-4000) },
  { id: "h-2", title: "Validating extracted fields", description: "How to review, correct and approve OCR output.", kind: "guide", category: "Validation", duration: "8 min read", updatedAt: iso(-2600) },
  { id: "h-3", title: "Drafting a parliamentary reply", description: "Use templates with claim-to-source traceability.", kind: "guide", category: "Reporting", duration: "10 min read", updatedAt: iso(-1500) },
  { id: "h-4", title: "AI query best practices", description: "Ask precise questions and read citations.", kind: "guide", category: "Query", duration: "5 min read", updatedAt: iso(-900) },
  { id: "h-5", title: "Data handling & security policy", description: "Classification and retention rules (PDF).", kind: "download", category: "Policy", duration: "PDF · 1.2 MB", updatedAt: iso(-6000) },
  { id: "h-6", title: "Keyboard shortcuts", description: "Move faster across the workspace.", kind: "faq", category: "Productivity", duration: "2 min read", updatedAt: iso(-200) },
];

const faqs: FaqItem[] = [
  { id: "faq-1", question: "Who can create user accounts?", answer: "Only Administrators. There is no self-registration — every credential is provisioned centrally.", category: "Access" },
  { id: "faq-2", question: "Why is a field flagged for validation?", answer: "Extraction confidence fell below the threshold, so a human reviewer confirms or corrects the value before it is published.", category: "Validation" },
  { id: "faq-3", question: "How are report figures traced to sources?", answer: "Every figure links back to the source document and page, shown in the report's source annexure.", category: "Reporting" },
  { id: "faq-4", question: "Which languages does the voice assistant support?", answer: "The 22 Eighth-Schedule languages plus English, via speech-to-text and text-to-speech.", category: "Query" },
  { id: "faq-5", question: "Is my data sent outside government systems?", answer: "In production, documents stay within the configured object store and databases. This demo runs entirely in your browser.", category: "Security" },
];

export const helpRepository: HelpRepository = {
  resources: () => ok([...helpResources]),
  faqs: () => ok([...faqs]),
};

// ── Graph ─────────────────────────────────────────────────────────────────────
function buildGraph(): KnowledgeGraph {
  const nodes: KnowledgeGraph["nodes"] = [];
  const edges: KnowledgeGraph["edges"] = [];
  SUBS.forEach((s) => nodes.push({ id: `sub-${s}`, kind: "Subsidiary", label: s, properties: { type: "Subsidiary" } }));
  const mines: [string, string][] = [["Gevra", "SECL"], ["Talcher", "MCL"], ["Amlohri", "NCL"], ["Jharia", "BCCL"], ["Rajmahal", "ECL"], ["Korba", "SECL"]];
  mines.forEach(([mine, sub], i) => {
    const id = `mine-${i}`;
    nodes.push({ id, kind: "Mine", label: mine, properties: { subsidiary: sub, type: "Opencast" } });
    edges.push({ id: `e-m-${i}`, source: id, target: `sub-${sub}`, type: "BELONGS_TO" });
  });
  documents.slice(0, 6).forEach((doc, i) => {
    const id = `gdoc-${i}`;
    nodes.push({ id, kind: "Document", label: doc.name.slice(0, 22), properties: { subsidiary: doc.subsidiary, pages: String(doc.pageCount) } });
    edges.push({ id: `e-d-${i}`, source: id, target: `sub-${doc.subsidiary}`, type: "REFERENCES" });
  });
  return { nodes, edges };
}

export const graphRepository: GraphRepository = { knowledgeGraph: () => ok(buildGraph()) };

const previewBrief: BrainBrief = {
  graph: "preview",
  counts: { Person: 5, Team: 5, Project: 4, Document: 4, Decision: 3, Ticket: 2, Chat: 1 },
  centralPeople: [
    { name: "Meera Iyer", role: "CMPDI domain lead", connections: 6 },
    { name: "Ananya Rao", role: "Joint Secretary, Policy", connections: 5 },
  ],
  recentDecisions: [
    {
      title: "Hold the Gevra dispatch brief until the annexure is validated",
      decidedOn: "2026-07-18",
      summary: "The production brief waits on the Q1 annexure passing validation.",
    },
  ],
};

export const brainRepository: BrainRepository = {
  brief: () => ok(previewBrief),
  ask: (question) => ok(demoBrainAnswer(question)),
  record: (fact: BrainFact) => ok({ id: nextId("fact"), title: fact.title }),
};

// ── Voice ─────────────────────────────────────────────────────────────────────
export const voiceRepository: VoiceRepository = {
  transcribe: (_audio: Blob, languageCode: string): Promise<Transcription> =>
    ok({ transcript: "Show me coal dispatch against targets for this year.", languageCode }),
  speak: (_text: string, _languageCode: string): Promise<Blob> => ok(new Blob([], { type: "audio/mpeg" })),
};
