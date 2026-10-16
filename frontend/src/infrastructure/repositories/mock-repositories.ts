import type {
  AuthRepository, DocumentRepository, ValidationRepository, QueryRepository,
  ReportRepository, TopicRepository, ParliamentaryRepository, AnalyticsRepository,
  UserRepository, AuditRepository, IntegrationRepository, NotificationRepository,
  HelpRepository,
} from "@/src/domain/repositories";
import type { IngestedDocument } from "@/src/domain/entities/document";
import type { ChatMessage, ChatThread } from "@/src/domain/entities/query";
import type { Report, ReportVersion, ReportWizardConfig } from "@/src/domain/entities/report";
import type { QueryStage } from "@/src/domain/entities/parliamentary";
import type { User } from "@/src/domain/entities/user";
import type { Integration } from "@/src/domain/entities/integration";
import type { AppNotification } from "@/src/domain/entities/notification";
import * as fixtures from "../mock/data";
import { delay, isoDaysAgo } from "../mock/seed";

// in-memory stores so mutations survive within a session
let documents = [...fixtures.DOCUMENTS];
let validations = fixtures.VALIDATION_RECORDS.map((r) => ({ ...r, fields: [...r.fields] }));
let threads = fixtures.CHAT_THREADS.map((t) => ({ ...t, messages: [...t.messages] }));
let reports = [...fixtures.REPORTS];
let templates = fixtures.TEMPLATES.map((t) => ({ ...t, sections: [...t.sections] }));
let parliamentary = [...fixtures.PARLIAMENTARY_QUERIES];
let users = [...fixtures.USERS];
let integrations = [...fixtures.INTEGRATIONS];
let notifications = [...fixtures.NOTIFICATIONS];

const KIND_BY_EXT: Record<string, IngestedDocument["kind"]> = {
  pdf: "pdf", xlsx: "spreadsheet", xls: "spreadsheet", csv: "spreadsheet",
  docx: "docx", doc: "docx", jpg: "image", jpeg: "image", png: "image", tiff: "image",
};

export const authRepository: AuthRepository = {
  async signIn({ employeeId }) {
    return delay({
      user: { ...fixtures.CURRENT_USER, email: `${employeeId.toLowerCase()}@bhumi.gov.in` },
      token: `mock-jwt-${employeeId}`,
      issuedAt: new Date().toISOString(),
    }, 700);
  },
  async signOut() {
    return delay(undefined, 200);
  },
  async currentSession() {
    return delay({
      user: fixtures.CURRENT_USER,
      token: "mock-jwt-session",
      issuedAt: new Date().toISOString(),
    });
  },
};

export const documentRepository: DocumentRepository = {
  async list() {
    return delay(documents);
  },
  async upload(files) {
    const created: IngestedDocument[] = files.map((file, i) => ({
      id: `doc-new-${Date.now()}-${i}`,
      name: file.name,
      kind: KIND_BY_EXT[file.name.split(".").pop()?.toLowerCase() ?? ""] ?? "pdf",
      sizeBytes: file.sizeBytes,
      status: "uploading",
      progress: 0,
      subsidiary: fixtures.CURRENT_USER.subsidiary,
      uploadedBy: fixtures.CURRENT_USER.name,
      uploadedAt: new Date().toISOString(),
      pageCount: 0,
      confidence: 0,
    }));
    documents = [...created, ...documents];
    return delay(created, 180);
  },
  async retry(id) {
    documents = documents.map((d) =>
      d.id === id ? { ...d, status: "processing", progress: 12, errorMessage: undefined } : d,
    );
    return delay(documents.find((d) => d.id === id)!, 400);
  },
  async remove(id) {
    documents = documents.filter((d) => d.id !== id);
    return delay(undefined, 250);
  },
  async jobs() {
    return delay(fixtures.JOBS);
  },
};

export const validationRepository: ValidationRepository = {
  async list() {
    return delay(validations);
  },
  async byId(id) {
    return delay(validations.find((r) => r.id === id) ?? null);
  },
  async saveField(recordId, field) {
    validations = validations.map((record) =>
      record.id !== recordId
        ? record
        : {
            ...record,
            fields: record.fields.map((f) =>
              f.id === field.id ? { ...field, status: "validated" as const } : f,
            ),
          },
    );
    return delay(validations.find((r) => r.id === recordId)!, 260);
  },
  async approve(recordId) {
    validations = validations.map((record) =>
      record.id !== recordId
        ? record
        : {
            ...record,
            fields: record.fields.map((f) => ({ ...f, status: "validated" as const })),
          },
    );
    return delay(validations.find((r) => r.id === recordId)!, 380);
  },
};

const ANSWER_LIBRARY: { match: RegExp; body: string; citations: ChatMessage["citations"] }[] = [
  {
    match: /overburden|stripping/i,
    body: "Overburden removal across opencast operations totalled 2,184 Mm³ in H1 FY 2025-26, an increase of 6.2% year on year. Gevra (SECL) led with 384 Mm³, followed by Talcher (MCL) at 316 Mm³ and Nigahi (NCL) at 274 Mm³.\n\nThe rise reflects deeper working horizons rather than expanded output — the average stripping ratio moved from 3.42 to 3.71 m³ per tonne. Three projects exceeded their sanctioned ratio: Rajmahal (ECL) at 4.28, Kusmunda (SECL) at 4.11 and Bharatpur (MCL) at 3.96, each of which carries a cost-per-tonne implication flagged in the operational review.",
    citations: [
      { id: "c-ob-1", documentName: "Overburden-Removal-Q2-Statement.xlsx", page: 2, snippet: "Total OB removal H1 FY26: 2,184 Mm³ against 2,057 Mm³ in H1 FY25 (+6.2%).", relevance: 0.97 },
      { id: "c-ob-2", documentName: "Overburden-Removal-Efficiency-Analysis.pdf", page: 11, snippet: "Rajmahal stripping ratio of 4.28 m³/t exceeds the sanctioned project ratio of 3.90 m³/t.", relevance: 0.89 },
    ],
  },
  {
    match: /environment|clearance|compliance/i,
    body: "There are 14 environmental clearance matters currently open across subsidiaries.\n\nSix are pending grant with the MoEFCC — four expansion proposals (Kusmunda, Dipka, Bharatpur, Amlohri) and two greenfield projects in the Talcher coalfield. Five relate to compliance conditions under existing clearances, principally afforestation shortfalls in WCL and ambient air quality exceedances recorded at two SECL sites during the pre-monsoon monitoring cycle. The remaining three are appeals before the National Green Tribunal concerning land use in the Jharia master plan area.\n\nThe longest-pending item is the Talcher greenfield proposal, filed 27 months ago and awaiting a final public hearing outcome.",
    citations: [
      { id: "c-env-1", documentName: "Environmental-Clearance-Talcher-2019.pdf", page: 6, snippet: "Public hearing for the proposed expansion remains pending as of the reporting date.", relevance: 0.94 },
      { id: "c-env-2", documentName: "Mine-Closure-Plan-Sohagpur-Scan.pdf", page: 19, snippet: "Afforestation achieved 62% of the committed 480 hectares under clearance condition 7(b).", relevance: 0.86 },
    ],
  },
  {
    match: /washery|throughput|grade|quality/i,
    body: "Washery throughput for the period stood at 38.4 MT against an installed capacity of 46.2 MT, a utilisation of 83.1%.\n\nSECL washeries operated at 88.4% utilisation and MCL at 79.6%. The gap is driven largely by feed availability rather than plant downtime: MCL's Bharatpur washery recorded 214 hours of idle time attributed to raw coal supply interruptions during July.\n\nOn quality, average ash content in washed coal was 33.8%, within the contracted band. However, grade slippage was recorded against 11.4% of despatched consignments — most frequently a single-grade drop from G-9 to G-10, concentrated in ECL's Rajmahal and BCCL's Block-II dispatches.",
    citations: [
      { id: "c-w-1", documentName: "Washery-Throughput-Monthly-Aug.xlsx", page: 1, snippet: "Aggregate throughput 38.4 MT; installed capacity 46.2 MT; utilisation 83.1%.", relevance: 0.95 },
      { id: "c-w-2", documentName: "Coal-Grade-Slippage-Analysis.xlsx", page: 4, snippet: "Grade slippage observed in 11.4% of consignments, predominantly G-9 to G-10.", relevance: 0.92 },
    ],
  },
  {
    match: /safety|accident|incident|ventilation/i,
    body: "Forty-one reportable safety incidents were recorded across CIL operations in H1 FY 2025-26, down from 53 in the corresponding period — a reduction of 22.6%.\n\nUnderground operations accounted for 26 of these despite representing a much smaller share of output, with roof fall and strata control the dominant category at 11 incidents. Opencast incidents were primarily dumper and HEMM-related.\n\nThe Korba area safety audit identified ventilation deficiencies at two underground panels where measured air quantity fell below statutory requirement; both have since been remediated with auxiliary fan installation, confirmed in the follow-up survey.",
    citations: [
      { id: "c-s-1", documentName: "Safety-Audit-Findings-Korba.docx", page: 8, snippet: "Air quantity at panels 3B and 4A measured below the statutory minimum of 6 m³/s per person.", relevance: 0.93 },
      { id: "c-s-2", documentName: "Ventilation-Survey-Underground-Mine-4.pdf", page: 3, snippet: "Post-remediation survey confirms compliance following auxiliary fan installation.", relevance: 0.88 },
    ],
  },
  {
    match: /land|acquisition|rehabilitation|jharia|compensation/i,
    body: "Under the Jharia Master Plan, 12,840 families have been identified for resettlement, of whom 7,412 (57.7%) have been rehabilitated to date.\n\nCompensation totalling ₹2,184 crore has been disbursed. The principal constraint on further progress is title verification: 1,986 cases remain unresolved, largely involving unregistered occupancy and disputed succession claims in the Bhowrah and Katras belts.\n\nConstruction at the Belgaria township is complete for phases I through III (4,200 units), with phase IV of 1,800 units at 68% completion against a revised target date of March 2027.",
    citations: [
      { id: "c-l-1", documentName: "Land-Acquisition-Records-1987-Vol3.pdf", page: 42, snippet: "7,412 of 12,840 identified families rehabilitated; ₹2,184 crore disbursed as compensation.", relevance: 0.96 },
      { id: "c-l-2", documentName: "Rehabilitation-Colony-Layout-Plan.pdf", page: 2, snippet: "Belgaria phase IV: 1,800 units, 68% complete, revised completion March 2027.", relevance: 0.9 },
    ],
  },
];

const FALLBACK_ANSWER = {
  body: "Based on the indexed document corpus, aggregate raw coal production for H1 FY 2025-26 reached 412.7 MT against a target of 417.6 MT, an achievement of 98.8% and a year-on-year improvement of 3.8%.\n\nSECL and MCL together contributed 46% of output. Despatch tracked production closely at 408.2 MT, leaving pithead stock broadly stable.\n\nIf you are looking for something more specific, try narrowing the question to a subsidiary, a time period, or a particular operational metric — the corpus currently spans 18,942 indexed documents.",
  citations: [
    { id: "c-f-1", documentName: "Annual-Coal-Production-Report-FY2025-26.pdf", page: 24, snippet: "Aggregate raw coal production for H1 FY 2025-26 stood at 412.7 MT against a target of 417.6 MT.", relevance: 0.9 },
    { id: "c-f-2", documentName: "Quarterly-Dispatch-Reconciliation.xlsx", page: 3, snippet: "Total despatch 408.2 MT; closing pithead stock 374,420 T.", relevance: 0.82 },
  ],
};

export const queryRepository: QueryRepository = {
  async threads() {
    return delay(threads);
  },
  async createThread() {
    const thread: ChatThread = {
      id: `thr-${Date.now()}`,
      title: "New conversation",
      updatedAt: new Date().toISOString(),
      messages: [],
    };
    threads = [thread, ...threads];
    return delay(thread, 150);
  },
  async ask(threadId, question) {
    const matched = ANSWER_LIBRARY.find((a) => a.match.test(question));
    const answer: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: "assistant",
      content: matched?.body ?? FALLBACK_ANSWER.body,
      createdAt: new Date().toISOString(),
      citations: matched?.citations ?? FALLBACK_ANSWER.citations,
    };
    threads = threads.map((t) =>
      t.id === threadId ? { ...t, updatedAt: answer.createdAt } : t,
    );
    return delay(answer, 1100);
  },
};

export const reportRepository: ReportRepository = {
  async list() {
    return delay(reports);
  },
  async templates() {
    return delay(templates);
  },
  async saveTemplate(template) {
    templates = templates.map((t) => (t.id === template.id ? template : t));
    return delay(template, 300);
  },
  async versions(reportId) {
    const report = reports.find((r) => r.id === reportId);
    const count = report?.version ?? 1;
    const versions: ReportVersion[] = Array.from({ length: count }, (_, i) => ({
      version: count - i,
      changedBy: fixtures.USERS[(i + 2) % fixtures.USERS.length].name,
      changedAt: isoDaysAgo(i * 12 + 2),
      summary:
        i === count - 1
          ? "Initial generation from selected data sources"
          : i === 0
            ? "Updated production figures following validation corrections"
            : "Revised commentary and refreshed charts",
    }));
    return delay(versions);
  },
  async generate(config: ReportWizardConfig) {
    const template = templates.find((t) => t.id === config.templateId);
    const report: Report = {
      id: `rep-${Date.now()}`,
      title: config.title || "Untitled Report",
      templateId: config.templateId,
      templateName: template?.name ?? "Custom",
      status: "published",
      version: 1,
      subsidiary: config.subsidiary,
      createdBy: fixtures.CURRENT_USER.name,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pageCount: 12 + config.dataSourceIds.length * 3,
      formats: [config.format],
    };
    reports = [report, ...reports];
    return delay(report, 1400);
  },
};

export const topicRepository: TopicRepository = {
  async terms() {
    return delay(fixtures.TOPIC_TERMS);
  },
  async clusters() {
    return delay(fixtures.TOPIC_CLUSTERS);
  },
};

const STAGE_ORDER: QueryStage[] = ["received", "assigned", "drafting", "review", "answered"];

export const parliamentaryRepository: ParliamentaryRepository = {
  async list() {
    return delay(parliamentary);
  },
  async advanceStage(id) {
    parliamentary = parliamentary.map((q) => {
      if (q.id !== id) return q;
      const next = STAGE_ORDER[Math.min(STAGE_ORDER.indexOf(q.stage) + 1, STAGE_ORDER.length - 1)];
      return { ...q, stage: next };
    });
    return delay(parliamentary.find((q) => q.id === id)!, 300);
  },
};

export const analyticsRepository: AnalyticsRepository = {
  async kpis() {
    return delay(fixtures.KPIS);
  },
  async timeSeries() {
    return delay(fixtures.TIME_SERIES);
  },
  async categoryBreakdown() {
    return delay(fixtures.CATEGORY_BREAKDOWN);
  },
  async subsidiaryPerformance() {
    return delay(fixtures.SUBSIDIARY_PERFORMANCE);
  },
  async activity() {
    return delay(fixtures.ACTIVITY);
  },
  async dashboard() {
    return delay({
      kpis: fixtures.KPIS,
      timeSeries: fixtures.TIME_SERIES,
      categories: fixtures.CATEGORY_BREAKDOWN,
      performance: fixtures.SUBSIDIARY_PERFORMANCE,
      activity: fixtures.ACTIVITY,
      pipeline: fixtures.PIPELINE_SUMMARY,
      heatmap: fixtures.INGESTION_HEATMAP,
      accuracyTrend: fixtures.ACCURACY_TREND,
      storage: fixtures.STORAGE_BREAKDOWN,
      topQueries: fixtures.TOP_QUERIES,
      deadlines: fixtures.DEADLINES,
      health: fixtures.SYSTEM_HEALTH,
      topTerms: fixtures.DASHBOARD_TERMS,
    }, 420);
  },
};

export const userRepository: UserRepository = {
  async list() {
    return delay(users);
  },
  async updateRole(id, role: User["role"]) {
    users = users.map((u) => (u.id === id ? { ...u, role } : u));
    return delay(users.find((u) => u.id === id)!, 280);
  },
  async setStatus(id, status: User["status"]) {
    users = users.map((u) => (u.id === id ? { ...u, status } : u));
    return delay(users.find((u) => u.id === id)!, 280);
  },
};

export const auditRepository: AuditRepository = {
  async list() {
    return delay(fixtures.AUDIT_ENTRIES);
  },
};

export const integrationRepository: IntegrationRepository = {
  async list() {
    return delay(integrations);
  },
  async sync(id) {
    integrations = integrations.map((i): Integration =>
      i.id === id
        ? {
            ...i,
            status: "connected",
            lastSyncAt: new Date().toISOString(),
            recordsSynced: i.recordsSynced + Math.floor(Math.random() * 400) + 20,
          }
        : i,
    );
    return delay(integrations.find((i) => i.id === id)!, 900);
  },
};

export const notificationRepository: NotificationRepository = {
  async list() {
    return delay(notifications);
  },
  async markRead(id) {
    notifications = notifications.map((n): AppNotification =>
      n.id === id ? { ...n, read: true } : n,
    );
    return delay(notifications, 120);
  },
  async markAllRead() {
    notifications = notifications.map((n): AppNotification => ({ ...n, read: true }));
    return delay(notifications, 160);
  },
};

export const helpRepository: HelpRepository = {
  async resources() {
    return delay(fixtures.HELP_RESOURCES);
  },
  async faqs() {
    return delay(fixtures.FAQS);
  },
};
