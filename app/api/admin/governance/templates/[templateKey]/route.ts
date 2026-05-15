import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { getGovernanceTemplateDownload } from "@/lib/admin/governance-service";
import { createAdminRouteErrorResponse } from "@/lib/admin/route-responses";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    templateKey: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    const { templateKey } = await context.params;
    const payload = await getGovernanceTemplateDownload(
      templateKey,
      session.user,
      request,
    );

    return NextResponse.json(payload);
  } catch (error) {
    return createAdminRouteErrorResponse(error, "下载治理模板失败。");
  }
}
