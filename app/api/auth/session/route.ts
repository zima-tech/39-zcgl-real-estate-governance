import { NextResponse } from "next/server";

import {
  createUnauthorizedAdminResponse,
  getAdminSession,
} from "@/lib/admin/auth";
import { getErrorMessage } from "@/lib/admin/errors";

export const runtime = "nodejs";

export async function GET() {
  try {
    const session = await getAdminSession();

    if (!session) {
      return createUnauthorizedAdminResponse();
    }

    return NextResponse.json(session);
  } catch (error) {
    const { message, statusCode } = getErrorMessage(
      error,
      "读取当前会话失败。",
    );

    return NextResponse.json(
      {
        error: message,
      },
      {
        status: statusCode,
      },
    );
  }
}
