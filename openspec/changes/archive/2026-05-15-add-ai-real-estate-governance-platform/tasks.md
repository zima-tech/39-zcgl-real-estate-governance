## 1. Domain Model and Fixtures

- [x] 1.1 Define data structures for business records, upload metadata, workflow instances, workflow events, AI mock jobs, risk warnings, templates, and scenario runs.
- [x] 1.2 Add seed data for representative real estate and enterprise governance records.
- [x] 1.3 Add template registry entries for DOCX, image, and Excel upload categories.
- [x] 1.4 Add mock AI processor configuration with processor names, delays, deterministic outputs, and risk indicators.
- [x] 1.5 Add scenario fixture bundles that link records, uploads, workflow states, AI jobs, and warnings.

## 2. Business Data and Upload APIs

- [x] 2.1 Implement business record create, update, list, detail, and validation handlers.
- [x] 2.2 Implement duplicate detection hints using configured business identity fields.
- [x] 2.3 Implement upload handling for DOCX, image, and Excel files with metadata persistence.
- [x] 2.4 Implement upload validation responses for accepted, warning, and rejected outcomes.
- [x] 2.5 Implement template download handlers for configured business scenario templates.

## 3. Workflow and Traceability

- [x] 3.1 Implement workflow submission with entry-rule validation and initial node assignment.
- [x] 3.2 Implement approve, reject, return, and transfer transitions with comments and authorization checks.
- [x] 3.3 Implement pending task and node reminder queries.
- [x] 3.4 Implement chronological workflow event history for each business record.
- [x] 3.5 Integrate workflow state into business record detail aggregation.

## 4. AI Mock Processing and Risk Warning

- [x] 4.1 Implement mock AI job creation by configured processor name.
- [x] 4.2 Implement delayed mock job completion and loading-status polling.
- [x] 4.3 Persist AI mock result history with processor name, input reference, mock source, timestamps, and output summary.
- [x] 4.4 Implement data governance checks for completeness, consistency, duplication, and stale information.
- [x] 4.5 Implement risk warning generation from rule checks and AI mock result indicators.
- [x] 4.6 Implement warning detail output with severity, reason, source, status, related record, and remediation hint.

## 5. Scenario Simulation

- [x] 5.1 Implement scenario bundle start endpoint that creates scenario-marked records and related data.
- [x] 5.2 Implement scenario step advancement across intake, upload, workflow, AI mock processing, and warning states.
- [x] 5.3 Implement scenario completion state and reviewable result preservation.
- [x] 5.4 Implement scenario reset or cleanup that affects only data marked with the scenario run identifier.

## 6. Frontend Experience

- [x] 6.1 Build unified dashboard and business record intake views.
- [x] 6.2 Build business detail aggregation view for record fields, uploads, workflow progress, AI results, and warnings.
- [x] 6.3 Build upload panel with supported file type messaging, validation results, and template download actions.
- [x] 6.4 Build workflow task center with pending reminders, transition actions, comments, and event history.
- [x] 6.5 Build AI processing panel with named actions, loading indicators, delayed completion, and mock result display.
- [x] 6.6 Build data governance and risk warning views with remediation hints.
- [x] 6.7 Build scenario simulation page for starting, advancing, reviewing, and resetting fixture-driven scenarios.

## 7. Integration and Documentation

- [x] 7.1 Wire aggregated business detail queries to include uploads, workflow, AI mock jobs, and warning records.
- [x] 7.2 Add user-facing labels that clearly distinguish mock AI outputs from real persisted business data.
- [x] 7.3 Document initial processor names, templates, workflow nodes, scenario bundles, and mock behavior boundaries.
- [x] 7.4 Add focused fixture-based acceptance coverage for the main scenario flows if the project has an existing test harness.
