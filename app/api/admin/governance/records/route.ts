import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { listGovernanceRecords } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const records = await listGovernanceRecords();

    return NextResponse.json({ records });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取治理记录失败。");
  }
}
