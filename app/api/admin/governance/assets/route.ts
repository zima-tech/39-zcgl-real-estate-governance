import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { getRealEstateAssetLedger } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const ledger = await getRealEstateAssetLedger();

    return NextResponse.json(ledger);
  } catch (error) {
    return createAdminRouteErrorResponse(error, "读取不动产台账失败。");
  }
}
