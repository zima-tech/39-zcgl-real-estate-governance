# governance-homepage-overview Specification

## Purpose
TBD - created by archiving change align-prd-governance-delta. Update Purpose after archive.
## Requirements
### Requirement: Homepage data overview
The system SHALL provide a homepage overview for governance data counts, including total governance records, real-estate assets, enterprise records, pending workflow tasks, active risk warnings, uploads, and mock AI processing jobs.

#### Scenario: View homepage overview
- **WHEN** a user opens the platform homepage or governance dashboard
- **THEN** the system displays current overview metrics derived from persisted governance data

### Requirement: Todo panel
The system SHALL provide a todo panel that aggregates pending workflow tasks, unresolved reminders, open risk warnings, missing required fields, expiring leases, and mock AI jobs requiring refresh or review.

#### Scenario: View pending todos
- **WHEN** a user opens the todo panel
- **THEN** the system lists actionable items with source type, related record, severity or priority, and target action

### Requirement: PRD page alignment
The system SHALL expose navigation or tabs that map the PRD page structure to implemented capabilities: data overview, todo items, real-estate management, enterprise governance, workflow management, and risk warning.

#### Scenario: Navigate PRD-aligned views
- **WHEN** a user follows PRD-aligned navigation
- **THEN** the system routes them to the corresponding implemented view without hiding existing template upload, scenario simulation, audit, or system management capabilities

