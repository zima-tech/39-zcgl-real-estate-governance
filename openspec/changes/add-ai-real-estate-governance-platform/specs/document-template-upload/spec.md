## ADDED Requirements

### Requirement: Supported business document uploads
The system SHALL allow users to upload DOCX, image, and Excel files to a business record and store file metadata including file name, type, size, uploader, upload time, and related business record.

#### Scenario: Upload supported file
- **WHEN** a user uploads a DOCX, image, or Excel file for a business record
- **THEN** the system stores the file metadata and associates it with the selected business record

#### Scenario: Upload unsupported file
- **WHEN** a user uploads a file type outside the configured supported formats
- **THEN** the system rejects the file and displays the supported upload formats

### Requirement: Template download
The system SHALL provide downloadable templates for configured business scenarios and file categories.

#### Scenario: Download available template
- **WHEN** a user selects a template for a business scenario
- **THEN** the system returns the corresponding template file and records the download action where audit logging is enabled

#### Scenario: Missing template
- **WHEN** a user requests a template that is not configured
- **THEN** the system displays that the template is unavailable and does not create an upload record

### Requirement: Upload validation result
The system SHALL return a validation result for each upload indicating accepted status, warnings, or rejection reasons.

#### Scenario: Accepted upload with warning
- **WHEN** a supported file is uploaded with non-blocking metadata issues
- **THEN** the system accepts the upload and displays the warning in the upload result

#### Scenario: Rejected upload
- **WHEN** a file violates size, type, or required association rules
- **THEN** the system rejects the upload and displays the rejection reason
