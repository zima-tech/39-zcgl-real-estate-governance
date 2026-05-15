# business-data-management Specification

## Purpose
TBD - created by archiving change add-ai-real-estate-governance-platform. Update Purpose after archive.
## Requirements
### Requirement: Business record source capture
The system SHALL allow users to create and update real estate and enterprise governance business records through a unified intake form with structured fields, source metadata, status, and last updated time.

#### Scenario: Create business record
- **WHEN** a user submits required business record fields from the unified intake form
- **THEN** the system stores the record with a unique identifier, source metadata, status, and audit timestamp

#### Scenario: Update business record
- **WHEN** a user edits an existing business record and saves valid changes
- **THEN** the system updates the record and records the latest modification time without losing the original creation metadata

### Requirement: Automatic aggregation and dynamic updates
The system SHALL aggregate records, uploads, workflow state, AI mock results, and risk warnings into a unified business detail view.

#### Scenario: View aggregated business detail
- **WHEN** a user opens a business record detail page
- **THEN** the system displays the current record fields, related uploads, workflow progress, AI mock outputs, and active risk warnings

#### Scenario: Related state changes
- **WHEN** a related upload, workflow transition, AI job, or warning changes
- **THEN** the system reflects the updated related state on the business detail view

### Requirement: Data validation and deduplication hints
The system SHALL validate required fields, data formats, and potential duplicate records before accepting or updating business data.

#### Scenario: Missing required field
- **WHEN** a user submits a record without a required field
- **THEN** the system rejects the submission and identifies the missing field

#### Scenario: Potential duplicate record
- **WHEN** a submitted record matches an existing record by configured identity fields
- **THEN** the system saves no duplicate by default and presents a duplicate warning with the matching record reference

