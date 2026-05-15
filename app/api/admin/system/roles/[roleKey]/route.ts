import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";
import { getAdminRoleDetail } from "@/lib/admin/system-service";

export const runtime = "nodejs";

type RoleRouteContext = {
  params: Promise<{
    roleKey: string;
  }>;
};

export async function GET(_request: Request, context: RoleRouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const { roleKey } = await context.params;
    const role = await getAdminRoleDetail(roleKey);

    return NextResponse.json({ role });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取角色详情失败。");
  }
}
