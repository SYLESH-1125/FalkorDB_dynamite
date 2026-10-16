import random
import uuid
from datetime import datetime, timedelta, timezone

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.db.models import (
    AppNotification, AuditEntry, ChatMessage, ChatThread, Citation, Document, ExtractedField,
    FaqItem, HelpResource, Integration, ParliamentaryQueryRow, PipelineStage, ProcessingJob, Report,
    ReportTemplate, ReportVersionRow, Subsidiary, User, ValidationRecord,
)

SUBSIDIARIES = ["ECL", "BCCL", "CCL", "NCL", "WCL", "SECL", "MCL", "NEC"]

# million tonnes — approximate real-world scale for CIL subsidiaries
SUBSIDIARY_PRODUCTION = {
    "ECL": (42.1, 45.0), "BCCL": (38.6, 36.0), "CCL": (51.3, 50.0), "NCL": (63.8, 60.0),
    "WCL": (29.4, 32.0), "SECL": (71.2, 68.0), "MCL": (82.5, 78.0), "NEC": (4.7, 5.2),
}

DEMO_USERS = [
    {
        "employee_id": "EMP001",
        "name": "Prieyan Mogger",
        "email": "p.menon@bhumi.gov.in",
        "role": "Administrator",
        "subsidiary_code": "ECL",
        "designation": "Chief Manager (Systems)",
    },
    {
        "employee_id": "EMP002",
        "name": "Anjali Deshmukh",
        "email": "a.deshmukh@bhumi.gov.in",
        "role": "Analyst",
        "subsidiary_code": "ECL",
        "designation": "Parliamentary Response Officer",
    },
    {
        "employee_id": "EMP003",
        "name": "S. Venkatraman",
        "email": "s.venkatraman@bhumi.gov.in",
        "role": "Analyst",
        "subsidiary_code": "CCL",
        "designation": "Deputy Secretary (Policy & Monitoring)",
    },
    {
        "employee_id": "EMP004",
        "name": "Deepak Mahto",
        "email": "d.mahto@bhumi.gov.in",
        "role": "Analyst",
        "subsidiary_code": "MCL",
        "designation": "Domain Officer, CMPDI",
    },
    {
        "employee_id": "EMP005",
        "name": "Kavita Iyer",
        "email": "k.iyer@bhumi.gov.in",
        "role": "Reviewer",
        "subsidiary_code": "BCCL",
        "designation": "Senior Validation Officer",
    },
    {
        "employee_id": "EMP006",
        "name": "Rahul Devnani",
        "email": "r.devnani@bhumi.gov.in",
        "role": "Reviewer",
        "subsidiary_code": "NCL",
        "designation": "Data Quality Analyst",
    },
    {
        "employee_id": "EMP007",
        "name": "Priya Menon",
        "email": "priya.menon@bhumi.gov.in",
        "role": "Viewer",
        "subsidiary_code": "SECL",
        "designation": "Regional Liaison Officer",
    },
    {
        "employee_id": "EMP008",
        "name": "Vikram Shah",
        "email": "v.shah@bhumi.gov.in",
        "role": "Analyst",
        "subsidiary_code": "WCL",
        "designation": "Production Reporting Officer",
    },
    {
        "employee_id": "EMP009",
        "name": "Anjali Rao",
        "email": "a.rao@bhumi.gov.in",
        "role": "Viewer",
        "subsidiary_code": "MCL",
        "designation": "Compliance Associate",
    },
]

REPORT_TEMPLATES = [
    {
        "name": "Statutory Compliance Report",
        "category": "Statutory",
        "description": "Standard statutory compliance summary across subsidiaries.",
        "sections": [
            {"id": "sec-1", "title": "Executive Summary", "enabled": True, "description": "High-level overview"},
            {"id": "sec-2", "title": "Compliance Status", "enabled": True, "description": "Per-subsidiary compliance table"},
            {"id": "sec-3", "title": "Open Issues", "enabled": True, "description": "Outstanding compliance items"},
        ],
        "is_default": True,
    },
    {
        "name": "Parliamentary Response Brief",
        "category": "Parliamentary",
        "description": "Structured brief for tabled parliamentary questions.",
        "sections": [
            {"id": "sec-1", "title": "Question Summary", "enabled": True, "description": "Original question text"},
            {"id": "sec-2", "title": "Evidence & Citations", "enabled": True, "description": "Source-backed answer"},
            {"id": "sec-3", "title": "Annexures", "enabled": False, "description": "Supporting documents"},
        ],
        "is_default": False,
    },
    {
        "name": "Operational Performance Report",
        "category": "Operational",
        "description": "Production, despatch and stripping ratio performance.",
        "sections": [
            {"id": "sec-1", "title": "Production Summary", "enabled": True, "description": "MT produced vs. target"},
            {"id": "sec-2", "title": "Charts", "enabled": True, "description": "Trend charts"},
        ],
        "is_default": False,
    },
    {
        "name": "Environmental Clearance Status",
        "category": "Environmental",
        "description": "Environmental clearance and compliance condition tracking.",
        "sections": [
            {"id": "sec-1", "title": "Clearance Status", "enabled": True, "description": "Per-project clearance state"},
        ],
        "is_default": False,
    },
]

HELP_RESOURCES = [
    {
        "title": "Getting started with document upload",
        "description": "Walkthrough of the upload and ingestion flow.",
        "kind": "guide",
        "category": "Data Pipeline",
        "duration": "5 min read",
    },
    {
        "title": "How field validation works",
        "description": "Understanding confidence scores and manual correction.",
        "kind": "guide",
        "category": "Data Pipeline",
        "duration": "4 min read",
    },
    {
        "title": "Generating a parliamentary brief",
        "description": "Step-by-step video on drafting a defensible answer.",
        "kind": "video",
        "category": "Reporting",
        "duration": "8 min",
    },
]

FAQS = [
    {
        "question": "How is document confidence calculated?",
        "answer": "Confidence is the average extraction confidence across all fields identified in a document.",
        "category": "Data Pipeline",
    },
    {
        "question": "Who can approve validation records?",
        "answer": "Any authenticated user with write access can save fields; approval publishes the record.",
        "category": "Data Pipeline",
    },
    {
        "question": "Where is uploaded evidence stored?",
        "answer": "Raw files are stored in the object storage evidence vault, referenced by every extracted fact.",
        "category": "Platform",
    },
]

INTEGRATIONS = [
    {
        "name": "CIL DMS",
        "subsidiary_code": "ECL",
        "description": "Coal India Document Management System feed.",
        "endpoint": "https://dms.internal/api",
        "status": "disconnected",
    },
    {
        "name": "SWCS Geological Records",
        "subsidiary_code": "SECL",
        "description": "State Wing Coal Survey geological archive.",
        "endpoint": "https://swcs.internal/api",
        "status": "disconnected",
    },
]


async def seed(db: AsyncSession) -> None:
    existing = (await db.execute(select(Subsidiary.code))).scalars().all()
    if not existing:
        db.add_all(
            Subsidiary(code=code, name=code, production_mt=SUBSIDIARY_PRODUCTION[code][0], target_mt=SUBSIDIARY_PRODUCTION[code][1])
            for code in SUBSIDIARIES
        )
        await db.flush()
    else:
        subsidiaries = (await db.execute(select(Subsidiary))).scalars().all()
        for s in subsidiaries:
            if float(s.production_mt) == 0 and s.code in SUBSIDIARY_PRODUCTION:
                s.production_mt, s.target_mt = SUBSIDIARY_PRODUCTION[s.code]
        await db.flush()

    existing_users = set((await db.execute(select(User.employee_id))).scalars().all())
    missing_users = [u for u in DEMO_USERS if u["employee_id"] not in existing_users]
    if missing_users:
        db.add_all(User(status="active", **u) for u in missing_users)
        await db.flush()

    existing_templates = (await db.execute(select(ReportTemplate.id))).scalars().all()
    if not existing_templates:
        db.add_all(ReportTemplate(usage_count=0, **t) for t in REPORT_TEMPLATES)

    existing_help = (await db.execute(select(HelpResource.id))).scalars().all()
    if not existing_help:
        db.add_all(HelpResource(**h) for h in HELP_RESOURCES)

    existing_faqs = (await db.execute(select(FaqItem.id))).scalars().all()
    if not existing_faqs:
        db.add_all(FaqItem(**f) for f in FAQS)

    existing_integrations = (await db.execute(select(Integration.id))).scalars().all()
    if not existing_integrations:
        db.add_all(Integration(records_synced=0, **i) for i in INTEGRATIONS)

    await db.commit()

    users = (await db.execute(select(User))).scalars().all()
    user_by_employee = {u.employee_id: u for u in users}

    now = datetime.now(timezone.utc)

    PARLIAMENTARY_QUERIES = [
        {
            "reference_no": "LS/2026/4471", "subject": "Status of Jharia Master Plan rehabilitation",
            "house": "Lok Sabha", "member_name": "Shri R. Kumar", "priority": "critical",
            "stage": "assigned", "received_days_ago": 2, "due_days": -10, "subsidiary_code": "ECL",
            "assignee": "EMP002",
        },
        {
            "reference_no": "RS/2026/1182", "subject": "Coal production shortfall — Q2 review",
            "house": "Rajya Sabha", "member_name": "Smt. J. Reddy", "priority": "critical",
            "stage": "drafting", "received_days_ago": 5, "due_days": 1, "subsidiary_code": "BCCL",
            "assignee": "EMP006",
        },
        {
            "reference_no": "LS/2026/4502", "subject": "Land acquisition compensation status",
            "house": "Lok Sabha", "member_name": "Shri A. Singh", "priority": "high",
            "stage": "assigned", "received_days_ago": 1, "due_days": 3, "subsidiary_code": "CCL",
            "assignee": "EMP003",
        },
        {
            "reference_no": "RS/2026/1190", "subject": "Environmental clearance backlog report",
            "house": "Rajya Sabha", "member_name": "Dr. M. Pillai", "priority": "normal",
            "stage": "received", "received_days_ago": 1, "due_days": 6, "subsidiary_code": "SECL",
            "assignee": None,
        },
        {
            "reference_no": "LS/2026/4518", "subject": "Mine safety audit — annual summary",
            "house": "Lok Sabha", "member_name": "Shri K. Naidu", "priority": "normal",
            "stage": "reviewed", "received_days_ago": 8, "due_days": 9, "subsidiary_code": "MCL",
            "assignee": "EMP004",
        },
    ]

    existing_pq_refs = set((await db.execute(select(ParliamentaryQueryRow.reference_no))).scalars().all())
    new_pq = [pq for pq in PARLIAMENTARY_QUERIES if pq["reference_no"] not in existing_pq_refs]
    if new_pq:
        for pq in new_pq:
            assignee = user_by_employee.get(pq["assignee"]) if pq["assignee"] else None
            db.add(ParliamentaryQueryRow(
                reference_no=pq["reference_no"], subject=pq["subject"], house=pq["house"],
                member_name=pq["member_name"], priority=pq["priority"], stage=pq["stage"],
                received_at=now - timedelta(days=pq["received_days_ago"]),
                due_at=now + timedelta(days=pq["due_days"]),
                assigned_to_user_id=assignee.id if assignee else None,
                subsidiary_code=pq["subsidiary_code"], linked_report_ids=[],
            ))

    existing_notifications = (await db.execute(select(AppNotification.id))).scalars().all()
    if not existing_notifications:
        for u in users:
            db.add(AppNotification(
                user_id=u.id, title="Welcome to BHUMI",
                body="Your account is provisioned. Start by uploading documents on the Data Pipeline page.",
                severity="info", source="system", read=False,
            ))

    await db.commit()
    await _seed_content(db, users, user_by_employee)


DOC_NAMES = [
    ("ECL_Annual_Report_2026.pdf", "ECL"), ("BCCL_Production_Q2.xlsx", "BCCL"),
    ("CCL_Environmental_Clearance.pdf", "CCL"), ("NCL_Safety_Audit_2026.pdf", "NCL"),
    ("WCL_Stripping_Ratio_Summary.csv", "WCL"), ("SECL_Despatch_Register.xlsx", "SECL"),
    ("MCL_Land_Acquisition_Status.docx", "MCL"), ("ECL_Statutory_Compliance.pdf", "ECL"),
    ("BCCL_Geological_Survey.pdf", "BCCL"), ("CCL_Q1_Production_Review.xlsx", "CCL"),
    ("NCL_Environmental_Impact.pdf", "NCL"), ("SECL_Mine_Closure_Plan.docx", "SECL"),
]

KIND_BY_EXT = {"pdf": "pdf", "xlsx": "spreadsheet", "docx": "docx", "csv": "spreadsheet"}

FIELD_TEMPLATES = [
    ("Production volume (MT)", "42,150"), ("Reporting period", "FY 2025-26 Q2"),
    ("Subsidiary code", "ECL"), ("Stripping ratio", "3.2:1"),
    ("Despatch total (MT)", "39,880"), ("Compliance status", "Compliant"),
]


async def _seed_content(db: AsyncSession, users: list[User], user_by_employee: dict[str, User]) -> None:
    existing_docs = (await db.execute(select(Document.id))).scalars().all()
    if existing_docs:
        return

    now = datetime.now(timezone.utc)
    rng = random.Random(42)
    statuses = ["validated", "validated", "extracted", "processing", "queued", "error"]
    documents: list[Document] = []

    for i, (name, subsidiary) in enumerate(DOC_NAMES):
        ext = name.rsplit(".", 1)[-1]
        status = statuses[i % len(statuses)]
        uploader = rng.choice(users)
        doc = Document(
            name=name, kind=KIND_BY_EXT.get(ext, "pdf"),
            size_bytes=rng.randint(240_000, 8_500_000), status=status,
            progress=100 if status in ("validated", "extracted") else rng.randint(10, 90),
            subsidiary_code=subsidiary, uploaded_by_user_id=uploader.id,
            uploaded_at=now - timedelta(days=rng.randint(1, 60), hours=rng.randint(0, 23)),
            page_count=rng.randint(4, 120), confidence=round(rng.uniform(78, 98), 1),
            error_message="OCR confidence below threshold on 2 pages" if status == "error" else None,
            storage_bucket="bhumi-documents", storage_key=f"documents/{uuid.uuid4()}/{name}",
            content_type="application/pdf" if ext == "pdf" else "application/octet-stream",
        )
        documents.append(doc)
    db.add_all(documents)
    await db.flush()

    stage_names = ["Ingestion", "OCR / Digitization", "Table Extraction", "Entity Recognition", "Indexing"]
    for doc in documents:
        job = ProcessingJob(document_id=doc.id, ocr_engine="tesseract", language="en", started_at=doc.uploaded_at)
        db.add(job)
        await db.flush()
        done_through = {
            "validated": 5, "extracted": 3, "processing": 2, "queued": 1, "error": 2,
        }[doc.status]
        for idx, stage_name in enumerate(stage_names, start=1):
            stage_status = (
                "complete" if idx < done_through else
                "failed" if idx == done_through and doc.status == "error" else
                "running" if idx == done_through else "pending"
            )
            db.add(PipelineStage(
                job_id=job.id, name=stage_name, stage_order=idx, status=stage_status,
                progress=100 if stage_status == "complete" else (50 if stage_status == "running" else 0),
                duration_ms=rng.randint(800, 12000) if stage_status in ("complete", "running") else 0,
                message="" if stage_status != "failed" else "OCR confidence below threshold",
            ))

    validated_docs = [d for d in documents if d.status in ("validated", "extracted")]
    for doc in validated_docs:
        reviewer = rng.choice([u for u in users if u.role in ("Reviewer", "Analyst", "Administrator")])
        record = ValidationRecord(
            document_id=doc.id, assigned_to_user_id=reviewer.id,
            submitted_at=doc.uploaded_at + timedelta(hours=rng.randint(1, 48)),
        )
        db.add(record)
        await db.flush()
        for order, (label, value) in enumerate(FIELD_TEMPLATES):
            confidence = round(rng.uniform(62, 99), 1)
            field_status = "validated" if doc.status == "validated" else (
                "error" if confidence < 75 else "pending"
            )
            db.add(ExtractedField(
                record_id=record.id, label=label, extracted_value=value,
                corrected_value=None, confidence=confidence, status=field_status,
                page_ref=rng.randint(1, max(doc.page_count, 1)),
                bounding_box_hint=f"p{rng.randint(1, max(doc.page_count, 1))}, ¶{rng.randint(1, 6)}",
                field_order=order,
            ))

    templates = (await db.execute(select(ReportTemplate))).scalars().all()
    report_titles = [
        ("Q2 Production Summary — All Subsidiaries", "SECL"),
        ("Statutory Compliance Digest", "ECL"),
        ("Jharia Rehabilitation Progress Brief", "ECL"),
        ("Environmental Clearance Tracker", "CCL"),
        ("Annual Safety Audit Compendium", "NCL"),
        ("Despatch & Stripping Ratio Review", "WCL"),
    ]
    report_statuses = ["published", "published", "draft", "generating", "published", "draft"]
    for (title, subsidiary), status in zip(report_titles, report_statuses):
        template = rng.choice(templates) if templates else None
        author = rng.choice(users)
        created = now - timedelta(days=rng.randint(2, 90))
        report = Report(
            title=title, template_id=template.id if template else "", status=status, version=rng.randint(1, 3),
            subsidiary_code=subsidiary, created_by_user_id=author.id,
            created_at=created, updated_at=created + timedelta(days=rng.randint(0, 5)),
            page_count=rng.randint(6, 48), formats=["PDF", "DOCX"],
        )
        db.add(report)
        await db.flush()
        db.add(ReportVersionRow(
            report_id=report.id, version=report.version, changed_by_user_id=author.id,
            changed_at=report.updated_at, summary="Initial generation from validated sources.",
        ))
        if template:
            template.usage_count += 1

    ACTIONS = [
        ("sign_in", "session"), ("upload_document", "document"), ("approve_validation", "validation_record"),
        ("generate_report", "report"), ("update_role", "user"), ("export_report", "report"),
    ]
    for i in range(24):
        actor = rng.choice(users)
        action, resource = rng.choice(ACTIONS)
        db.add(AuditEntry(
            timestamp=now - timedelta(hours=rng.randint(1, 720)),
            actor_user_id=actor.id, action=action, resource=resource,
            resource_id=str(uuid.uuid4())[:8], ip_address=f"10.10.{rng.randint(0,9)}.{rng.randint(2,254)}",
            outcome="success" if rng.random() > 0.08 else "failure",
            details=f"{action.replace('_', ' ').title()} by {actor.name}",
        ))

    QUESTIONS = [
        "Which mines exceeded their stripping ratio target this quarter?",
        "What is the average extraction accuracy across all subsidiaries?",
        "Summarise open parliamentary queries assigned to ECL.",
        "How many documents were digitised in the last 30 days?",
    ]
    for i, question in enumerate(QUESTIONS):
        asker = rng.choice(users)
        thread = ChatThread(title=question[:48], user_id=asker.id, updated_at=now - timedelta(hours=rng.randint(1, 96)))
        db.add(thread)
        await db.flush()
        db.add(ChatMessage(thread_id=thread.id, role="user", content=question, created_at=thread.updated_at))
        answer_msg = ChatMessage(
            thread_id=thread.id, role="assistant",
            content=f"Based on indexed source documents: {question} — see cited pages for full context.",
            created_at=thread.updated_at + timedelta(seconds=4),
        )
        db.add(answer_msg)
        await db.flush()
        for doc in rng.sample(documents, k=min(2, len(documents))):
            db.add(Citation(
                message_id=answer_msg.id, document_name=doc.name, page=rng.randint(1, max(doc.page_count, 1)),
                snippet="…relevant extracted passage supporting this answer…", relevance=round(rng.uniform(0.7, 0.98), 2),
            ))

    await db.commit()
