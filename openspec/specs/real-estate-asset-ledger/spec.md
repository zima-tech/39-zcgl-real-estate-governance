# real-estate-asset-ledger Specification

## Purpose
TBD - created by archiving change align-prd-governance-delta. Update Purpose after archive.
## Requirements
### Requirement: Property ledger fields
The system SHALL store or derive real-estate ledger fields for property number, property type, area, ownership status, owner, tenant, lease expiry date, assessed value, risk level, address, and optional map coordinates.

#### Scenario: Display property ledger row
- **WHEN** a user views the real-estate asset ledger
- **THEN** the system displays each property record with its ledger fields and linked governance status

#### Scenario: Missing optional map coordinates
- **WHEN** a property record has an address but no coordinates
- **THEN** the system keeps the record visible in the ledger and marks the map distribution source as address-only

### Requirement: Property list filtering
The system SHALL allow users to filter property records by property type, ownership status, tenant, lease expiry status, risk level, and workflow status.

#### Scenario: Filter lease expiry warnings
- **WHEN** a user filters for properties with expiring leases
- **THEN** the system returns property records whose lease expiry indicator is within the configured warning window

### Requirement: Map distribution panel
The system SHALL provide a map-distribution panel that groups property records by location, coordinate availability, risk level, and ownership status.

#### Scenario: View distribution summary
- **WHEN** a user opens the map-distribution panel
- **THEN** the system displays property counts and risk distribution by location group

### Requirement: Asset value and lease indicators
The system SHALL generate rule-based or mock-derived indicators for value assessment, lease expiry warning, rent overdue warning, and ownership risk when source fields are available.

#### Scenario: Generate lease expiry warning
- **WHEN** a property lease expiry date falls within the configured warning window
- **THEN** the system creates or displays a lease expiry indicator linked to the property record

#### Scenario: Explain mock value assessment
- **WHEN** a user views a value assessment generated without an external appraisal source
- **THEN** the system labels the assessment as rule-based or mock-derived and shows the source fields used

