import type { KnowledgeGraph } from "@/src/domain/entities/graph";

// mirrors the real Neo4j publish shape (Document -[:BELONGS_TO]-> Subsidiary,
// Document -[:REFERENCES]-> Mine) with Block/RiskFlag added for a richer mock preview
export const MOCK_KNOWLEDGE_GRAPH: KnowledgeGraph = {
  nodes: [
    { id: "sub-ecl", kind: "Subsidiary", label: "ECL", properties: { code: "ECL", name: "Eastern Coalfields" } },
    { id: "sub-secl", kind: "Subsidiary", label: "SECL", properties: { code: "SECL", name: "South Eastern Coalfields" } },
    { id: "sub-mcl", kind: "Subsidiary", label: "MCL", properties: { code: "MCL", name: "Mahanadi Coalfields" } },
    { id: "sub-ncl", kind: "Subsidiary", label: "NCL", properties: { code: "NCL", name: "Northern Coalfields" } },

    { id: "mine-jharia", kind: "Mine", label: "Jharia Colliery", properties: { name: "Jharia Colliery", type: "Underground" } },
    { id: "mine-gevra", kind: "Mine", label: "Gevra Mine", properties: { name: "Gevra Mine", type: "Opencast" } },
    { id: "mine-talcher", kind: "Mine", label: "Talcher Coalfield", properties: { name: "Talcher Coalfield", type: "Opencast" } },
    { id: "mine-singrauli", kind: "Mine", label: "Singrauli Mine", properties: { name: "Singrauli Mine", type: "Opencast" } },

    { id: "block-b12", kind: "Block", label: "Block B-12", properties: { name: "Block B-12", area: "4.2 km²" } },
    { id: "block-b7", kind: "Block", label: "Block B-7", properties: { name: "Block B-7", area: "2.8 km²" } },
    { id: "block-a3", kind: "Block", label: "Block A-3", properties: { name: "Block A-3", area: "6.1 km²" } },

    {
      id: "doc-1", kind: "Document", label: "Jharia-Rehabilitation-2026.pdf",
      properties: { name: "Jharia-Rehabilitation-2026.pdf", kind: "pdf", status: "validated" },
    },
    {
      id: "doc-2", kind: "Document", label: "Gevra-Production-Q2.xlsx",
      properties: { name: "Gevra-Production-Q2.xlsx", kind: "spreadsheet", status: "validated" },
    },
    {
      id: "doc-3", kind: "Document", label: "Talcher-Environmental-Clearance.pdf",
      properties: { name: "Talcher-Environmental-Clearance.pdf", kind: "pdf", status: "extracted" },
    },
    {
      id: "doc-4", kind: "Document", label: "Singrauli-Overburden-Survey.docx",
      properties: { name: "Singrauli-Overburden-Survey.docx", kind: "docx", status: "validated" },
    },
    {
      id: "doc-5", kind: "Document", label: "Jharia-Land-Acquisition-1987.pdf",
      properties: { name: "Jharia-Land-Acquisition-1987.pdf", kind: "scan", status: "validated" },
    },
    {
      id: "doc-6", kind: "Document", label: "Gevra-Stripping-Ratio-Audit.pdf",
      properties: { name: "Gevra-Stripping-Ratio-Audit.pdf", kind: "pdf", status: "error" },
    },

    {
      id: "risk-1", kind: "RiskFlag", label: "Cost overrun",
      properties: { severity: "high", note: "Stripping ratio exceeds sanctioned estimate" },
    },
    {
      id: "risk-2", kind: "RiskFlag", label: "Clearance overdue",
      properties: { severity: "medium", note: "Public hearing pending 27 months" },
    },
  ],
  edges: [
    { id: "e1", source: "doc-1", target: "sub-ecl", type: "BELONGS_TO" },
    { id: "e2", source: "doc-1", target: "mine-jharia", type: "REFERENCES" },
    { id: "e3", source: "doc-5", target: "sub-ecl", type: "BELONGS_TO" },
    { id: "e4", source: "doc-5", target: "mine-jharia", type: "REFERENCES" },
    { id: "e5", source: "mine-jharia", target: "block-b12", type: "LOCATED_IN" },

    { id: "e6", source: "doc-2", target: "sub-secl", type: "BELONGS_TO" },
    { id: "e7", source: "doc-2", target: "mine-gevra", type: "REFERENCES" },
    { id: "e8", source: "doc-6", target: "sub-secl", type: "BELONGS_TO" },
    { id: "e9", source: "doc-6", target: "mine-gevra", type: "REFERENCES" },
    { id: "e10", source: "mine-gevra", target: "block-b7", type: "LOCATED_IN" },
    { id: "e11", source: "doc-6", target: "risk-1", type: "FLAGGED_BY" },

    { id: "e12", source: "doc-3", target: "sub-mcl", type: "BELONGS_TO" },
    { id: "e13", source: "doc-3", target: "mine-talcher", type: "REFERENCES" },
    { id: "e14", source: "mine-talcher", target: "block-a3", type: "LOCATED_IN" },
    { id: "e15", source: "doc-3", target: "risk-2", type: "FLAGGED_BY" },

    { id: "e16", source: "doc-4", target: "sub-ncl", type: "BELONGS_TO" },
    { id: "e17", source: "doc-4", target: "mine-singrauli", type: "REFERENCES" },
  ],
};
