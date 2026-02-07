/**
 * @domain magicdrive
 * @layer api
 * @responsibility Process one job from the MagicDrive BullMQ queue (for Vercel Cron when REDIS_URL is set).
 *
 * Aligned with existing cron: x-cron-secret auth, GET health. No-op when REDIS_URL is not set.
 */

import "server-only"
import { ok, fail, KERNEL_ERROR_CODES, jsonResponse } from "@afenda/shared/server"
import { processOneMagicdriveJobFromQueue } from "@afenda/magicdrive"

export const dynamic = "force-dynamic"
export const maxDuration = 60

function genRequestId(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `cron-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

/**
 * Validate CRON_SECRET from request (Vercel Cron or x-cron-secret header)
 */
function validateCronSecret(request: Request): Response | null {
  const secret = process.env.CRON_SECRET
  if (!secret) return null
  const auth = request.headers.get("authorization")
  const bearer = auth?.startsWith("Bearer ") ? auth.slice(7) : null
  const headerSecret = request.headers.get("x-cron-secret")
  const provided = bearer ?? headerSecret ?? null
  if (!provided || provided !== secret) {
    const requestId = genRequestId()
    return jsonResponse(
      fail({ code: KERNEL_ERROR_CODES.VALIDATION, message: "Unauthorized" }),
      401,
      requestId
    )
  }
  return null
}

/**
 * POST /api/cron/process-magicdrive-queue
 *
 * Process one job from the magicdrive BullMQ queue. Use with Vercel Cron when using Redis.
 * Authorization: CRON_SECRET via Authorization: Bearer (Vercel Cron) or x-cron-secret header.
 */
export async function POST(request: Request) {
  const unauth = validateCronSecret(request)
  if (unauth) return unauth

  const requestId = genRequestId()
  try {
    const result = await processOneMagicdriveJobFromQueue(55_000)
    return jsonResponse(ok(result), 200, requestId)
  } catch {
    return jsonResponse(
      fail({
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Process queue failed",
      }),
      500,
      requestId
    )
  }
}

/**
 * GET /api/cron/process-magicdrive-queue — health check
 */
export async function GET() {
  const requestId = genRequestId()
  return jsonResponse(
    ok({
      status: "ok",
      endpoint: "/api/cron/process-magicdrive-queue",
      method: "POST",
      headers_required: ["Authorization: Bearer <CRON_SECRET> or x-cron-secret"],
      timestamp: new Date().toISOString(),
    }),
    200,
    requestId
  )
}
