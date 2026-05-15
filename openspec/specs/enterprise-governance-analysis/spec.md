# enterprise-governance-analysis Specification

## Purpose
TBD - created by archiving change align-prd-governance-delta. Update Purpose after archive.
## Requirements
### Requirement: Enterprise ledger
The system SHALL provide an enterprise governance ledger with enterprise name, business type, registration number when available, owner or responsible party, workflow status, warning counts, compliance status, and latest remediation hint.

#### Scenario: Display enterprise ledger
- **WHEN** a user views the enterprise governance ledger
- **THEN** the system lists enterprise governance records with workflow, warning, and compliance summary fields

### Requirement: Governance analysis
The system SHALL provide governance analysis derived from record completeness, workflow state, warning severity, duplicate findings, compliance findings, and mock AI outputs.

#### Scenario: Analyze compliance status
- **WHEN** an enterprise record has missing required fields or open compliance findings
- **THEN** the system marks the governance analysis status as needing remediation and shows the blocking reasons

#### Scenario: Analyze healthy record
- **WHEN** an enterprise record has complete required fields, no open critical warnings, and an approved workflow outcome
- **THEN** the system marks the governance analysis status as normal or archived

### Requirement: Remediation focus
The system SHALL summarize remediation focus items for enterprise records from open warnings, findings, workflow returns, and mock AI risk indicators.

#### Scenario: Show remediation focus
- **WHEN** a user opens enterprise governance analysis
- **THEN** the system groups remediation focus items by enterprise record and source

