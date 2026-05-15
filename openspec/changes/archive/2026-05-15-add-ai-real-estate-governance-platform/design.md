## Context

The platform will support real estate and enterprise governance work that currently depends on manual entry, offline file transfer, scattered spreadsheets, and informal approval tracking. The change introduces a unified business flow while keeping the data circulation real: submitted records, uploaded file metadata, workflow events, and risk warning records are persisted and traceable.

AI and complex verification behavior are intentionally bounded for this phase. Intelligent recognition, classification, risk analysis, and result generation will be represented by mock API contracts backed by deterministic fixtures, configurable processing names, loading states, and artificial delay. This allows realistic product workflows and scenario demonstrations without depending on external AI services or expensive test infrastructure.

## Goals / Non-Goals

**Goals:**

- Provide a unified business management surface for source collection, validation, aggregation, workflow, traceability, and risk warning.
- Persist real business records, file metadata, workflow status, AI mock jobs, and risk warning outputs.
- Support DOCX, image, and Excel upload flows plus downloadable templates.
- Simulate named AI processing with mock endpoints, deterministic fixture outputs, loading indicators, and delayed responses.
- Support scenario simulation through seeded test data that drives end-to-end business states.

**Non-Goals:**

- Integrating real OCR, LLM, computer vision, or third-party AI services.
- Building complex automated test infrastructure beyond fixture-driven scenario simulation.
- Replacing downstream government, registry, ERP, or document management systems.
- Implementing legally binding electronic signature, archival compliance, or production-grade identity federation unless already present in the application.

## Decisions

1. Use a modular domain model around records, files, workflows, AI jobs, risk warnings, and scenario fixtures.

   Rationale: The requested flow crosses multiple business concerns, but each concern has separate lifecycle rules. Keeping these as separate modules avoids coupling uploads, approval state, and mock AI output into one oversized record.

   Alternative considered: Store all state in a single business table. This is simpler initially but makes traceability, history, and scenario simulation harder to maintain.

2. Persist real data movement while mocking intelligent processing.

   Rationale: Business users need to see real upload, approval, audit, and warning records. AI behavior can be represented by stable API responses because this phase focuses on workflow transformation and scenario demonstration, not model accuracy.

   Alternative considered: Fully stub all data in the frontend. This is faster for a prototype but would not satisfy the requirement that data circulation be real.

3. Represent AI processing as asynchronous jobs with named processors.

   Rationale: A job model naturally supports loading, delay, status transitions, retry states, and deterministic output lookup by processing name. It also leaves a clean path to replace mock handlers with real AI integrations later.

   Alternative considered: Return mock results synchronously from button clicks. This is simpler but cannot accurately model loading, latency, or process traceability.

4. Use template-driven upload validation.

   Rationale: DOCX, image, and Excel uploads require different validation and preview behavior. A template registry can define allowed extensions, size limits, expected fields, and example downloads for each business scenario.

   Alternative considered: A generic file upload endpoint only. This would allow files through but would not support guided business intake or structured validation.

5. Build scenario simulation on seeded fixture bundles.

   Rationale: Scenario bundles can create records, uploads, workflows, AI jobs, and warnings in known states. This supports demonstration and manual acceptance without complex automated test systems.

   Alternative considered: Hard-code scenario screens. This would make demos fast but would bypass the real data flow that the platform is meant to prove.

## Risks / Trade-offs

- Mock AI may be mistaken for production intelligence -> Label mock results and keep processor configuration explicit so replacement boundaries are clear.
- Artificial delay can frustrate users during normal operation -> Make delays configurable and limit them to mock processing and scenario simulation.
- Upload support can expand into document parsing scope -> Validate and store files now; keep real extraction behind mock processor contracts.
- Workflow rules may vary by organization -> Start with configurable node definitions and preserve event history for later rule expansion.
- Scenario fixture data can pollute real records -> Mark scenario-created data with source metadata and provide isolated reset/cleanup behavior.

## Migration Plan

- Add new data structures for business records, upload metadata, workflow events, AI mock jobs, risk warnings, templates, and scenario fixtures.
- Add backend endpoints or service handlers for record CRUD, uploads, template download, workflow transitions, mock AI jobs, risk warnings, and scenario seeding.
- Add frontend screens for dashboard, record intake, upload panel, workflow task center, AI result panel, warning center, and scenario simulation.
- Seed initial templates, processor names, mock outputs, workflow definitions, and scenario fixtures.
- Rollback by disabling the new routes and preserving created data tables or collections for later migration review.

## Open Questions

- Which real estate and enterprise governance record types must be included in the first seeded scenario set?
- What user roles and permissions already exist in the application, and how should workflow approval map to them?
- What maximum upload size should be enforced for DOCX, images, and Excel files in the first release?
