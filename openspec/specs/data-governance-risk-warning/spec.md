# data-governance-risk-warning Specification

## Purpose
TBD - created by archiving change add-ai-real-estate-governance-platform. Update Purpose after archive.
## Requirements
### Requirement: Data governance checks
The system SHALL evaluate configured data quality rules for completeness, consistency, duplication, and stale information against real business records.

#### Scenario: Completeness issue detected
- **WHEN** a business record lacks configured required governance data
- **THEN** the system creates or displays a data quality issue for the missing information

#### Scenario: No data quality issue
- **WHEN** a business record satisfies configured governance rules
- **THEN** the system marks the governance check as passed for that record

### Requirement: Risk warning generation
The system SHALL generate risk warning records from configured business rules and mock AI processing outputs.

#### Scenario: Rule-based warning
- **WHEN** a business record matches a configured risk rule
- **THEN** the system creates a risk warning with severity, reason, source, and related business record

#### Scenario: AI mock warning
- **WHEN** a completed AI mock result includes configured risk indicators
- **THEN** the system creates or updates the related risk warning record

### Requirement: Risk remediation hints
The system SHALL display remediation hints for each risk warning based on warning type and severity.

#### Scenario: View warning detail
- **WHEN** a user opens a risk warning detail
- **THEN** the system displays warning reason, severity, source, related record, status, and remediation hint

