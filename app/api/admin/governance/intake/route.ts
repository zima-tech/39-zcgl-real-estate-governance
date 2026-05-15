import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import {
  createGovernanceIntake,
  type CreateGovernanceIntakeInput,
} from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const body = (await request.json().catch(() => null)) as
      | CreateGovernanceIntakeInput
      | null;
    const record = await createGovernanceIntake(
      {
        manualFields: body?.manualFields,
        mockScenarioId: body?.mockScenarioId,
        originalFilename: body?.originalFilename,
        sourceType: body?.sourceType ?? "manual",
      },
      session.user,
      request,
    );

    return NextResponse.json({ record }, { status: 201 });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "创建治理记录失败。");
  }
}
