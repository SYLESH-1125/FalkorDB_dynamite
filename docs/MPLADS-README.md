# MPLADS Anomaly & Fraud Detection Platform

> **Scope note:** This document is a standalone implementation spec for the MPLADS problem
> statement. It does not describe the code currently in [`frontend/`](../frontend), which is
> scaffolded for a different SIH problem statement (parliamentary query/document processing).
> Treat this as the README for a new build, not documentation of the existing app.

An AI-powered monitoring and analytics platform for the **Members of Parliament Local Area
Development Scheme (MPLADS)** — a Central Sector Scheme under which Members of Parliament
recommend developmental works for durable community assets and civic amenities.

The platform applies machine learning and advanced analytics to sanction, expenditure, cost
estimate, work-progress, payment, and asset data to detect anomalies, cost overruns, duplicate
works, delays, and non-compliance — surfacing risk-based alerts and decision-support dashboards
to MPs, State Nodal Authorities, District Authorities, and the Ministry.

---

## 1. Problem Context

MPLADS involves large-scale fund utilization and execution of thousands of works nationwide
through multiple implementing agencies and administrative layers (MP → District Authority →
State Nodal Agency → Implementing Agency → Ministry). The volume and fragmentation of this data
makes manual monitoring slow and inconsistent, leaving fraud, inefficiency, and non-compliance
to surface late — often only after funds are spent.

## 2. Goals

- Detect anomalies and fraud risk in fund utilization and work execution, early.
- Reduce manual monitoring effort across District, State, and Ministry levels.
- Give each stakeholder a dashboard suited to their authority and decisions.
- Make flagged cases explainable and auditable, not black-box scores.
- Support corrective action with evidence, not just alerts.

## 3. Stakeholders & Access Levels

| Stakeholder | Primary need |
|---|---|
| Member of Parliament (MP) | Status of own recommended/sanctioned works, fund utilization, red flags on "their" works |
| District Authority | Ground-level execution tracking, work verification, vendor/agency oversight |
| State Nodal Authority | Cross-district trends, fund release pipeline, escalation of high-risk cases |
| Ministry (Central) | National trend analysis, scheme-wide compliance, audit trail, policy feedback loop |

---

## 4. Architecture

Follows Clean Architecture — dependencies point inward only.

```
presentation/     UI, dashboards, alert views, report builders
     ↓
application/      use-cases: risk scoring orchestration, alert triage, report generation
     ↓
domain/           entities: Work, Sanction, Expenditure, Payment, Asset, RiskFlag, Authority
     ↓
infrastructure/   ingestion adapters, ML model clients, DB/repositories, external registries
```

- No UI component talks to a data source or ML model directly — always through an
  application-layer use-case backed by an infrastructure repository/service.
- Business rules (what counts as an "overrun," a "duplicate," a "delay") live in
  `domain`, not in components or API handlers.
- ML inference is treated as an infrastructure service behind a domain-defined interface
  (e.g. `AnomalyDetector`), so models can be swapped without touching application/UI code.

### Suggested layer breakdown

```
src/
  domain/
    entities/        Work, Sanction, Expenditure, Payment, Asset, Vendor, RiskFlag
    repositories/     interfaces only (WorkRepository, ExpenditureRepository, ...)
    services/         AnomalyDetector, RiskScorer interfaces
  application/
    use-cases/        ScoreWorkRisk, GenerateAlert, BuildDashboardSummary, ExportComplianceReport
    hooks/             (frontend) data-fetching + view-state composition
  infrastructure/
    repositories/      DB-backed implementations of domain repository interfaces
    ml/                model clients (anomaly detection, forecasting, NLP on work descriptions)
    ingestion/          adapters for source systems (PFMS, state MIS, treasury feeds)
  presentation/
    dashboards/         MP view, District view, State view, Ministry view
    alerts/              risk queue, case detail, evidence trail
    reports/             compliance & trend report builders
```

---

## 5. Data Inputs

| Category | Fields (representative) |
|---|---|
| Sanctions | work ID, MP/constituency, sanctioned amount, sanction date, implementing agency |
| Cost estimates | estimated cost, revised cost, cost per unit benchmarks, category |
| Expenditure | amount released, amount spent, installment number, date, source account |
| Work progress | status, physical progress %, milestones, site geo-tag, inspection reports |
| Payments | payee, vendor ID, payment date, mode, invoice reference |
| Asset creation | asset type, location, completion date, photographic/geo evidence |
| Administrative | district, state, financial year, implementing agency history |

## 6. AI / ML Features

### 6.1 Anomaly & Fraud Detection
- **Cost overrun detection** — compares sanctioned vs. revised vs. category benchmark costs;
  flags statistical outliers (e.g. z-score / IQR on cost-per-unit within work category).
- **Duplicate work detection** — similarity matching on work description, geo-location, and
  implementing agency (NLP embeddings + geo-proximity clustering) to catch the same asset
  claimed twice, possibly under different MPs or financial years.
- **Ghost/ non-existent asset detection** — cross-checks physical progress claims against
  geo-tagged photographic evidence and inspection timestamps; flags works marked "completed"
  with no or inconsistent evidence.
- **Payment irregularity detection** — flags split payments below approval thresholds,
  repeated payments to the same vendor across unrelated works, or payment dates preceding
  sanction/approval dates.
- **Fund utilization anomalies** — unusual disbursement velocity (e.g. full fund drawn
  immediately after sanction with no progress), or funds parked without utilization near
  financial year-end (classic "use it or lose it" pattern).
- **Vendor/agency risk clustering** — implementing agencies or vendors with disproportionate
  shares of flagged works, repeated delays, or cost overruns, scored and clustered for
  pattern visibility across districts/states.

### 6.2 Predictive & Trend Analytics
- **Delay prediction** — model estimated completion risk from sanction date, agency track
  record, work category, and district execution history.
- **Risk scoring per work** — composite score (0–100) combining the anomaly signals above,
  with a transparent factor breakdown (not just a number).
- **Trend dashboards** — state/district-wise utilization rates, average delay, cost-overrun
  frequency, and comparisons against scheme-wide norms.

### 6.3 Compliance & NLP
- **Norm-deviation detection** — rules engine (deterministic, auditable) layered under the ML
  models to catch explicit MPLADS guideline violations (ineligible work categories,
  fund-ceiling breaches, timeline breaches).
- **Document/report NLP** — extraction from utilization certificates, inspection reports, and
  audit paras to auto-populate structured fields and cross-check against system data.

### 6.4 Decision Support
- **Risk-based alert queue** — prioritized by severity and stakeholder-relevant scope (an MP
  sees only their works; District sees their jurisdiction; Ministry sees everything).
- **Explainability panel** — every alert shows which signals triggered it and the underlying
  data, so it survives audit scrutiny rather than being a black-box score.
- **Case workflow** — alert → review → action/closure, with an audit trail of who reviewed
  what and when.

---

## 7. Types of Anomalies Detected (Summary)

| Anomaly type | Signal |
|---|---|
| Cost overrun | Actual/revised cost far exceeds category benchmark or sanctioned estimate |
| Duplicate work | Same asset/location claimed under multiple works or years |
| Ghost asset | "Completed" status with missing/inconsistent geo-photographic evidence |
| Delayed execution | Physical progress far behind expected timeline for work category |
| Fund parking | Funds released but unutilized near year-end, or utilized instantly with no progress |
| Split payments | Multiple payments structured just under approval/audit thresholds |
| Vendor concentration | Disproportionate work/payment share to one vendor across districts |
| Sequence violation | Payment predates sanction, or utilization certificate predates completion |
| Norm deviation | Work category, cost ceiling, or process step violates MPLADS guidelines |

---

## 8. Tech Stack (proposed)

- **Frontend:** Next.js/React, Tailwind, chart library (Recharts) — role-based dashboards.
- **Backend/API:** Node.js or Python (FastAPI) service layer exposing use-cases.
- **ML/Analytics:** Python — scikit-learn/XGBoost for scoring, isolation forest / statistical
  methods for outlier detection, sentence embeddings for duplicate/NLP matching.
- **Data storage:** relational DB (PostgreSQL) for transactional/work data; object storage for
  evidence (photos, documents).
- **Ingestion:** scheduled adapters pulling from PFMS/state MIS/treasury data sources.

## 9. Implementation Phases

1. **Data ingestion & domain modeling** — define entities, repositories, ingestion adapters.
2. **Rules engine** — deterministic norm-deviation checks (fast to ship, immediately auditable).
3. **Anomaly detection models** — statistical + ML scoring layered on top of rules engine.
4. **Risk scoring & alert pipeline** — composite scores, alert generation, explainability.
5. **Dashboards** — role-based views for MP / District / State / Ministry.
6. **Predictive layer** — delay prediction, trend forecasting.
7. **Feedback loop** — reviewer decisions (confirmed fraud / false positive) feed back into
   model retraining and rules tuning.

## 10. Success Metrics

- Reduction in time-to-detect for flagged irregularities vs. manual audit cycles.
- Precision/recall of alerts against confirmed audit findings (avoid alert fatigue).
- Coverage: % of sanctioned works actively risk-scored.
- Stakeholder adoption: dashboard usage by MPs/District/State/Ministry.
