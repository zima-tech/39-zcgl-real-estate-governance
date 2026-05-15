import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import {
  governanceProcessors,
  pollGovernanceAiJobs,
  startGovernanceAiJob,
  type StartGovernanceAiJobInput,
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
    const record = await pollGovernanceAiJobs(recordId);

    return NextResponse.json({ processors: governanceProcessors, record });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "轮询 Mock AI 任务失败。");
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const { recordId } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | StartGovernanceAiJobInput
      | null;
    const payload = await startGovernanceAiJob(
      recordId,
      {
        inputReference: body?.inputReference,
        processorName: body?.processorName ?? "",
      },
      session.user,
      request,
    );

    return NextResponse.json(payload, { status: 202 });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "启动 Mock AI 任务失败。");
  }
}
