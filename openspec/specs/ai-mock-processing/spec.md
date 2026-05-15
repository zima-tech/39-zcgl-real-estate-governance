# ai-mock-processing Specification

## Purpose
TBD - created by archiving change add-ai-real-estate-governance-platform. Update Purpose after archive.
## Requirements
### Requirement: Named AI mock processors
The system SHALL expose configured AI intelligent processing actions by name and return deterministic mock results matching the selected processor name and business context.

#### Scenario: Run named processor
- **WHEN** a user starts an AI processing action named for a configured business task
- **THEN** the system creates a mock processing job and returns the deterministic result configured for that processor

#### Scenario: Unknown processor
- **WHEN** a user requests an AI processing action name that is not configured
- **THEN** the system rejects the request with an unknown processor error and creates no completed result

### Requirement: Loading and delayed completion
The system SHALL display loading state while mock AI processing is pending and complete the job after a configurable artificial delay.

#### Scenario: Pending AI job
- **WHEN** a mock AI job has been started and the configured delay has not elapsed
- **THEN** the system displays the job as processing and shows a loading state to the user

#### Scenario: Completed AI job
- **WHEN** the configured delay elapses for a mock AI job
- **THEN** the system marks the job completed and displays the generated mock result

### Requirement: Traceable AI mock result
The system SHALL store AI mock job status, processor name, input record reference, output summary, timestamps, and result source as mock.

#### Scenario: Inspect mock result history
- **WHEN** a user views the AI processing history for a business record
- **THEN** the system displays prior mock jobs with processor name, status, timestamps, and generated result summary

