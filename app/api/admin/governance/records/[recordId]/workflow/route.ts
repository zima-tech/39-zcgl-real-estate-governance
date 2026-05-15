import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { submitGovernanceWorkflow } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    recordId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const { recordId } = await context.params;
    const record = await submitGovernanceWorkflow(
      recordId,
      session.user,
      request,
    );

    return NextResponse.json({ record });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "提交治理审批失败。");
  }
}
