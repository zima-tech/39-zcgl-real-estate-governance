import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { listPendingGovernanceTasks } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const tasks = await listPendingGovernanceTasks();

    return NextResponse.json({ tasks });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取审批待办失败。");
  }
}
