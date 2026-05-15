import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import {
  createGovernanceUpload,
  type CreateGovernanceUploadInput,
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
      | CreateGovernanceUploadInput
      | null;
    const payload = await createGovernanceUpload(
      recordId,
      {
        category: body?.category ?? "docx",
        fileName: body?.fileName ?? "",
        fileSize: body?.fileSize ?? 0,
        templateKey: body?.templateKey,
      },
      session.user,
      request,
    );

    return NextResponse.json(payload, { status: 201 });
  } catch (error) {
    return createAdminRouteErrorResponse(error, "上传治理材料失败。");
  }
}
