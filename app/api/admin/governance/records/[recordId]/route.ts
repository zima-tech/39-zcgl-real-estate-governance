import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import {
  getGovernanceRecordDetail,
  updateGovernanceRecord,
  type UpdateGovernanceRecordInput,
} from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    recordId: string;
  }>;
};

export async function GET(_request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const { recordId } = await context.params;
    const record = await getGovernanceRecordDetail(recordId);

    return NextResponse.json({ record });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取治理记录详情失败。");
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const { recordId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | UpdateGovernanceRecordInput
      | null;
    const record = await updateGovernanceRecord(
      recordId,
      {
        fields: body?.fields ?? {},
      },
      session.user,
      request,
    );

    return NextResponse.json({ record });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "更新治理记录失败。");
  }
}
