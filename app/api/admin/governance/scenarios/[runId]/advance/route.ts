import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { advanceGovernanceScenarioRun } from "@/lib/admin/governance-service";
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
    const payload = await advanceGovernanceScenarioRun(
      runId,
      session.user,
      request,
    );

    return NextResponse.json(payload);
  } catch (error) {
    return createAdminRouteErrorResponse(error, "推进治理场景失败。");
  }
}
