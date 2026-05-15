# Governance Platform Mock Boundaries

## Templates

- `real-estate-docx-intake`: DOCX intake template for real estate governance materials. Accepted extension: `.docx`. Maximum size: 12MB.
- `governance-image-evidence`: image evidence upload guide for scans, certificates, and site evidence. Accepted extensions: `.jpg`, `.jpeg`, `.png`, `.webp`. Maximum size: 8MB.
- `enterprise-excel-register`: Excel register template for enterprise governance records. Accepted extensions: `.xls`, `.xlsx`. Maximum size: 20MB.
- `workflow-approved-result`: downloadable approval/archival result template with an intelligent mock summary.
- `workflow-return-reject-result`: downloadable return/rejection result template with correction items and mock reasoning.
- `risk-review-result`: downloadable risk review result template with warning severity and remediation hints.
- `scenario-intelligence-test-result`: downloadable scenario acceptance template covering intake, upload, workflow, mock AI, and warnings.

## Demo Roles And Users

The full-process administrator account is `admin` with password `admin`.
It uses the `admin` role and can view all governance records, templates, workflow tasks, mock AI outputs, warnings, scenario runs, and system management pages.

All other seeded demo users use the password `123456`.

- `demo.intake` / `data_intake_operator`: source data collection and business record maintenance.
- `demo.document` / `document_operator`: template download, upload metadata, and upload validation review.
- `demo.approver` / `workflow_approver`: department review, transfer, return, approval, and archive handling.
- `demo.risk` / `risk_analyst`: risk review, warning analysis, and mock AI risk output review.
- `demo.scenario` / `scenario_tester`: scenario start, step advancement, reset, and intelligent result download checks.
- `demo.admin01`, `demo.admin02`, `demo.user01` to `demo.user04`: additional seeded demo accounts using password `123456`.

## Workflow Nodes

- `department_review`: first approval node for records without active warnings, assigned to `workflow_approver`.
- `risk_review`: initial or follow-up node for records with active risk warnings, assigned to `risk_analyst`.
- `archive_review`: final node before approval or archival completion, assigned to `workflow_approver`.

Workflow transitions support approve, reject, return, transfer, correction, and archive actions. Reject and return require comments. Node history is persisted in chronological workflow events.

## PRD-Aligned Pages

- Data overview: persisted governance counts plus todo items from workflow tasks, reminders, open warnings, missing required fields, expiring leases, and Mock AI jobs requiring review.
- Real-estate management: property number, type, area, ownership status, tenant, lease expiry, assessed value, risk level, location label, optional coordinates, and map-distribution groups.
- Enterprise governance: enterprise identity, business type, registration number, workflow state, warning count, compliance status, governance score, duplicate findings, approval state, and remediation focus.
- Existing pages remain available: business records, template upload, workflow management, risk warning, scenario simulation, user/role management, and audit logs.

## Rule-Based Outputs

- Asset value assessment is derived from persisted or fixture value and area fields. It is not a production appraisal.
- Lease expiry and rent overdue indicators are rule/mock labels derived from normalized fields. They are not synchronized with a finance or lease system.
- Map distribution uses stored coordinates when present and falls back to address-only grouping. No map provider or geocoding service is integrated.
- Enterprise compliance status and governance score are derived from missing fields, workflow state, findings, open warnings, duplicate warnings, and Mock AI indicators.

## Mock AI Processors

- `ownership-extraction`: extracts subject, owner, address, and registration fields from uploaded business context.
- `document-consistency-review`: compares document sources and can emit ownership conflict indicators.
- `risk-scan`: scans for mortgage, historical disposal, missing material, and manual review indicators.
- `archive-summary`: creates a mock archive summary with no risk indicator by default.

All AI output is deterministic mock data. Jobs persist processor name, input reference, mock source, timestamps, status, output summary, payload, and risk indicators. Processing delay is configured per processor and can be polled through the record AI job endpoint.

Deferred production integrations remain out of scope for this module: real OCR, real map provider SDK/geocoding, external registry or ERP sync, financial receivables sync, legally binding electronic signature, and production valuation.

## Scenario Bundles

- `real-estate-risk-review`: creates an Excel-backed real estate risk review run and advances through upload, workflow, mock AI scan, and warning review.
- `enterprise-missing-field`: creates a DOCX-backed enterprise governance run and advances through upload, workflow, field correction, and archive review.

Scenario-created data is marked through scenario run metadata. Reset removes only the business record created for that run and leaves non-scenario records intact.
