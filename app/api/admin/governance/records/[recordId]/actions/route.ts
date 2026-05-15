import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { AdminServiceError } from "@/lib/admin/errors";
import {
  applyGovernanceWorkflowAction,
  type GovernanceWorkflowActionInput,
} from "@/lib/admin/governance-service";
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
    const body = (await request.json().catch(() => null)) as
      | GovernanceWorkflowActionInput
      | null;

    if (!body?.workflowAction) {
      throw new AdminServiceError("缺少治理流程动作。");
    }

    const record = await applyGovernanceWorkflowAction(
      recordId,
      body,
      session.user,
      request,
    );

    return NextResponse.json({ record });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "处置治理记录失败。");
  }
}
