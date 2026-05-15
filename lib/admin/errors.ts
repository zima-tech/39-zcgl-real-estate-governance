export class AdminServiceError extends Error {
  constructor(
    message: string,
    readonly statusCode = 400,
  ) {
    super(message);
    this.name = "AdminServiceError";
  }
}

export type AdminErrorPayload = {
  error: string;
  code?: string;
  fieldErrors?: Record<string, string>;
};

export function getAdminErrorPayloadMessage(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    typeof payload.error === "string"
  ) {
    return payload.error;
  }

  return null;
}

export function getAdminErrorPayloadFieldErrors(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "fieldErrors" in payload &&
    payload.fieldErrors &&
    typeof payload.fieldErrors === "object"
  ) {
    return payload.fieldErrors as Record<string, string>;
  }

  return undefined;
}

export function getAdminErrorPayloadCode(payload: unknown) {
  if (
    payload &&
    typeof payload === "object" &&
    "code" in payload &&
    typeof payload.code === "string"
  ) {
    return payload.code;
  }

  return undefined;
}

export class AdminValidationError extends AdminServiceError {
  constructor(
    message: string,
    readonly fieldErrors: Record<string, string>,
    readonly code = "validation_error",
    statusCode = 400,
  ) {
    super(message, statusCode);
    this.name = "AdminValidationError";
  }
}

export function getErrorMessage(error: unknown, fallbackMessage: string) {
  if (error instanceof AdminValidationError) {
    return {
      code: error.code,
      fieldErrors: error.fieldErrors,
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof AdminServiceError) {
    return {
      message: error.message,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
      statusCode: 500,
    };
  }

  return {
    message: fallbackMessage,
    statusCode: 500,
  };
}
