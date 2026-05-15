import { NextResponse } from "next/server";

import { createAdminAuditActor, recordAuditLog } from "@/lib/admin/audit-log";
import {
  clearAdminSessionCookie,
  destroyCurrentAdminSession,
  getAdminSession,
} from "@/lib/admin/auth";
import { getErrorMessage } from "@/lib/admin/errors";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    await destroyCurrentAdminSession();

    if (session) {
      await recordAuditLog({
        action: "退出后台",
        actor: createAdminAuditActor(session.user),
        module: "认证",
        request,
        summary: `${session.user.displayName} 退出后台工作台。`,
        target: {
          id: session.user.id,
          name: session.user.username,
          type: "admin_user",
        },
      });
    }

    return clearAdminSessionCookie(
      NextResponse.json({
        success: true,
      }),
    );
  } catch (error) {
    const { message, statusCode } = getErrorMessage(error, "退出登录失败。");

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
