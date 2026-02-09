/**
 * Real-time Health Stream
 * Server-Sent Events (SSE) for live health status updates.
 *
 * @domain orchestra
 * @layer api/ops
 */

import "server-only";
import type { NextRequest } from "next/server";

import { KERNEL_HEADERS, getAuthContext, KERNEL_ERROR_CODES, HTTP_STATUS } from "@afenda/orchestra";
import { fail, envelopeHeaders } from "@afenda/shared/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/orchestra/health/stream
 * Server-Sent Events endpoint for real-time health monitoring.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);

  const auth = await getAuthContext();
  if (!auth.userId) {
    return new Response(
      JSON.stringify(fail({ code: KERNEL_ERROR_CODES.UNAUTHORIZED, message: "Authentication required" }, { traceId })),
      { status: HTTP_STATUS.UNAUTHORIZED, headers: { ...headers, "Content-Type": "application/json" } }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Set up interval to send health updates
      const interval = setInterval(() => {
        try {
          // TODO(production): Replace mock data with real health check results from DB/message queue
          const mockHealthUpdate = {
            type: "health_update",
            data: {
              serviceId: `service_${Math.floor(Math.random() * 5)}`,
              status: Math.random() > 0.9 ? "degraded" : "healthy",
              latencyMs: Math.floor(Math.random() * 200) + 50,
              timestamp: new Date().toISOString(),
              checks: {
                database: Math.random() > 0.95 ? "unhealthy" : "healthy",
                api: "healthy",
                cache: "healthy",
              },
            },
          };

          const eventMessage = `data: ${JSON.stringify(mockHealthUpdate)}\n\n`;
          controller.enqueue(encoder.encode(eventMessage));
        } catch (error) {
          // Error sending health update - stream will be closed on client disconnect
          void error;
        }
      }, 5000); // Send updates every 5 seconds

      // Clean up on client disconnect
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      ...headers,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
