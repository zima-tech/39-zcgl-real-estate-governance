## Why

The current implementation already covers the main governance workflow from the PRD through a unified workbench, but it does not yet expose several asset-specific product views named in the PRD. This change aligns the implemented platform with the PRD without removing useful existing capabilities such as template upload, scenario simulation, mock AI processing, RBAC, and audit logs.

## What Changes

- Add a real-estate asset ledger layer on top of existing governance records, including PRD fields for property number, type, area, ownership status, tenant, lease expiry, value, and risk level.
- Add property list and map-distribution views for real-estate records, using structured location fields or coordinates when available and falling back to address-only display when not.
- Add enterprise ledger and governance analysis views that summarize enterprise records, governance score, compliance status, warning counts, workflow state, and remediation focus.
- Add value assessment and lease/receivable warning outputs as rule-based or mock-calculated business indicators, clearly separated from real appraisal or financial system integrations.
- Add dashboard data overview and todo panels that map the PRD homepage to existing governance counts, workflow tasks, risk warnings, and pending remediation items.
- Keep existing template upload, mock AI, scenario simulation, RBAC, and audit logging because they support the PRD's source collection, automatic validation, online circulation, traceability, and demonstration needs.
- Do not add real OCR, real map provider integration, third-party cross-system data exchange, legally binding e-signature, or production-grade valuation engines in this change.

## Capabilities

### New Capabilities

- `real-estate-asset-ledger`: Structured property ledger fields, property list display, map-distribution data, lease expiry indicators, ownership status, tenant, area, value, and risk level.
- `enterprise-governance-analysis`: Enterprise ledger and analysis views for governance status, compliance checks, warning distribution, workflow progress, and remediation focus.
- `governance-homepage-overview`: Homepage data overview and todo panels aligned with current governance records, workflow pending tasks, risk warnings, uploads, and scenario/mock AI states.

### Modified Capabilities

None.

## Impact

- Affected UI areas: governance dashboard, business record list/detail, new real-estate ledger view, map-distribution panel, enterprise governance analysis view, and homepage/todo panels.
- Affected APIs/services: governance record list/detail aggregation, dashboard summary, risk warning generation, and derived analysis endpoints or service functions.
- Affected data model: normalized governance fields or companion tables for property-specific fields, optional location fields, lease expiry, valuation, tenant, ownership status, enterprise analysis metrics, and derived indicators.
- Existing mock AI and rule-based processing remain bounded; real external OCR, map, valuation, registry, ERP, and finance integrations are out of scope.
