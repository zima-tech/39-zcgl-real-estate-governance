## 1. Data Model and Normalization

- [x] 1.1 Define typed asset ledger fields for property number, property type, area, ownership status, tenant, lease expiry, assessed value, risk level, location label, and optional coordinates.
- [x] 1.2 Define typed enterprise analysis fields for registration number, compliance status, governance score or rating, warning counts, workflow state, and remediation focus.
- [x] 1.3 Extend seed/mock scenario data with representative PRD asset and enterprise records.
- [x] 1.4 Add normalization helpers that derive asset, enterprise, lease, value, risk, and todo indicators from existing governance records and `normalizedFields`.

## 2. Service and API Aggregation

- [x] 2.1 Add service functions for real-estate asset ledger list, filters, detail summary, and map-distribution aggregation.
- [x] 2.2 Add service functions for enterprise ledger and governance analysis aggregation.
- [x] 2.3 Extend dashboard aggregation with PRD homepage metrics and todo categories.
- [x] 2.4 Add or extend API routes for asset ledger, map distribution, enterprise analysis, and homepage overview data.

## 3. Real-Estate Management UI

- [x] 3.1 Add a real-estate management view with property list columns matching the PRD fields.
- [x] 3.2 Add filters for property type, ownership status, tenant, lease expiry status, risk level, and workflow status.
- [x] 3.3 Add a map-distribution panel that shows location groups, coordinate availability, risk distribution, and address-only fallback.
- [x] 3.4 Add value assessment, lease expiry, rent overdue, and ownership risk indicators with mock/rule-based labels.

## 4. Enterprise Governance UI

- [x] 4.1 Add an enterprise ledger view with enterprise identity, business type, registration number, workflow state, warning count, and compliance status.
- [x] 4.2 Add governance analysis panels for completeness, duplicate findings, open warnings, mock AI indicators, and approval state.
- [x] 4.3 Add remediation focus grouping by enterprise record and source.

## 5. Homepage and Navigation Alignment

- [x] 5.1 Add homepage or governance dashboard overview cards for records, assets, enterprises, workflow pending tasks, active warnings, uploads, and processing jobs.
- [x] 5.2 Add a todo panel that aggregates workflow tasks, unresolved reminders, open warnings, missing fields, expiring leases, and mock AI review items.
- [x] 5.3 Align admin navigation or governance tabs with PRD page names while keeping existing template upload, scenario simulation, system management, and audit entries available.
- [x] 5.4 Update user-facing labels to distinguish real persisted data from mock/rule-based AI, value, and map outputs.

## 6. Documentation

- [x] 6.1 Update README or module documentation to describe which PRD features are implemented as real data, mock/rule-based outputs, or deferred external integrations.
- [x] 6.2 Document deferred items: real OCR, real map provider, external registry/ERP/finance sync, legally binding e-signature, and production valuation.
