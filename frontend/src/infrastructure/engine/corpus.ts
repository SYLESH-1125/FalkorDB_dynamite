// The embedded knowledge base the demo actually reasons over — no server required.
// Mirrors the deck's stores: Evidence Vault (docs), Passage Index (chunks), Fact Ledger (facts).

export interface CorpusDoc {
  id: string;
  name: string;
  subsidiary: string;
  kind: "pdf" | "scan" | "spreadsheet" | "image" | "docx";
  pageCount: number;
  sizeBytes: number;
}

export interface CorpusChunk {
  id: string;
  docName: string;
  page: number;
  table?: string;
  cell?: string;
  text: string;
}

// a validated figure, true as-of a period, traceable to a source cell
export interface CorpusFact {
  id: string;
  metric: string;
  keywords: string[];
  value: number | null; // null = declared gap
  display: string;
  unit: string;
  subsidiary: string;
  period: string;
  docName: string;
  page: number;
  table: string;
  cell: string;
  formula?: string;
  basis?: "gross" | "net"; // used by Contradiction Radar
  category: string;
}

export const CORPUS_DOCS: CorpusDoc[] = [
  { id: "doc-1", name: "SECL-Gevra-Production-Return-FY25.pdf", subsidiary: "SECL", kind: "pdf", pageCount: 42, sizeBytes: 4_812_004 },
  { id: "doc-2", name: "MCL-Talcher-Env-Clearance-2024.pdf", subsidiary: "MCL", kind: "pdf", pageCount: 88, sizeBytes: 7_390_221 },
  { id: "doc-3", name: "NCL-Amlohri-Safety-Audit-scan.tiff", subsidiary: "NCL", kind: "scan", pageCount: 31, sizeBytes: 12_004_552 },
  { id: "doc-4", name: "CCL-Quarterly-Dispatch.xlsx", subsidiary: "CCL", kind: "spreadsheet", pageCount: 6, sizeBytes: 244_113 },
  { id: "doc-5", name: "BCCL-Rehabilitation-Progress.docx", subsidiary: "BCCL", kind: "docx", pageCount: 18, sizeBytes: 1_003_884 },
  { id: "doc-6", name: "WCL-Production-Targets-FY26.pdf", subsidiary: "WCL", kind: "pdf", pageCount: 24, sizeBytes: 2_119_776 },
  { id: "doc-7", name: "CIL-Annual-Report-FY25.pdf", subsidiary: "All subsidiaries", kind: "pdf", pageCount: 214, sizeBytes: 18_442_112 },
  { id: "doc-8", name: "Coal-Directory-Provisional-Statistics.xlsx", subsidiary: "All subsidiaries", kind: "spreadsheet", pageCount: 12, sizeBytes: 501_233 },
];

export const CORPUS_CHUNKS: CorpusChunk[] = [
  { id: "ch-1", docName: "SECL-Gevra-Production-Return-FY25.pdf", page: 5, table: "Table 2 — Dispatch Summary", cell: "R4·C3", text: "Annual coal dispatch for the Gevra opencast block stood at 167.2 million tonnes against a target of 170 MT, an attainment of 98.4 percent for FY 2025-26." },
  { id: "ch-2", docName: "SECL-Gevra-Production-Return-FY25.pdf", page: 8, table: "Fig 4", cell: "caption", text: "The average stripping ratio at Gevra was 2.31 cubic metres of overburden per tonne of coal, within the approved mine plan envelope." },
  { id: "ch-3", docName: "MCL-Talcher-Env-Clearance-2024.pdf", page: 12, table: "Clearance Register", cell: "EC field", text: "Environmental clearance J-11015/22/2019-IA.II(M) for the Talcher coalfield remains valid through 2027, subject to quarterly ambient air and water monitoring." },
  { id: "ch-4", docName: "MCL-Talcher-Env-Clearance-2024.pdf", page: 33, table: "Monitoring", cell: "R7", text: "Ambient particulate matter readings for the Talcher block were within National Ambient Air Quality Standards across all four quarters of the monitoring year." },
  { id: "ch-5", docName: "NCL-Amlohri-Safety-Audit-scan.tiff", page: 9, table: "Incident Log", cell: "summary", text: "The Amlohri safety audit recorded three reportable incidents in the underground panels during the year, each closed with corrective action and no fatalities." },
  { id: "ch-6", docName: "NCL-Amlohri-Safety-Audit-scan.tiff", page: 14, table: "Audit", cell: "R2", text: "Compliance with DGMS mine safety directives stood at 96 percent, with pending items relating to ventilation survey frequency." },
  { id: "ch-7", docName: "CCL-Quarterly-Dispatch.xlsx", page: 2, table: "Q2 Dispatch", cell: "B7", text: "Rail dispatch from CCL for the quarter was 79 million tonnes, with road and MGR movement contributing a further 11 MT." },
  { id: "ch-8", docName: "BCCL-Rehabilitation-Progress.docx", page: 4, table: "Table 6 — Beneficiaries", cell: "Total", text: "Rehabilitation of families displaced by the Jharia fire and subsidence programme reached 1,842 beneficiaries, 92 percent of the annual target." },
  { id: "ch-9", docName: "BCCL-Rehabilitation-Progress.docx", page: 7, table: "Land", cell: "R3", text: "Land acquisition for the resettlement colony completed 214 hectares of the sanctioned 240 hectares under the R&R policy." },
  { id: "ch-10", docName: "WCL-Production-Targets-FY26.pdf", page: 3, table: "Targets", cell: "R2", text: "The FY 2025-26 production target for WCL is 64 million tonnes, a rise of 4 percent over the previous year's dispatch of 61 MT." },
  { id: "ch-11", docName: "CIL-Annual-Report-FY25.pdf", page: 42, table: "Subsidiary Production", cell: "Gevra row", text: "Coal India Annual Report FY25 records Gevra gross production at 167.2 MT for the year on a gross basis." },
  { id: "ch-12", docName: "Coal-Directory-Provisional-Statistics.xlsx", page: 4, table: "Provisional", cell: "SECL", text: "Provisional statistics list SECL Gevra dispatch at 161.4 MT on a net-of-washery-rejects basis for the same period." },
  { id: "ch-13", docName: "CIL-Annual-Report-FY25.pdf", page: 61, table: "Washery", cell: "R5", text: "Washery capacity utilisation across CIL subsidiaries averaged 71 percent, constrained by feedstock grade slippage in two washeries." },
  { id: "ch-14", docName: "CIL-Annual-Report-FY25.pdf", page: 88, table: "Grade", cell: "R9", text: "Grade slippage against declared G-grades was observed in 8 percent of dispatched rakes, triggering price reconciliation." },
  { id: "ch-15", docName: "MCL-Talcher-Env-Clearance-2024.pdf", page: 51, table: "Closure", cell: "R1", text: "The progressive mine closure plan for exhausted Talcher benches provides for 340 hectares of biological reclamation over five years." },
  { id: "ch-16", docName: "CCL-Quarterly-Dispatch.xlsx", page: 3, table: "Evacuation", cell: "C4", text: "Evacuation was constrained during the monsoon quarter, with rake availability at 88 percent of indent." },
];

export const CORPUS_FACTS: CorpusFact[] = [
  { id: "f-disp-secl", metric: "Annual dispatch (Gevra, SECL)", keywords: ["dispatch", "production", "gevra", "secl", "output", "coal"], value: 167.2, display: "167.2 MT", unit: "MT", subsidiary: "SECL", period: "FY 2025-26", docName: "SECL-Gevra-Production-Return-FY25.pdf", page: 5, table: "Table 2 — Dispatch", cell: "R4·C3", formula: "SUM(monthly_dispatch)", basis: "gross", category: "Operations" },
  { id: "f-disp-secl-net", metric: "Gevra dispatch (net basis)", keywords: ["dispatch", "gevra", "secl", "net", "provisional"], value: 161.4, display: "161.4 MT", unit: "MT", subsidiary: "SECL", period: "FY 2025-26", docName: "Coal-Directory-Provisional-Statistics.xlsx", page: 4, table: "Provisional", cell: "SECL", basis: "net", category: "Operations" },
  { id: "f-target-secl", metric: "Dispatch target (Gevra)", keywords: ["target", "dispatch", "gevra", "secl", "attainment"], value: 170, display: "170 MT", unit: "MT", subsidiary: "SECL", period: "FY 2025-26", docName: "SECL-Gevra-Production-Return-FY25.pdf", page: 5, table: "Table 2 — Dispatch", cell: "R4·C5", category: "Operations" },
  { id: "f-strip-secl", metric: "Stripping ratio (Gevra)", keywords: ["stripping", "ratio", "overburden", "gevra", "secl"], value: 2.31, display: "2.31 m³/t", unit: "m³/t", subsidiary: "SECL", period: "FY 2025-26", docName: "SECL-Gevra-Production-Return-FY25.pdf", page: 8, table: "Fig 4", cell: "caption", category: "Operations" },
  { id: "f-ec-mcl", metric: "Environmental clearance validity (Talcher)", keywords: ["environmental", "clearance", "ec", "talcher", "mcl", "compliance"], value: 2027, display: "valid till 2027", unit: "year", subsidiary: "MCL", period: "FY 2025-26", docName: "MCL-Talcher-Env-Clearance-2024.pdf", page: 12, table: "Clearance Register", cell: "EC field", category: "Compliance" },
  { id: "f-safety-ncl", metric: "Reportable safety incidents (Amlohri)", keywords: ["safety", "incident", "audit", "amlohri", "ncl", "dgms"], value: 3, display: "3 incidents", unit: "count", subsidiary: "NCL", period: "FY 2025-26", docName: "NCL-Amlohri-Safety-Audit-scan.tiff", page: 9, table: "Incident Log", cell: "summary", category: "Safety" },
  { id: "f-rehab-bccl", metric: "Rehabilitation beneficiaries (Jharia)", keywords: ["rehabilitation", "beneficiaries", "jharia", "bccl", "displaced", "resettlement"], value: 1842, display: "1,842 beneficiaries", unit: "count", subsidiary: "BCCL", period: "FY 2025-26", docName: "BCCL-Rehabilitation-Progress.docx", page: 4, table: "Table 6", cell: "Total", formula: "COUNT(beneficiary_id)", category: "Social" },
  { id: "f-land-bccl", metric: "Land acquired (resettlement)", keywords: ["land", "acquisition", "hectares", "bccl", "resettlement"], value: 214, display: "214 ha", unit: "ha", subsidiary: "BCCL", period: "FY 2025-26", docName: "BCCL-Rehabilitation-Progress.docx", page: 7, table: "Land", cell: "R3", category: "Social" },
  { id: "f-disp-ccl", metric: "Rail dispatch (CCL Q2)", keywords: ["dispatch", "rail", "ccl", "quarter"], value: 79, display: "79 MT", unit: "MT", subsidiary: "CCL", period: "FY 2025-26 Q2", docName: "CCL-Quarterly-Dispatch.xlsx", page: 2, table: "Q2 Dispatch", cell: "B7", category: "Logistics" },
  { id: "f-target-wcl", metric: "Production target (WCL)", keywords: ["target", "production", "wcl", "dispatch"], value: 64, display: "64 MT", unit: "MT", subsidiary: "WCL", period: "FY 2025-26", docName: "WCL-Production-Targets-FY26.pdf", page: 3, table: "Targets", cell: "R2", category: "Operations" },
  { id: "f-washery", metric: "Washery capacity utilisation (CIL)", keywords: ["washery", "capacity", "utilisation", "utilization"], value: 71, display: "71%", unit: "%", subsidiary: "All subsidiaries", period: "FY 2025-26", docName: "CIL-Annual-Report-FY25.pdf", page: 61, table: "Washery", cell: "R5", category: "Processing" },
  { id: "f-grade", metric: "Grade slippage (dispatched rakes)", keywords: ["grade", "slippage", "quality", "rakes"], value: 8, display: "8% of rakes", unit: "%", subsidiary: "All subsidiaries", period: "FY 2025-26", docName: "CIL-Annual-Report-FY25.pdf", page: 88, table: "Grade", cell: "R9", category: "Quality" },
  { id: "f-disp-mcl", metric: "Annual dispatch (MCL)", keywords: ["dispatch", "production", "mcl", "talcher"], value: 152, display: "152 MT", unit: "MT", subsidiary: "MCL", period: "FY 2025-26", docName: "CIL-Annual-Report-FY25.pdf", page: 42, table: "Subsidiary Production", cell: "MCL row", category: "Operations" },
  { id: "f-disp-ncl", metric: "Annual dispatch (NCL)", keywords: ["dispatch", "production", "ncl", "amlohri"], value: 131, display: "131 MT", unit: "MT", subsidiary: "NCL", period: "FY 2025-26", docName: "CIL-Annual-Report-FY25.pdf", page: 42, table: "Subsidiary Production", cell: "NCL row", category: "Operations" },
  { id: "f-disp-wcl", metric: "Annual dispatch (WCL)", keywords: ["dispatch", "production", "wcl"], value: 61, display: "61 MT", unit: "MT", subsidiary: "WCL", period: "FY 2025-26", docName: "CIL-Annual-Report-FY25.pdf", page: 42, table: "Subsidiary Production", cell: "WCL row", category: "Operations" },
  { id: "f-disp-bccl", metric: "Annual dispatch (BCCL)", keywords: ["dispatch", "production", "bccl", "jharia"], value: 34, display: "34 MT", unit: "MT", subsidiary: "BCCL", period: "FY 2025-26", docName: "CIL-Annual-Report-FY25.pdf", page: 42, table: "Subsidiary Production", cell: "BCCL row", category: "Operations" },
];

// topics the corpus is known NOT to hold — the Coverage Check declares these instead of guessing
export const KNOWN_GAPS: { keywords: string[]; fact: string; owner: string }[] = [
  { keywords: ["borehole", "seam thickness", "drilling log", "core"], fact: "Borehole seam-thickness logs for the requested block are not held in any validated source.", owner: "CMPDI Exploration · borehole digitisation" },
  { keywords: ["forecast", "projection", "next year", "2027 production", "predict"], fact: "A validated forward production projection is not held — BHUMI reports facts true as-of a date, not forecasts.", owner: "CIL Planning · demand projection cell" },
  { keywords: ["overburden removal volume", "ob removal"], fact: "Overburden removal volume for NCL Amlohri FY26 is still in the scan queue, not yet validated.", owner: "CMPDI · scan queue (doc-3)" },
];
