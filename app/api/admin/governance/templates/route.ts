import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { listGovernanceTemplates } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const templates = await listGovernanceTemplates();

    return NextResponse.json({ templates });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取治理模板失败。");
  }
}
