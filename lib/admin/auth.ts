import { createHash, randomBytes, randomUUID } from "node:crypto";

import { and, eq, gt } from "drizzle-orm";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextResponse } from "next/server";

import { authRoutes } from "@/lib/admin/routes";
import type { AdminRoleKey } from "@/lib/admin/system-data";
import { db } from "@/lib/db/client";
import { ensureAdminDatabase } from "@/lib/db/ensure-admin-database";
import { sessionsTable, usersTable } from "@/lib/db/schema";

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 7;
const SESSION_COOKIE_NAME = "admin_session";

export type AuthenticatedAdminSession = {
  sessionId: string;
  expiresAt: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    roleKey: AdminRoleKey;
  };
};

function createCookieOptions(expires: Date) {
  return {
    expires,
    httpOnly: true,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function setAdminSessionCookie(
  response: NextResponse,
  token: string,
  expiresAt: Date,
) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    token,
    createCookieOptions(expiresAt),
  );

  return response;
}

export function clearAdminSessionCookie(response: NextResponse) {
  response.cookies.set(
    SESSION_COOKIE_NAME,
    "",
    createCookieOptions(new Date(0)),
  );

  return response;
}

export function createUnauthorizedAdminResponse() {
  return clearAdminSessionCookie(
    NextResponse.json(
      {
        error: "未登录或会话已失效。",
      },
      {
        status: 401,
      },
    ),
  );
}

export async function createAdminSession(userId: string) {
  await ensureAdminDatabase();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_DURATION_MS);
  const token = randomBytes(32).toString("base64url");

  await db.insert(sessionsTable).values({
    id: randomUUID(),
    userId,
    tokenHash: hashSessionToken(token),
    expiresAt,
    createdAt: now,
    lastSeenAt: now,
  });

  await db
    .update(usersTable)
    .set({
      lastLoginAt: now,
      updatedAt: now,
    })
    .where(eq(usersTable.id, userId));

  return {
    expiresAt,
    token,
  };
}

export async function destroyCurrentAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return;
  }

  await ensureAdminDatabase();

  await db
    .delete(sessionsTable)
    .where(eq(sessionsTable.tokenHash, hashSessionToken(token)));
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (!token) {
    return null;
  }

  await ensureAdminDatabase();

  const record = await db
    .select({
      sessionId: sessionsTable.id,
      expiresAt: sessionsTable.expiresAt,
      userId: usersTable.id,
      username: usersTable.username,
      displayName: usersTable.displayName,
      roleKey: usersTable.roleKey,
    })
    .from(sessionsTable)
    .innerJoin(usersTable, eq(sessionsTable.userId, usersTable.id))
    .where(
      and(
        eq(sessionsTable.tokenHash, hashSessionToken(token)),
        gt(sessionsTable.expiresAt, new Date()),
      ),
    )
    .get();

  if (!record) {
    return null;
  }

  await db
    .update(sessionsTable)
    .set({
      lastSeenAt: new Date(),
    })
    .where(eq(sessionsTable.id, record.sessionId));

  return {
    sessionId: record.sessionId,
    expiresAt: record.expiresAt.toISOString(),
    user: {
      id: record.userId,
      username: record.username,
      displayName: record.displayName,
      roleKey: record.roleKey,
    },
  } satisfies AuthenticatedAdminSession;
}

export async function requireAdminSession() {
  const session = await getAdminSession();

  if (!session) {
    redirect(authRoutes.login);
  }

  return session;
}
