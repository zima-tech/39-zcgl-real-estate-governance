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

## Mock AI Processors

- `ownership-extraction`: extracts subject, owner, address, and registration fields from uploaded business context.
- `document-consistency-review`: compares document sources and can emit ownership conflict indicators.
- `risk-scan`: scans for mortgage, historical disposal, missing material, and manual review indicators.
- `archive-summary`: creates a mock archive summary with no risk indicator by default.

All AI output is deterministic mock data. Jobs persist processor name, input reference, mock source, timestamps, status, output summary, payload, and risk indicators. Processing delay is configured per processor and can be polled through the record AI job endpoint.

## Scenario Bundles

- `real-estate-risk-review`: creates an Excel-backed real estate risk review run and advances through upload, workflow, mock AI scan, and warning review.
- `enterprise-missing-field`: creates a DOCX-backed enterprise governance run and advances through upload, workflow, field correction, and archive review.

Scenario-created data is marked through scenario run metadata. Reset removes only the business record created for that run and leaves non-scenario records intact.
