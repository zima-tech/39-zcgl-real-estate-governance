import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { getGovernanceDashboard } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const dashboard = await getGovernanceDashboard();

    return NextResponse.json({ dashboard });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取治理看板失败。");
  }
}
