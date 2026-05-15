import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";
import { listAdminRoles } from "@/lib/admin/system-service";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const roles = await listAdminRoles();

    return NextResponse.json({ roles });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取角色列表失败。");
  }
}
