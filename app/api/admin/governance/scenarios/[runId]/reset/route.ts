import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { resetGovernanceScenarioRun } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    runId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const { runId } = await context.params;
    const run = await resetGovernanceScenarioRun(
      runId,
      session.user,
      request,
    );

    return NextResponse.json({ run });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "重置治理场景失败。");
  }
}
