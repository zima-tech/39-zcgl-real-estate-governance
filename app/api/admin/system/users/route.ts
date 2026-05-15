import { NextResponse } from "next/server";

import { createAdminAuditActor, recordAuditLog } from "@/lib/admin/audit-log";
import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";
import { createAdminUser, listAdminUsers } from "@/lib/admin/system-service";
import type { AdminRoleKey } from "@/lib/admin/system-data";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const users = await listAdminUsers();

    return NextResponse.json({ users });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取用户列表失败。");
  }
}

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const body = (await request.json().catch(() => null)) as {
      username?: string;
      displayName?: string;
      password?: string;
      roleKey?: Exclude<AdminRoleKey, "root">;
    } | null;

    const user = await createAdminUser({
      username: body?.username ?? "",
      displayName: body?.displayName ?? "",
      password: body?.password ?? "",
      roleKey: body?.roleKey ?? "user",
    });

    await recordAuditLog({
      action: "创建用户",
      actor: createAdminAuditActor(session.user),
      metadata: {
        roleKey: user.roleKey,
      },
      module: "系统管理",
      request,
      summary: `${session.user.displayName} 创建后台用户 ${user.username}。`,
      target: {
        id: user.id,
        name: user.username,
        type: "admin_user",
      },
    });

    return NextResponse.json(
      {
        user,
      },
      {
        status: 201,
      },
    );
  } catch (error) {
    return createAdminRouteErrorResponse(error, "创建用户失败。");
  }
}
