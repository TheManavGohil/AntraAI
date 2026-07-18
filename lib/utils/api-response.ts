import { NextResponse } from "next/server";

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json(
    { success: true, data } as ApiSuccessResponse<T>,
    { status }
  );
}

export function apiError(code: string, message: string, status: number = 400): NextResponse {
  return NextResponse.json(
    { success: false, error: { code, message } } as ApiErrorResponse,
    { status }
  );
}

export const ERROR_CODES = {
  MISSING_FIELDS: "MISSING_FIELDS",
  INVALID_ID: "INVALID_ID",
  NOT_FOUND: "NOT_FOUND",
  CONSENT_REQUIRED: "CONSENT_REQUIRED",
  RATE_LIMITED: "RATE_LIMITED",
  INTERNAL: "INTERNAL",
} as const;
