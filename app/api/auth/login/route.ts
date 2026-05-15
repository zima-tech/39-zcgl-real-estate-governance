import { NextResponse } from "next/server";

import {
  createAdminAuditActor,
  createAnonymousAdminAuditActor,
  recordAuditLog,
} from "@/lib/admin/audit-log";
import { createAdminSession, setAdminSessionCookie } from "@/lib/admin/auth";
import { getErrorMessage } from "@/lib/admin/errors";
import { verifyAdminPassword } from "@/lib/admin/passwords";
import { findAdminUserForLogin } from "@/lib/admin/system-service";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      username?: string;
      password?: string;
    } | null;

    const username = body?.username?.trim() ?? "";
    const password = body?.password ?? "";

    if (!username || !password) {
      return NextResponse.json(
        {
          error: "请输入账号名和密码。",
        },
        {
          status: 400,
        },
      );
    }

    const user = await findAdminUserForLogin(username);

    if (!user) {
      await recordAuditLog({
        action: "登录失败",
        actor: createAnonymousAdminAuditActor(username),
        module: "认证",
        request,
        result: "failure",
        summary: `账号 ${username} 登录失败：账号名或密码错误。`,
        target: {
          name: username,
          type: "admin_user",
        },
      });

      return NextResponse.json(
        {
          error: "账号名或密码错误。",
        },
        {
          status: 401,
        },
      );
    }

    const passwordMatched = await verifyAdminPassword(
      password,
      user.passwordHash,
    );

    if (!passwordMatched) {
      await recordAuditLog({
        action: "登录失败",
        actor: createAnonymousAdminAuditActor(username),
        module: "认证",
        request,
        result: "failure",
        summary: `账号 ${username} 登录失败：账号名或密码错误。`,
        target: {
          id: user.id,
          name: user.username,
          type: "admin_user",
        },
      });

      return NextResponse.json(
        {
          error: "账号名或密码错误。",
        },
        {
          status: 401,
        },
      );
    }

    const session = await createAdminSession(user.id);
    await recordAuditLog({
      action: "登录后台",
      actor: createAdminAuditActor({
        displayName: user.displayName,
        id: user.id,
        roleKey: user.roleKey,
        username: user.username,
      }),
      module: "认证",
      request,
      summary: `${user.displayName} 登录后台工作台。`,
      target: {
        id: user.id,
        name: user.username,
        type: "admin_user",
      },
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        username: user.username,
        displayName: user.displayName,
        roleKey: user.roleKey,
      },
    });

    return setAdminSessionCookie(response, session.token, session.expiresAt);
  } catch (error) {
    const { message, statusCode } = getErrorMessage(error, "登录失败。");

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: statusCode,
      },
    );
  }
}
