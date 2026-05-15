## Context

The project already has a governance module with records, uploads, workflow events, reminders, mock AI jobs, risk warnings, scenario runs, roles, and audit logs. The PRD additionally names a product shape that is more asset-centric: real-estate list, map distribution, enterprise ledger, governance analysis, value assessment, lease expiry warnings, and homepage todos.

The existing implementation should remain the base because it already satisfies source collection, online workflow, traceability, mock AI handling, and risk warning. This change adds PRD-facing views and structured fields where the current generic governance record model is too broad.

## Goals / Non-Goals

**Goals:**

- Add PRD-specific asset and enterprise views without replacing the existing governance workbench.
- Store or derive the PRD fields needed for property list, map distribution, enterprise ledger, governance analysis, dashboard overview, and todo panels.
- Keep calculations lightweight and explainable through rules, mock data, or normalized fields.
- Preserve current template upload, workflow, warning, mock AI, scenario, RBAC, and audit behavior.

**Non-Goals:**

- Real OCR, LLM, computer vision, or external AI integration.
- Real map provider SDK integration or geocoding service dependency.
- External registry, ERP, lease, rent, appraisal, or finance-system synchronization.
- Legally binding electronic signature, production archival compliance, or production valuation.
- Removing existing governance, template, workflow, warning, scenario, system management, or audit modules.

## Decisions

1. Extend the governance domain instead of creating a separate asset system.

   Rationale: Existing records already hold entity, owner, address, uploads, workflows, AI jobs, and warnings. Adding asset-specific normalized fields or companion tables keeps the new PRD views connected to traceability and approval state.

   Alternative considered: Create an independent real-estate module. That would match the PRD navigation names but duplicate workflow, warning, upload, and audit logic.

2. Represent map distribution with stored coordinates when available and address fallback otherwise.

   Rationale: The PRD asks for map visualization, but the current scope has no map provider or geocoding dependency. A provider-neutral data shape can support a simple distribution panel now and a real map later.

   Alternative considered: Add a map SDK immediately. That would increase dependency and data-quality scope before coordinates are reliably available.

3. Keep value assessment, rent overdue, lease expiry, and governance score as derived indicators.

   Rationale: The PRD needs risk and analysis output, but there is no authoritative financial, appraisal, lease, or compliance source in the current project. Rule-based and mock-derived indicators fit the current mock AI boundary.

   Alternative considered: Build valuation and receivables subsystems. That would exceed the current PRD evidence and duplicate systems not present in this codebase.

4. Add PRD navigation as views over existing routes where possible.

   Rationale: The current module already has routes for records, templates, workflow, warnings, and scenarios. New pages should reuse `GovernanceWorkspacePage` patterns and service aggregation rather than inventing a second UI stack.

   Alternative considered: Restructure everything into the PRD's five-page tree. That risks losing already useful upload, scenario, RBAC, and audit workflows.

## Risks / Trade-offs

- PRD users may expect a real geographic map -> label address-only or coordinate-only distribution clearly and keep map provider integration out of this change.
- Derived valuation may be mistaken for formal appraisal -> display it as mock or rule-based assessment and retain source/explanation fields.
- Enterprise governance analysis can become too generic -> start with measurable fields already present: workflow state, warnings, findings, missing fields, compliance checks, and remediation hints.
- Adding many optional fields to `normalizedFields` can weaken typing -> define typed service DTOs and normalize inputs before rendering.
- Existing README says several modules are placeholders -> update documentation only when implementation is applied, not in this proposal-only step.

## Migration Plan

- Add asset/enterprise field definitions either as typed normalized fields or as companion tables linked to governance records.
- Seed representative records with PRD fields: property number, property type, area, ownership status, tenant, lease expiry, value, risk level, location label, and optional coordinates.
- Add service aggregations for asset ledger, map distribution, enterprise analysis, and homepage overview.
- Add UI views following the current admin shell and Ant Design patterns.
- Roll back by hiding the new navigation entries and leaving existing governance records/workflows intact.

## Open Questions

- Should map distribution be a simple local visualization first, or should a real provider be selected later?
- Should rent overdue warnings be demo-only until a receivables data source exists?
- Should asset value be manually entered, imported from Excel, or calculated from mock rules in the first implementation?
