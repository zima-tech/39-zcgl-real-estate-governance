import { randomUUID } from "node:crypto";

import { desc } from "drizzle-orm";

import type { AdminSessionUser } from "@/lib/admin/system-data";
import { formatAdminDate } from "@/lib/admin/system-data";
import { db } from "@/lib/db/client";
import { ensureAdminDatabase } from "@/lib/db/ensure-admin-database";
import { auditLogsTable } from "@/lib/db/schema";

type AuditActorType = "admin" | "kiosk" | "system";

type AuditActor = {
  displayName: string;
  roleKey: string;
  type: AuditActorType;
  userId?: string | null;
  username: string;
};

type AuditTarget = {
  id?: string | null;
  name?: string | null;
  type: string;
};

type RecordAuditLogInput = {
  action: string;
  actor: AuditActor;
  metadata?: Record<string, unknown> | null;
  module: string;
  request?: Request;
  result?: "success" | "failure";
  summary?: string;
  target: AuditTarget;
};

export type AdminAuditLog = {
  action: string;
  actorDisplayName: string;
  actorRoleKey: string;
  actorType: AuditActorType;
  actorUsername: string;
  createdAt: string;
  id: string;
  metadata: Record<string, unknown> | null;
  module: string;
  requestMethod: string | null;
  requestPath: string | null;
  result: "success" | "failure";
  summary: string;
  targetId: string | null;
  targetName: string | null;
  targetType: string;
};

export function createAdminAuditActor(user: AdminSessionUser): AuditActor {
  return {
    displayName: user.displayName,
    roleKey: user.roleKey,
    type: "admin",
    userId: user.id,
    username: user.username,
  };
}

export function createAnonymousAdminAuditActor(username: string): AuditActor {
  const normalizedUsername = username.trim() || "unknown";

  return {
    displayName: normalizedUsername,
    roleKey: "anonymous",
    type: "admin",
    userId: null,
    username: normalizedUsername,
  };
}

export const kioskAuditActor: AuditActor = {
  displayName: "前台自助终端",
  roleKey: "kiosk",
  type: "kiosk",
  userId: null,
  username: "kiosk",
};

function getRequestPath(request: Request | undefined) {
  if (!request) {
    return null;
  }

  try {
    return new URL(request.url).pathname;
  } catch {
    return null;
  }
}

function buildSummary(input: RecordAuditLogInput) {
  if (input.summary) {
    return input.summary;
  }

  const targetName = input.target.name ?? input.target.id ?? input.target.type;

  return `${input.actor.displayName} ${input.action} ${targetName}`;
}

export async function recordAuditLog(input: RecordAuditLogInput) {
  try {
    await ensureAdminDatabase();

    await db.insert(auditLogsTable).values({
      action: input.action,
      actorDisplayName: input.actor.displayName,
      actorRoleKey: input.actor.roleKey,
      actorType: input.actor.type,
      actorUserId: input.actor.userId ?? null,
      actorUsername: input.actor.username,
      createdAt: new Date(),
      id: randomUUID(),
      metadata: input.metadata ?? null,
      module: input.module,
      requestMethod: input.request?.method ?? null,
      requestPath: getRequestPath(input.request),
      result: input.result ?? "success",
      summary: buildSummary(input),
      targetId: input.target.id ?? null,
      targetName: input.target.name ?? null,
      targetType: input.target.type,
    });
  } catch (error) {
    console.error("Failed to record audit log", error);
  }
}

function toAdminAuditLog(record: {
  action: string;
  actorDisplayName: string;
  actorRoleKey: string;
  actorType: AuditActorType;
  actorUsername: string;
  createdAt: Date;
  id: string;
  metadata: Record<string, unknown> | null;
  module: string;
  requestMethod: string | null;
  requestPath: string | null;
  result: "success" | "failure";
  summary: string;
  targetId: string | null;
  targetName: string | null;
  targetType: string;
}): AdminAuditLog {
  return {
    ...record,
    createdAt: formatAdminDate(record.createdAt) ?? "",
  };
}

export async function listAuditLogs(limit = 300) {
  await ensureAdminDatabase();

  const logs = await db
    .select({
      action: auditLogsTable.action,
      actorDisplayName: auditLogsTable.actorDisplayName,
      actorRoleKey: auditLogsTable.actorRoleKey,
      actorType: auditLogsTable.actorType,
      actorUsername: auditLogsTable.actorUsername,
      createdAt: auditLogsTable.createdAt,
      id: auditLogsTable.id,
      metadata: auditLogsTable.metadata,
      module: auditLogsTable.module,
      requestMethod: auditLogsTable.requestMethod,
      requestPath: auditLogsTable.requestPath,
      result: auditLogsTable.result,
      summary: auditLogsTable.summary,
      targetId: auditLogsTable.targetId,
      targetName: auditLogsTable.targetName,
      targetType: auditLogsTable.targetType,
    })
    .from(auditLogsTable)
    .orderBy(desc(auditLogsTable.createdAt))
    .limit(limit)
    .all();

  return logs.map(toAdminAuditLog);
}
