import { relations } from "drizzle-orm";
import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

import type { AdminRoleKey, AdminUserStatus } from "@/lib/admin/system-data";

export type GovernanceSourceType =
  | "docx"
  | "excel"
  | "image"
  | "manual"
  | "word";
export type GovernanceUploadCategory = "docx" | "excel" | "image";
export type GovernanceWorkflowStatus =
  | "not_submitted"
  | "pending"
  | "completed"
  | "rejected"
  | "returned";
export type GovernanceAiJobStatus = "processing" | "completed" | "failed";
export type GovernanceRiskSeverity = "info" | "warning" | "critical";
export type GovernanceScenarioRunStatus = "running" | "completed" | "reset";
export type GovernanceMockScenarioSource =
  | "filename"
  | "parameter"
  | "manual"
  | "fallback";
export type GovernanceActorType = "admin" | "system";
export type GovernanceRecordStatus =
  | "intake_completed"
  | "ai_recognized"
  | "approval_pending"
  | "manual_correction_required"
  | "human_review_required"
  | "risk_review_required"
  | "approved"
  | "rejected"
  | "escalated"
  | "archived";

export const rolesTable = sqliteTable("roles", {
  key: text("key").$type<AdminRoleKey>().primaryKey(),
  label: text("label").notNull(),
  summary: text("summary").notNull(),
  permissionScope: text("permission_scope", { mode: "json" })
    .$type<string[]>()
    .notNull(),
  protectionNote: text("protection_note").notNull(),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const usersTable = sqliteTable(
  "users",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull().unique(),
    passwordHash: text("password_hash").notNull(),
    displayName: text("display_name").notNull(),
    roleKey: text("role_key")
      .$type<AdminRoleKey>()
      .notNull()
      .references(() => rolesTable.key, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    status: text("status").$type<AdminUserStatus>().notNull(),
    isProtected: integer("is_protected", { mode: "boolean" })
      .notNull()
      .default(false),
    lastLoginAt: integer("last_login_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    roleKeyIdx: index("users_role_key_idx").on(table.roleKey),
    usernameIdx: index("users_username_idx").on(table.username),
  }),
);

export const sessionsTable = sqliteTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    tokenHash: text("token_hash").notNull().unique(),
    expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    lastSeenAt: integer("last_seen_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    expiresAtIdx: index("sessions_expires_at_idx").on(table.expiresAt),
    tokenHashIdx: index("sessions_token_hash_idx").on(table.tokenHash),
    userIdIdx: index("sessions_user_id_idx").on(table.userId),
  }),
);

export const auditLogsTable = sqliteTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorType: text("actor_type")
      .$type<"admin" | "kiosk" | "system">()
      .notNull(),
    actorUserId: text("actor_user_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    actorUsername: text("actor_username").notNull(),
    actorDisplayName: text("actor_display_name").notNull(),
    actorRoleKey: text("actor_role_key").notNull(),
    module: text("module").notNull(),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: text("target_id"),
    targetName: text("target_name"),
    summary: text("summary").notNull(),
    requestMethod: text("request_method"),
    requestPath: text("request_path"),
    result: text("result").$type<"success" | "failure">().notNull(),
    metadata: text("metadata", { mode: "json" }).$type<Record<
      string,
      unknown
    > | null>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    actionIdx: index("audit_logs_action_idx").on(table.action),
    actorUserIdIdx: index("audit_logs_actor_user_id_idx").on(table.actorUserId),
    createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
    moduleIdx: index("audit_logs_module_idx").on(table.module),
    targetIdx: index("audit_logs_target_idx").on(
      table.targetType,
      table.targetId,
    ),
  }),
);

export const governanceImportBatchesTable = sqliteTable(
  "governance_import_batches",
  {
    id: text("id").primaryKey(),
    sourceType: text("source_type").$type<GovernanceSourceType>().notNull(),
    originalFilename: text("original_filename"),
    mockScenarioId: text("mock_scenario_id").notNull(),
    mockScenarioSource: text("mock_scenario_source")
      .$type<GovernanceMockScenarioSource>()
      .notNull(),
    createdByUserId: text("created_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    createdAtIdx: index("governance_import_batches_created_at_idx").on(
      table.createdAt,
    ),
    scenarioIdx: index("governance_import_batches_scenario_idx").on(
      table.mockScenarioId,
    ),
    sourceTypeIdx: index("governance_import_batches_source_type_idx").on(
      table.sourceType,
    ),
  }),
);

export const governanceRecordsTable = sqliteTable(
  "governance_records",
  {
    id: text("id").primaryKey(),
    batchId: text("batch_id").references(() => governanceImportBatchesTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    sourceType: text("source_type").$type<GovernanceSourceType>().notNull(),
    originalFilename: text("original_filename"),
    mockScenarioId: text("mock_scenario_id").notNull(),
    mockScenarioSource: text("mock_scenario_source")
      .$type<GovernanceMockScenarioSource>()
      .notNull(),
    status: text("status").$type<GovernanceRecordStatus>().notNull(),
    title: text("title").notNull(),
    entityName: text("entity_name").notNull(),
    propertyAddress: text("property_address").notNull(),
    ownerName: text("owner_name").notNull(),
    businessType: text("business_type").notNull(),
    normalizedFields: text("normalized_fields", { mode: "json" })
      .$type<Record<string, unknown>>()
      .notNull(),
    aiEvidence: text("ai_evidence", { mode: "json" }).$type<Record<
      string,
      unknown
    > | null>(),
    finalOutcomeStatus: text("final_outcome_status"),
    finalOutcomeSource: text("final_outcome_source"),
    finalOutcomeReason: text("final_outcome_reason"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    batchIdIdx: index("governance_records_batch_id_idx").on(table.batchId),
    createdAtIdx: index("governance_records_created_at_idx").on(
      table.createdAt,
    ),
    scenarioIdx: index("governance_records_scenario_idx").on(
      table.mockScenarioId,
    ),
    sourceTypeIdx: index("governance_records_source_type_idx").on(
      table.sourceType,
    ),
    statusIdx: index("governance_records_status_idx").on(table.status),
  }),
);

export const governanceUploadsTable = sqliteTable(
  "governance_uploads",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => governanceRecordsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    fileName: text("file_name").notNull(),
    fileType: text("file_type").notNull(),
    fileSize: integer("file_size").notNull(),
    category: text("category").$type<GovernanceUploadCategory>().notNull(),
    uploaderUserId: text("uploader_user_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    uploaderName: text("uploader_name").notNull(),
    templateKey: text("template_key"),
    validationStatus: text("validation_status")
      .$type<"accepted" | "warning" | "rejected">()
      .notNull(),
    validationMessages: text("validation_messages", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    scenarioRunId: text("scenario_run_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    categoryIdx: index("governance_uploads_category_idx").on(table.category),
    recordIdIdx: index("governance_uploads_record_id_idx").on(table.recordId),
    scenarioRunIdx: index("governance_uploads_scenario_run_idx").on(
      table.scenarioRunId,
    ),
  }),
);

export const governanceTemplatesTable = sqliteTable("governance_templates", {
  key: text("key").primaryKey(),
  scenarioKey: text("scenario_key").notNull(),
  category: text("category").$type<GovernanceUploadCategory>().notNull(),
  label: text("label").notNull(),
  filename: text("filename").notNull(),
  description: text("description").notNull(),
  allowedExtensions: text("allowed_extensions", { mode: "json" })
    .$type<string[]>()
    .notNull(),
  maxSizeMb: integer("max_size_mb").notNull(),
  requiredFields: text("required_fields", { mode: "json" })
    .$type<string[]>()
    .notNull(),
  content: text("content").notNull(),
  auditEnabled: integer("audit_enabled", { mode: "boolean" })
    .notNull()
    .default(true),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
});

export const governanceWorkflowInstancesTable = sqliteTable(
  "governance_workflow_instances",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => governanceRecordsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    status: text("status").$type<GovernanceWorkflowStatus>().notNull(),
    currentNodeKey: text("current_node_key").notNull(),
    currentNodeName: text("current_node_name").notNull(),
    assigneeRole: text("assignee_role").notNull(),
    assigneeUserId: text("assignee_user_id"),
    submittedAt: integer("submitted_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    scenarioRunId: text("scenario_run_id"),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    recordIdIdx: index("governance_workflow_instances_record_id_idx").on(
      table.recordId,
    ),
    statusIdx: index("governance_workflow_instances_status_idx").on(
      table.status,
    ),
  }),
);

export const governanceAiJobsTable = sqliteTable(
  "governance_ai_jobs",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => governanceRecordsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    processorName: text("processor_name").notNull(),
    inputReference: text("input_reference").notNull(),
    status: text("status").$type<GovernanceAiJobStatus>().notNull(),
    mockSource: text("mock_source").notNull(),
    outputSummary: text("output_summary"),
    outputPayload: text("output_payload", { mode: "json" }).$type<Record<
      string,
      unknown
    > | null>(),
    riskIndicators: text("risk_indicators", { mode: "json" })
      .$type<string[]>()
      .notNull(),
    delayMs: integer("delay_ms").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    completesAt: integer("completes_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    scenarioRunId: text("scenario_run_id"),
  },
  (table) => ({
    recordIdIdx: index("governance_ai_jobs_record_id_idx").on(table.recordId),
    statusIdx: index("governance_ai_jobs_status_idx").on(table.status),
  }),
);

export const governanceRiskWarningsTable = sqliteTable(
  "governance_risk_warnings",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => governanceRecordsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    severity: text("severity").$type<GovernanceRiskSeverity>().notNull(),
    reason: text("reason").notNull(),
    source: text("source").notNull(),
    status: text("status").notNull(),
    remediationHint: text("remediation_hint").notNull(),
    relatedJobId: text("related_job_id"),
    scenarioRunId: text("scenario_run_id"),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    recordIdIdx: index("governance_risk_warnings_record_id_idx").on(
      table.recordId,
    ),
    severityIdx: index("governance_risk_warnings_severity_idx").on(
      table.severity,
    ),
    statusIdx: index("governance_risk_warnings_status_idx").on(table.status),
  }),
);

export const governanceScenarioRunsTable = sqliteTable(
  "governance_scenario_runs",
  {
    id: text("id").primaryKey(),
    bundleKey: text("bundle_key").notNull(),
    label: text("label").notNull(),
    status: text("status").$type<GovernanceScenarioRunStatus>().notNull(),
    currentStep: integer("current_step").notNull(),
    totalSteps: integer("total_steps").notNull(),
    createdByUserId: text("created_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
  },
  (table) => ({
    bundleKeyIdx: index("governance_scenario_runs_bundle_key_idx").on(
      table.bundleKey,
    ),
    statusIdx: index("governance_scenario_runs_status_idx").on(table.status),
  }),
);

export const governanceFindingsTable = sqliteTable(
  "governance_findings",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => governanceRecordsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    kind: text("kind").notNull(),
    severity: text("severity").notNull(),
    isBlocking: integer("is_blocking", { mode: "boolean" })
      .notNull()
      .default(false),
    summary: text("summary").notNull(),
    details: text("details").notNull(),
    status: text("status").notNull(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    recordIdIdx: index("governance_findings_record_id_idx").on(table.recordId),
    severityIdx: index("governance_findings_severity_idx").on(table.severity),
  }),
);

export const governanceWorkflowEventsTable = sqliteTable(
  "governance_workflow_events",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => governanceRecordsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    actorType: text("actor_type").$type<GovernanceActorType>().notNull(),
    actorUserId: text("actor_user_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    actorDisplayName: text("actor_display_name").notNull(),
    step: text("step").notNull(),
    action: text("action").notNull(),
    result: text("result").notNull(),
    summary: text("summary").notNull(),
    reason: text("reason"),
    metadata: text("metadata", { mode: "json" }).$type<Record<
      string,
      unknown
    > | null>(),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    createdAtIdx: index("governance_workflow_events_created_at_idx").on(
      table.createdAt,
    ),
    recordIdIdx: index("governance_workflow_events_record_id_idx").on(
      table.recordId,
    ),
  }),
);

export const governanceRemindersTable = sqliteTable(
  "governance_reminders",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => governanceRecordsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    type: text("type").notNull(),
    status: text("status").notNull(),
    summary: text("summary").notNull(),
    dueAt: integer("due_at", { mode: "timestamp_ms" }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
    resolvedAt: integer("resolved_at", { mode: "timestamp_ms" }),
  },
  (table) => ({
    recordIdIdx: index("governance_reminders_record_id_idx").on(table.recordId),
    statusIdx: index("governance_reminders_status_idx").on(table.status),
  }),
);

export const governanceFinalOutcomesTable = sqliteTable(
  "governance_final_outcomes",
  {
    id: text("id").primaryKey(),
    recordId: text("record_id")
      .notNull()
      .references(() => governanceRecordsTable.id, {
        onDelete: "cascade",
        onUpdate: "cascade",
      }),
    status: text("status").notNull(),
    source: text("source").notNull(),
    reason: text("reason"),
    createdByUserId: text("created_by_user_id").references(() => usersTable.id, {
      onDelete: "set null",
      onUpdate: "cascade",
    }),
    createdAt: integer("created_at", { mode: "timestamp_ms" }).notNull(),
  },
  (table) => ({
    recordIdIdx: index("governance_final_outcomes_record_id_idx").on(
      table.recordId,
    ),
  }),
);

export const rolesRelations = relations(rolesTable, ({ many }) => ({
  users: many(usersTable),
}));

export const usersRelations = relations(usersTable, ({ one, many }) => ({
  role: one(rolesTable, {
    fields: [usersTable.roleKey],
    references: [rolesTable.key],
  }),
  auditLogs: many(auditLogsTable),
  sessions: many(sessionsTable),
}));

export const sessionsRelations = relations(sessionsTable, ({ one }) => ({
  user: one(usersTable, {
    fields: [sessionsTable.userId],
    references: [usersTable.id],
  }),
}));

export const auditLogsRelations = relations(auditLogsTable, ({ one }) => ({
  actor: one(usersTable, {
    fields: [auditLogsTable.actorUserId],
    references: [usersTable.id],
  }),
}));

export const governanceImportBatchesRelations = relations(
  governanceImportBatchesTable,
  ({ many, one }) => ({
    createdBy: one(usersTable, {
      fields: [governanceImportBatchesTable.createdByUserId],
      references: [usersTable.id],
    }),
    records: many(governanceRecordsTable),
  }),
);

export const governanceRecordsRelations = relations(
  governanceRecordsTable,
  ({ many, one }) => ({
    batch: one(governanceImportBatchesTable, {
      fields: [governanceRecordsTable.batchId],
      references: [governanceImportBatchesTable.id],
    }),
    aiJobs: many(governanceAiJobsTable),
    findings: many(governanceFindingsTable),
    finalOutcomes: many(governanceFinalOutcomesTable),
    reminders: many(governanceRemindersTable),
    riskWarnings: many(governanceRiskWarningsTable),
    uploads: many(governanceUploadsTable),
    workflowInstances: many(governanceWorkflowInstancesTable),
    workflowEvents: many(governanceWorkflowEventsTable),
  }),
);

export const governanceFindingsRelations = relations(
  governanceFindingsTable,
  ({ one }) => ({
    record: one(governanceRecordsTable, {
      fields: [governanceFindingsTable.recordId],
      references: [governanceRecordsTable.id],
    }),
  }),
);

export const governanceWorkflowEventsRelations = relations(
  governanceWorkflowEventsTable,
  ({ one }) => ({
    actor: one(usersTable, {
      fields: [governanceWorkflowEventsTable.actorUserId],
      references: [usersTable.id],
    }),
    record: one(governanceRecordsTable, {
      fields: [governanceWorkflowEventsTable.recordId],
      references: [governanceRecordsTable.id],
    }),
  }),
);

export const governanceRemindersRelations = relations(
  governanceRemindersTable,
  ({ one }) => ({
    record: one(governanceRecordsTable, {
      fields: [governanceRemindersTable.recordId],
      references: [governanceRecordsTable.id],
    }),
  }),
);

export const governanceFinalOutcomesRelations = relations(
  governanceFinalOutcomesTable,
  ({ one }) => ({
    createdBy: one(usersTable, {
      fields: [governanceFinalOutcomesTable.createdByUserId],
      references: [usersTable.id],
    }),
    record: one(governanceRecordsTable, {
      fields: [governanceFinalOutcomesTable.recordId],
      references: [governanceRecordsTable.id],
    }),
  }),
);

export const governanceUploadsRelations = relations(
  governanceUploadsTable,
  ({ one }) => ({
    record: one(governanceRecordsTable, {
      fields: [governanceUploadsTable.recordId],
      references: [governanceRecordsTable.id],
    }),
    uploader: one(usersTable, {
      fields: [governanceUploadsTable.uploaderUserId],
      references: [usersTable.id],
    }),
  }),
);

export const governanceWorkflowInstancesRelations = relations(
  governanceWorkflowInstancesTable,
  ({ one }) => ({
    record: one(governanceRecordsTable, {
      fields: [governanceWorkflowInstancesTable.recordId],
      references: [governanceRecordsTable.id],
    }),
  }),
);

export const governanceAiJobsRelations = relations(
  governanceAiJobsTable,
  ({ one }) => ({
    record: one(governanceRecordsTable, {
      fields: [governanceAiJobsTable.recordId],
      references: [governanceRecordsTable.id],
    }),
  }),
);

export const governanceRiskWarningsRelations = relations(
  governanceRiskWarningsTable,
  ({ one }) => ({
    record: one(governanceRecordsTable, {
      fields: [governanceRiskWarningsTable.recordId],
      references: [governanceRecordsTable.id],
    }),
  }),
);
