import { eq } from "drizzle-orm";

import { hashAdminPassword } from "@/lib/admin/passwords";
import {
  type AdminRoleKey,
  builtInRoles,
  defaultDevelopmentRootPassword,
  defaultRootAccount,
} from "@/lib/admin/system-data";
import { client, db } from "@/lib/db/client";
import { rolesTable, usersTable } from "@/lib/db/schema";

let bootstrapPromise: Promise<void> | null = null;

const seededOrdinaryUserNames = ["陈岭", "林舟", "顾宁", "韩松"] as const;
const seededAdminNames = ["周序", "韩骁"] as const;
const seededPrimaryAdmin = {
  displayName: "系统管理员",
  id: "seed-primary-admin",
  username: "admin",
} as const;
const seededGovernanceUsers: Array<{
  displayName: string;
  id: string;
  roleKey: Exclude<AdminRoleKey, "root">;
  username: string;
}> = [
  {
    displayName: "沈采集",
    id: "seed-governance-intake",
    roleKey: "data_intake_operator",
    username: "demo.intake",
  },
  {
    displayName: "唐资料",
    id: "seed-governance-document",
    roleKey: "document_operator",
    username: "demo.document",
  },
  {
    displayName: "陆审批",
    id: "seed-governance-approver",
    roleKey: "workflow_approver",
    username: "demo.approver",
  },
  {
    displayName: "许风控",
    id: "seed-governance-risk",
    roleKey: "risk_analyst",
    username: "demo.risk",
  },
  {
    displayName: "钱测试",
    id: "seed-governance-scenario",
    roleKey: "scenario_tester",
    username: "demo.scenario",
  },
];

function getInitialRootPassword() {
  const configuredPassword = process.env.ADMIN_ROOT_PASSWORD?.trim();

  if (configuredPassword) {
    return configuredPassword;
  }

  if (process.env.NODE_ENV === "development") {
    return defaultDevelopmentRootPassword;
  }

  throw new Error(
    "ADMIN_ROOT_PASSWORD is required outside development to initialize the protected root account.",
  );
}

async function executeSchema() {
  await client.batch(
    [
      `PRAGMA foreign_keys = ON`,
      `CREATE TABLE IF NOT EXISTS roles (
        key text PRIMARY KEY NOT NULL,
        label text NOT NULL,
        summary text NOT NULL,
        permission_scope text NOT NULL,
        protection_note text NOT NULL,
        is_system integer DEFAULT true NOT NULL,
        created_at integer NOT NULL,
        updated_at integer NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS users (
        id text PRIMARY KEY NOT NULL,
        username text NOT NULL UNIQUE,
        password_hash text NOT NULL,
        display_name text NOT NULL,
        role_key text NOT NULL,
        status text NOT NULL,
        is_protected integer DEFAULT false NOT NULL,
        last_login_at integer,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (role_key) REFERENCES roles (key)
          ON UPDATE cascade
          ON DELETE restrict
      )`,
      `CREATE INDEX IF NOT EXISTS users_role_key_idx ON users (role_key)`,
      `CREATE INDEX IF NOT EXISTS users_username_idx ON users (username)`,
      `CREATE TABLE IF NOT EXISTS sessions (
        id text PRIMARY KEY NOT NULL,
        user_id text NOT NULL,
        token_hash text NOT NULL UNIQUE,
        expires_at integer NOT NULL,
        created_at integer NOT NULL,
        last_seen_at integer NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users (id)
          ON UPDATE cascade
          ON DELETE cascade
      )`,
      `CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at)`,
      `CREATE INDEX IF NOT EXISTS sessions_token_hash_idx ON sessions (token_hash)`,
      `CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions (user_id)`,
      `CREATE TABLE IF NOT EXISTS audit_logs (
        id text PRIMARY KEY NOT NULL,
        actor_type text NOT NULL,
        actor_user_id text,
        actor_username text NOT NULL,
        actor_display_name text NOT NULL,
        actor_role_key text NOT NULL,
        module text NOT NULL,
        action text NOT NULL,
        target_type text NOT NULL,
        target_id text,
        target_name text,
        summary text NOT NULL,
        request_method text,
        request_path text,
        result text NOT NULL,
        metadata text,
        created_at integer NOT NULL,
        FOREIGN KEY (actor_user_id) REFERENCES users (id)
          ON UPDATE cascade
          ON DELETE set null
      )`,
      `CREATE INDEX IF NOT EXISTS audit_logs_action_idx ON audit_logs (action)`,
      `CREATE INDEX IF NOT EXISTS audit_logs_actor_user_id_idx ON audit_logs (actor_user_id)`,
      `CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at)`,
      `CREATE INDEX IF NOT EXISTS audit_logs_module_idx ON audit_logs (module)`,
      `CREATE INDEX IF NOT EXISTS audit_logs_target_idx ON audit_logs (target_type, target_id)`,
      `CREATE TABLE IF NOT EXISTS governance_import_batches (
        id text PRIMARY KEY NOT NULL,
        source_type text NOT NULL,
        original_filename text,
        mock_scenario_id text NOT NULL,
        mock_scenario_source text NOT NULL,
        created_by_user_id text,
        created_at integer NOT NULL,
        FOREIGN KEY (created_by_user_id) REFERENCES users (id)
          ON UPDATE cascade
          ON DELETE set null
      )`,
      `CREATE INDEX IF NOT EXISTS governance_import_batches_created_at_idx ON governance_import_batches (created_at)`,
      `CREATE INDEX IF NOT EXISTS governance_import_batches_scenario_idx ON governance_import_batches (mock_scenario_id)`,
      `CREATE INDEX IF NOT EXISTS governance_import_batches_source_type_idx ON governance_import_batches (source_type)`,
      `CREATE TABLE IF NOT EXISTS governance_records (
        id text PRIMARY KEY NOT NULL,
        batch_id text,
        source_type text NOT NULL,
        original_filename text,
        mock_scenario_id text NOT NULL,
        mock_scenario_source text NOT NULL,
        status text NOT NULL,
        title text NOT NULL,
        entity_name text NOT NULL,
        property_address text NOT NULL,
        owner_name text NOT NULL,
        business_type text NOT NULL,
        normalized_fields text NOT NULL,
        ai_evidence text,
        final_outcome_status text,
        final_outcome_source text,
        final_outcome_reason text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (batch_id) REFERENCES governance_import_batches (id)
          ON UPDATE cascade
          ON DELETE set null
      )`,
      `CREATE INDEX IF NOT EXISTS governance_records_batch_id_idx ON governance_records (batch_id)`,
      `CREATE INDEX IF NOT EXISTS governance_records_created_at_idx ON governance_records (created_at)`,
      `CREATE INDEX IF NOT EXISTS governance_records_scenario_idx ON governance_records (mock_scenario_id)`,
      `CREATE INDEX IF NOT EXISTS governance_records_source_type_idx ON governance_records (source_type)`,
      `CREATE INDEX IF NOT EXISTS governance_records_status_idx ON governance_records (status)`,
      `CREATE TABLE IF NOT EXISTS governance_uploads (
        id text PRIMARY KEY NOT NULL,
        record_id text NOT NULL,
        file_name text NOT NULL,
        file_type text NOT NULL,
        file_size integer NOT NULL,
        category text NOT NULL,
        uploader_user_id text,
        uploader_name text NOT NULL,
        template_key text,
        validation_status text NOT NULL,
        validation_messages text NOT NULL,
        scenario_run_id text,
        created_at integer NOT NULL,
        FOREIGN KEY (record_id) REFERENCES governance_records (id)
          ON UPDATE cascade
          ON DELETE cascade,
        FOREIGN KEY (uploader_user_id) REFERENCES users (id)
          ON UPDATE cascade
          ON DELETE set null
      )`,
      `CREATE INDEX IF NOT EXISTS governance_uploads_category_idx ON governance_uploads (category)`,
      `CREATE INDEX IF NOT EXISTS governance_uploads_record_id_idx ON governance_uploads (record_id)`,
      `CREATE INDEX IF NOT EXISTS governance_uploads_scenario_run_idx ON governance_uploads (scenario_run_id)`,
      `CREATE TABLE IF NOT EXISTS governance_templates (
        key text PRIMARY KEY NOT NULL,
        scenario_key text NOT NULL,
        category text NOT NULL,
        label text NOT NULL,
        filename text NOT NULL,
        description text NOT NULL,
        allowed_extensions text NOT NULL,
        max_size_mb integer NOT NULL,
        required_fields text NOT NULL,
        content text NOT NULL,
        audit_enabled integer DEFAULT true NOT NULL,
        updated_at integer NOT NULL
      )`,
      `CREATE TABLE IF NOT EXISTS governance_workflow_instances (
        id text PRIMARY KEY NOT NULL,
        record_id text NOT NULL,
        status text NOT NULL,
        current_node_key text NOT NULL,
        current_node_name text NOT NULL,
        assignee_role text NOT NULL,
        assignee_user_id text,
        submitted_at integer NOT NULL,
        completed_at integer,
        scenario_run_id text,
        updated_at integer NOT NULL,
        FOREIGN KEY (record_id) REFERENCES governance_records (id)
          ON UPDATE cascade
          ON DELETE cascade
      )`,
      `CREATE INDEX IF NOT EXISTS governance_workflow_instances_record_id_idx ON governance_workflow_instances (record_id)`,
      `CREATE INDEX IF NOT EXISTS governance_workflow_instances_status_idx ON governance_workflow_instances (status)`,
      `CREATE TABLE IF NOT EXISTS governance_ai_jobs (
        id text PRIMARY KEY NOT NULL,
        record_id text NOT NULL,
        processor_name text NOT NULL,
        input_reference text NOT NULL,
        status text NOT NULL,
        mock_source text NOT NULL,
        output_summary text,
        output_payload text,
        risk_indicators text NOT NULL,
        delay_ms integer NOT NULL,
        created_at integer NOT NULL,
        completes_at integer NOT NULL,
        completed_at integer,
        scenario_run_id text,
        FOREIGN KEY (record_id) REFERENCES governance_records (id)
          ON UPDATE cascade
          ON DELETE cascade
      )`,
      `CREATE INDEX IF NOT EXISTS governance_ai_jobs_record_id_idx ON governance_ai_jobs (record_id)`,
      `CREATE INDEX IF NOT EXISTS governance_ai_jobs_status_idx ON governance_ai_jobs (status)`,
      `CREATE TABLE IF NOT EXISTS governance_risk_warnings (
        id text PRIMARY KEY NOT NULL,
        record_id text NOT NULL,
        severity text NOT NULL,
        reason text NOT NULL,
        source text NOT NULL,
        status text NOT NULL,
        remediation_hint text NOT NULL,
        related_job_id text,
        scenario_run_id text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        FOREIGN KEY (record_id) REFERENCES governance_records (id)
          ON UPDATE cascade
          ON DELETE cascade
      )`,
      `CREATE INDEX IF NOT EXISTS governance_risk_warnings_record_id_idx ON governance_risk_warnings (record_id)`,
      `CREATE INDEX IF NOT EXISTS governance_risk_warnings_severity_idx ON governance_risk_warnings (severity)`,
      `CREATE INDEX IF NOT EXISTS governance_risk_warnings_status_idx ON governance_risk_warnings (status)`,
      `CREATE TABLE IF NOT EXISTS governance_scenario_runs (
        id text PRIMARY KEY NOT NULL,
        bundle_key text NOT NULL,
        label text NOT NULL,
        status text NOT NULL,
        current_step integer NOT NULL,
        total_steps integer NOT NULL,
        created_by_user_id text,
        created_at integer NOT NULL,
        updated_at integer NOT NULL,
        completed_at integer,
        FOREIGN KEY (created_by_user_id) REFERENCES users (id)
          ON UPDATE cascade
          ON DELETE set null
      )`,
      `CREATE INDEX IF NOT EXISTS governance_scenario_runs_bundle_key_idx ON governance_scenario_runs (bundle_key)`,
      `CREATE INDEX IF NOT EXISTS governance_scenario_runs_status_idx ON governance_scenario_runs (status)`,
      `CREATE TABLE IF NOT EXISTS governance_findings (
        id text PRIMARY KEY NOT NULL,
        record_id text NOT NULL,
        kind text NOT NULL,
        severity text NOT NULL,
        is_blocking integer DEFAULT false NOT NULL,
        summary text NOT NULL,
        details text NOT NULL,
        status text NOT NULL,
        created_at integer NOT NULL,
        FOREIGN KEY (record_id) REFERENCES governance_records (id)
          ON UPDATE cascade
          ON DELETE cascade
      )`,
      `CREATE INDEX IF NOT EXISTS governance_findings_record_id_idx ON governance_findings (record_id)`,
      `CREATE INDEX IF NOT EXISTS governance_findings_severity_idx ON governance_findings (severity)`,
      `CREATE TABLE IF NOT EXISTS governance_workflow_events (
        id text PRIMARY KEY NOT NULL,
        record_id text NOT NULL,
        actor_type text NOT NULL,
        actor_user_id text,
        actor_display_name text NOT NULL,
        step text NOT NULL,
        action text NOT NULL,
        result text NOT NULL,
        summary text NOT NULL,
        reason text,
        metadata text,
        created_at integer NOT NULL,
        FOREIGN KEY (record_id) REFERENCES governance_records (id)
          ON UPDATE cascade
          ON DELETE cascade,
        FOREIGN KEY (actor_user_id) REFERENCES users (id)
          ON UPDATE cascade
          ON DELETE set null
      )`,
      `CREATE INDEX IF NOT EXISTS governance_workflow_events_created_at_idx ON governance_workflow_events (created_at)`,
      `CREATE INDEX IF NOT EXISTS governance_workflow_events_record_id_idx ON governance_workflow_events (record_id)`,
      `CREATE TABLE IF NOT EXISTS governance_reminders (
        id text PRIMARY KEY NOT NULL,
        record_id text NOT NULL,
        type text NOT NULL,
        status text NOT NULL,
        summary text NOT NULL,
        due_at integer,
        created_at integer NOT NULL,
        resolved_at integer,
        FOREIGN KEY (record_id) REFERENCES governance_records (id)
          ON UPDATE cascade
          ON DELETE cascade
      )`,
      `CREATE INDEX IF NOT EXISTS governance_reminders_record_id_idx ON governance_reminders (record_id)`,
      `CREATE INDEX IF NOT EXISTS governance_reminders_status_idx ON governance_reminders (status)`,
      `CREATE TABLE IF NOT EXISTS governance_final_outcomes (
        id text PRIMARY KEY NOT NULL,
        record_id text NOT NULL,
        status text NOT NULL,
        source text NOT NULL,
        reason text,
        created_by_user_id text,
        created_at integer NOT NULL,
        FOREIGN KEY (record_id) REFERENCES governance_records (id)
          ON UPDATE cascade
          ON DELETE cascade,
        FOREIGN KEY (created_by_user_id) REFERENCES users (id)
          ON UPDATE cascade
          ON DELETE set null
      )`,
      `CREATE INDEX IF NOT EXISTS governance_final_outcomes_record_id_idx ON governance_final_outcomes (record_id)`,
    ],
    "write",
  );
}

async function seedBuiltInRolesAndUsers() {
  const now = new Date();

  for (const role of builtInRoles) {
    await db
      .insert(rolesTable)
      .values({
        key: role.key,
        label: role.label,
        summary: role.summary,
        permissionScope: role.permissionScope,
        protectionNote: role.protectionNote,
        isSystem: true,
        createdAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: rolesTable.key,
        set: {
          label: role.label,
          summary: role.summary,
          permissionScope: role.permissionScope,
          protectionNote: role.protectionNote,
          isSystem: true,
          updatedAt: now,
        },
      });
  }

  const existingRoot = await db
    .select({
      id: usersTable.id,
    })
    .from(usersTable)
    .where(eq(usersTable.username, defaultRootAccount.username))
    .get();

  if (!existingRoot) {
    await db.insert(usersTable).values({
      id: defaultRootAccount.id,
      username: defaultRootAccount.username,
      passwordHash: await hashAdminPassword(getInitialRootPassword()),
      displayName: defaultRootAccount.displayName,
      roleKey: defaultRootAccount.roleKey,
      status: defaultRootAccount.status,
      isProtected: defaultRootAccount.isProtected,
      createdAt: now,
      updatedAt: now,
    });
  } else {
    await db
      .update(usersTable)
      .set({
        displayName: defaultRootAccount.displayName,
        roleKey: defaultRootAccount.roleKey,
        status: defaultRootAccount.status,
        isProtected: defaultRootAccount.isProtected,
        updatedAt: now,
      })
      .where(eq(usersTable.id, existingRoot.id));
  }

  const primaryAdminPasswordHash = await hashAdminPassword("admin");
  const simpleUserPasswordHash = await hashAdminPassword("123456");

  await db
    .insert(usersTable)
    .values({
      id: seededPrimaryAdmin.id,
      username: seededPrimaryAdmin.username,
      passwordHash: primaryAdminPasswordHash,
      displayName: seededPrimaryAdmin.displayName,
      roleKey: "admin",
      status: "active",
      isProtected: false,
      createdAt: new Date(Date.UTC(2026, 0, 4, 9, 0, 0, 0)),
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: usersTable.username,
      set: {
        displayName: seededPrimaryAdmin.displayName,
        passwordHash: primaryAdminPasswordHash,
        roleKey: "admin",
        status: "active",
        updatedAt: now,
      },
    });

  for (const [index, displayName] of seededAdminNames.entries()) {
    const sequence = String(index + 1).padStart(2, "0");
    const createdAt = new Date(Date.UTC(2026, 0, 4, 10 + index, 30, 0, 0));

    await db
      .insert(usersTable)
      .values({
        id: `seed-admin-${sequence}`,
        username: `demo.admin${sequence}`,
        passwordHash: simpleUserPasswordHash,
        displayName,
        roleKey: "admin",
        status: "active",
        isProtected: false,
        createdAt,
        updatedAt: createdAt,
      })
      .onConflictDoUpdate({
        target: usersTable.username,
        set: {
          displayName,
          passwordHash: simpleUserPasswordHash,
          roleKey: "admin",
          status: "active",
          updatedAt: createdAt,
        },
      });
  }

  for (const [index, displayName] of seededOrdinaryUserNames.entries()) {
    const sequence = String(index + 1).padStart(2, "0");
    const createdAt = new Date(Date.UTC(2026, 0, 6, 1 + index, 0, 0, 0));

    await db
      .insert(usersTable)
      .values({
        id: `seed-user-${sequence}`,
        username: `demo.user${sequence}`,
        passwordHash: simpleUserPasswordHash,
        displayName,
        roleKey: "user",
        status: "active",
        isProtected: false,
        createdAt,
        updatedAt: createdAt,
      })
      .onConflictDoUpdate({
        target: usersTable.username,
        set: {
          displayName,
          passwordHash: simpleUserPasswordHash,
          roleKey: "user",
          status: "active",
          updatedAt: createdAt,
        },
      });
  }

  for (const [index, user] of seededGovernanceUsers.entries()) {
    const createdAt = new Date(Date.UTC(2026, 0, 8, 2 + index, 0, 0, 0));

    await db
      .insert(usersTable)
      .values({
        id: user.id,
        username: user.username,
        passwordHash: simpleUserPasswordHash,
        displayName: user.displayName,
        roleKey: user.roleKey,
        status: "active",
        isProtected: false,
        createdAt,
        updatedAt: createdAt,
      })
      .onConflictDoUpdate({
        target: usersTable.username,
        set: {
          displayName: user.displayName,
          passwordHash: simpleUserPasswordHash,
          roleKey: user.roleKey,
          status: "active",
          updatedAt: createdAt,
        },
      });
  }
}

export async function ensureAdminDatabase() {
  if (!bootstrapPromise) {
    bootstrapPromise = executeSchema()
      .then(seedBuiltInRolesAndUsers)
      .catch((error) => {
        bootstrapPromise = null;
        throw error;
      });
  }

  await bootstrapPromise;
}
