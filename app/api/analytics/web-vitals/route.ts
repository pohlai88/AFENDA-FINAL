/**
 * Core Web Vitals ingestion endpoint.
 * POST: Accepts metric payloads from useReportWebVitals (no PII).
 * Use for logging, forwarding to gtag/Vercel Analytics, or custom dashboards.
 */

import { HTTP_STATUS } from "@afenda/orchestra";
import { fail, KERNEL_ERROR_CODES, jsonResponse } from "@afenda/shared/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Minimal payload from next/web-vitals (no PII). */
type WebVitalsBody = {
  name: string;
  value: number;
  rating?: string;
  delta?: number;
  id?: string;
};

export async function POST(request: Request) {
  const traceId = request.headers.get("x-request-id") ?? crypto.randomUUID();

  try {
    const body = (await request.json()) as WebVitalsBody;
    const { name, value, rating, delta, id } = body;

    if (typeof name !== "string" || typeof value !== "number") {
      return jsonResponse(
        fail(
          { code: KERNEL_ERROR_CODES.VALIDATION, message: "Missing or invalid name/value" },
          { traceId }
        ),
        HTTP_STATUS.BAD_REQUEST,
        traceId
      );
    }

    // Optional: log in server or forward to external analytics (gtag, Vercel, etc.)
    if (process.env.NODE_ENV === "development") {
      // eslint-disable-next-line no-console
      console.log("[Web Vitals]", { name, value, rating, delta, id });
    }

    return new Response(null, { status: 204 });
  } catch {
    return jsonResponse(
      fail(
        { code: KERNEL_ERROR_CODES.VALIDATION, message: "Invalid JSON body" },
        { traceId }
      ),
      HTTP_STATUS.BAD_REQUEST,
      traceId
    );
  }
}
