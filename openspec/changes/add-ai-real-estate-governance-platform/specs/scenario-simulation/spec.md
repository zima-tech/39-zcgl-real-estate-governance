## ADDED Requirements

### Requirement: Seeded scenario bundles
The system SHALL provide seeded scenario bundles that create business records, uploads, workflow states, AI mock jobs, and risk warnings for demonstration and acceptance testing.

#### Scenario: Start scenario bundle
- **WHEN** a user starts a configured scenario bundle
- **THEN** the system creates the scenario records and marks them with scenario source metadata

#### Scenario: Unknown scenario bundle
- **WHEN** a user requests a scenario bundle that is not configured
- **THEN** the system rejects the request and creates no scenario data

### Requirement: Scenario-driven process playback
The system SHALL allow scenario simulation to drive business state changes across data intake, upload, workflow, AI mock processing, and risk warning views.

#### Scenario: Advance scenario step
- **WHEN** a user advances a scenario to the next configured step
- **THEN** the system applies the next fixture state change and updates the affected platform views

#### Scenario: Scenario reaches final state
- **WHEN** all configured scenario steps have been applied
- **THEN** the system marks the scenario run complete and preserves the resulting records for review

### Requirement: Scenario cleanup
The system SHALL support cleanup or reset of scenario-created data without deleting non-scenario business records.

#### Scenario: Reset scenario data
- **WHEN** a user resets a scenario run
- **THEN** the system removes or archives only data marked with that scenario run identifier
