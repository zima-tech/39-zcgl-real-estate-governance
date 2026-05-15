import { NextResponse } from "next/server";

import { createAdminAuditActor, recordAuditLog } from "@/lib/admin/audit-log";
import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";
import {
  deleteAdminUser,
  getAdminUserDetail,
} from "@/lib/admin/system-service";

export const runtime = "nodejs";

type UserRouteContext = {
  params: Promise<{
    userId: string;
  }>;
};

export async function GET(_request: Request, context: UserRouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const { userId } = await context.params;
    const user = await getAdminUserDetail(userId);

    return NextResponse.json({ user });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取用户详情失败。");
  }
}

export async function DELETE(request: Request, context: UserRouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const { userId } = await context.params;
    const result = await deleteAdminUser(userId);

    await recordAuditLog({
      action: "删除用户",
      actor: createAdminAuditActor(session.user),
      module: "系统管理",
      request,
      summary: `${session.user.displayName} 删除后台用户 ${result.deletedUsername}。`,
      target: {
        id: userId,
        name: result.deletedUsername,
        type: "admin_user",
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    return createAdminRouteErrorResponse(error, "删除用户失败。");
  }
}
