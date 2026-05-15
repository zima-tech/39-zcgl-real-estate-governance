import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { listGovernanceWarnings } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const warnings = await listGovernanceWarnings();

    return NextResponse.json({ warnings });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取风险预警失败。");
  }
}
