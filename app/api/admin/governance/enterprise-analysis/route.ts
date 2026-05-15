import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { getEnterpriseGovernanceAnalysis } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const analysis = await getEnterpriseGovernanceAnalysis();

    return NextResponse.json(analysis);
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取企业治理分析失败。");
  }
}
