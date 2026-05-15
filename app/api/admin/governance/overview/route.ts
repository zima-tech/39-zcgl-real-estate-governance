import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { getGovernanceHomepageOverview } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const overview = await getGovernanceHomepageOverview();

    return NextResponse.json(overview);
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取治理首页概览失败。");
  }
}
