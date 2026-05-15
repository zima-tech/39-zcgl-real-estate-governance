import { NextResponse } from "next/server";

import type { AdminErrorPayload } from "@/lib/admin/errors";
import { getErrorMessage } from "@/lib/admin/errors";

export function createAdminErrorResponse(
  message: string,
  status = 400,
  options?: Pick<AdminErrorPayload, "code" | "fieldErrors">,
) {
  return NextResponse.json<AdminErrorPayload>(
    {
      code: options?.code,
      error: message,
      fieldErrors: options?.fieldErrors,
    },
    {
      status,
    },
  );
}

export function createAdminForbiddenResponse(message: string) {
  return createAdminErrorResponse(message, 403);
}

export function createAdminRouteErrorResponse(
  error: unknown,
  fallbackMessage: string,
) {
  const { code, fieldErrors, message, statusCode } = getErrorMessage(
    error,
    fallbackMessage,
  );

  return createAdminErrorResponse(message, statusCode, {
    code,
    fieldErrors,
  });
}
