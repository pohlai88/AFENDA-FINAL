/**
 * Real-time Audit Stream
 * Server-Sent Events (SSE) for live audit event streaming.
 *
 * @domain orchestra
 * @layer api/ops
 */

import "server-only";
import type { NextRequest } from "next/server";

import { KERNEL_HEADERS } from "@afenda/orchestra";
import { envelopeHeaders } from "@afenda/shared/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/orchestra/audit/stream
 * Server-Sent Events endpoint for real-time audit log streaming.
 */
export async function GET(request: NextRequest) {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();
  const headers = envelopeHeaders(traceId);
  const encoder = new TextEncoder();

  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection message
      const initialMessage = `data: ${JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })}\n\n`;
      controller.enqueue(encoder.encode(initialMessage));

      // Set up interval to send heartbeat and mock events
      const interval = setInterval(() => {
        try {
          // Heartbeat
          const heartbeat = `data: ${JSON.stringify({ type: "heartbeat", timestamp: new Date().toISOString() })}\n\n`;
          controller.enqueue(encoder.encode(heartbeat));

          // Mock audit event (in production, this would come from a message queue or database trigger)
          if (Math.random() > 0.7) {
            const mockEvent = {
              type: "audit_event",
              data: {
                id: `evt_${Date.now()}`,
                eventType: ["config.set", "service.health_changed", "backup.completed"][Math.floor(Math.random() * 3)],
                entityType: "config",
                entityId: `entity_${Math.floor(Math.random() * 100)}`,
                actorId: `user_${Math.floor(Math.random() * 10)}`,
                timestamp: new Date().toISOString(),
                details: { action: "update", status: "success" },
              },
            };
            const eventMessage = `data: ${JSON.stringify(mockEvent)}\n\n`;
            controller.enqueue(encoder.encode(eventMessage));
          }
        } catch (error) {
          // Error sending SSE message - stream will be closed on client disconnect
          void error;
        }
      }, 3000); // Send updates every 3 seconds

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
