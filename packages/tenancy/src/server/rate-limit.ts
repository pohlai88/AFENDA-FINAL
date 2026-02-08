/**
 * @domain tenancy
 * @layer server
 * @responsibility Rate limiting for API abuse preventing
 * Phase 2, Step 2.7: Redis-based rate limiting (Redis Labs)
 */

import "server-only";

import Redis from "ioredis";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  kernelFail,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
} from "@afenda/orchestra";
import { tenancyLogger } from "../logger";

// Initialize Redis client (uses REDIS_URL env var)
const redis = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: 3,
  enableReadyCheck: false,
  lazyConnect: true,
});

// Rate limiter configuration
interface RateLimitConfig {
  limit: number;
  window: number; // in milliseconds
  prefix: string;
}

// Organization creation rate limit: 10 per hour per user
export const orgCreationLimiter: RateLimitConfig = {
  limit: 10,
  window: 60 * 60 * 1000, // 1 hour
  prefix: "ratelimit:org:create",
};

// Member invitation rate limit: 50 per hour per user
export const memberInviteLimiter: RateLimitConfig = {
  limit: 50,
  window: 60 * 60 * 1000, // 1 hour
  prefix: "ratelimit:member:invite",
};

// Team creation rate limit: 20 per hour per user
export const teamCreationLimiter: RateLimitConfig = {
  limit: 20,
  window: 60 * 60 * 1000, // 1 hour
  prefix: "ratelimit:team:create",
};

// General mutation rate limit: 100 per minute per user (for updates/deletes)
export const mutationLimiter: RateLimitConfig = {
  limit: 100,
  window: 60 * 1000, // 1 minute
  prefix: "ratelimit:mutation",
};

/**
 * Sliding window rate limit implementation using Redis
 * 
 * @param identifier - Unique identifier (usually userId)
 * @param config - Rate limiter configuration
 * @returns Rate limit result with success, limit, reset time, and remaining count
 */
async function slidingWindowRateLimit(
  identifier: string,
  config: RateLimitConfig
): Promise<{
  success: boolean;
  limit: number;
  reset: number;
  remaining: number;
}> {
  const key = `${config.prefix}:${identifier}`;
  const now = Date.now();
  const windowStart = now - config.window;

  try {
    // Remove old entries outside the window
    await redis.zremrangebyscore(key, 0, windowStart);

    // Count current requests in window
    const count = await redis.zcard(key);

    if (count >= config.limit) {
      // Get the oldest entry to calculate reset time
      const oldest = await redis.zrange(key, 0, 0, "WITHSCORES");
      const resetTime = oldest.length > 1 ? parseInt(oldest[1]) + config.window : now + config.window;

      return {
        success: false,
        limit: config.limit,
        reset: resetTime,
        remaining: 0,
      };
    }

    // Add current request to the sorted set
    await redis.zadd(key, now, `${now}:${crypto.randomUUID()}`);

    // Set expiry to window duration
    await redis.expire(key, Math.ceil(config.window / 1000));

    return {
      success: true,
      limit: config.limit,
      reset: now + config.window,
      remaining: config.limit - count - 1,
    };
  } catch (error) {
    // On Redis errors, allow the request (fail open)
    tenancyLogger.error({ err: error }, "Rate limit error");
    return {
      success: true,
      limit: config.limit,
      reset: now + config.window,
      remaining: config.limit - 1,
    };
  }
}

/**
 * Check rate limit and return appropriate response
 * 
 * @param identifier - Unique identifier (usually userId)
 * @param config - Rate limiter configuration
 * @param traceId - Request trace ID
 * @returns null if allowed, NextResponse if rate limited
 */
export async function checkRateLimit(
  identifier: string,
  config: RateLimitConfig,
  traceId: string
): Promise<NextResponse | null> {
  const { success, limit, reset, remaining } = await slidingWindowRateLimit(identifier, config);

  if (!success) {
    return NextResponse.json(
      kernelFail(
        {
          code: KERNEL_ERROR_CODES.VALIDATION,
          message: "Too many requests. Please try again later.",
        },
        { traceId }
      ),
      {
        status: HTTP_STATUS.TOO_MANY_REQUESTS,
        headers: {
          [KERNEL_HEADERS.REQUEST_ID]: traceId,
          [KERNEL_HEADERS.TRACE_ID]: traceId,
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}

/**
 * Higher-order function that wraps route handlers with rate limiting
 * 
 * @param handler - The actual route handler to execute after rate limit check
 * @param config - Rate limiter configuration
 * @param getIdentifier - Function to extract identifier from request (default: userId from auth)
 * @returns Wrapped handler with automatic rate limit check
 * 
 * @example
 * ```ts
 * import { withRateLimit, orgCreationLimiter } from "@afenda/tenancy/server";
 * 
 * export const POST = withRateLimit(
 *   async (request) => {
 *     // Create organization logic
 *     return NextResponse.json(kernelOk({ success: true }));
 *   },
 *   orgCreationLimiter
 * );
 * ```
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig,
  getIdentifier?: (request: NextRequest) => Promise<string>
): (request: NextRequest) => Promise<NextResponse> {
  return async (request: NextRequest) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      // Get identifier (default: use IP address if userId not available)
      const identifier = getIdentifier
        ? await getIdentifier(request)
        : request.headers.get("x-forwarded-for") ??
          request.headers.get("x-real-ip") ??
          "anonymous";

      // Check rate limit
      const rateLimitResponse = await checkRateLimit(identifier, config, traceId);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Execute the actual handler
      return await handler(request);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
        {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: {
            [KERNEL_HEADERS.REQUEST_ID]: traceId,
            [KERNEL_HEADERS.TRACE_ID]: traceId,
          },
        }
      );
    }
  };
}

/**
 * Combine rate limiting with authorization middleware
 * Use this for protected endpoints that need both auth and rate limiting
 * 
 * @example
 * ```ts
 * import { withOrgAccess } from "@afenda/tenancy/server/middleware";
 * import { withRateLimitAuth, mutationLimiter } from "@afenda/tenancy/server/rate-limit";
 * 
 * export const PATCH = withRateLimitAuth(
 *   withOrgAccess(
 *     async (request, { userId, organizationId }) => {
 *       // Update logic
 *     },
 *     "admin"
 *   ),
 *   mutationLimiter
 * );
 * ```
 */
export function withRateLimitAuth(
  handler: (request: NextRequest) => Promise<NextResponse>,
  config: RateLimitConfig
): (request: NextRequest) => Promise<NextResponse> {
  return withRateLimit(handler, config, async (request) => {
    // Extract userId from authorization header or session
    // This is a simplified version - in production, use getAuthContext()
    const { getAuthContext } = await import("@afenda/orchestra");
    const auth = await getAuthContext();
    return auth.userId ?? request.headers.get("x-forwarded-for") ?? "anonymous";
  });
}

/**
 * Rate limiter for route handlers with dynamic params
 * Supports Next.js route signature with params context
 * 
 * @param handler - Route handler with params context
 * @param config - Rate limiter configuration
 * @param getIdentifier - Function to extract identifier from request (default: userId from auth)
 * @returns Wrapped handler with rate limiting
 * 
 * @example
 * ```ts
 * export const PATCH = withRateLimitRoute(async (
 *   request,
 *   { params }: { params: Promise<{ id: string }> }
 * ) => {
 *   const { id } = await params;
 *   // Handler logic
 * }, mutationLimiter);
 * ```
 */
export function withRateLimitRoute<TParams = Record<string, string>>(
  handler: (
    request: NextRequest,
    context: { params: Promise<TParams> }
  ) => Promise<NextResponse>,
  config: RateLimitConfig,
  getIdentifier?: (request: NextRequest) => Promise<string>
): (request: NextRequest, context: { params: Promise<TParams> }) => Promise<NextResponse> {
  return async (request: NextRequest, context: { params: Promise<TParams> }) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      // Get identifier (default: use userId from auth or IP)
      const identifier = getIdentifier
        ? await getIdentifier(request)
        : await (async () => {
            const { getAuthContext } = await import("@afenda/orchestra");
            const auth = await getAuthContext();
            return (
              auth.userId ??
              request.headers.get("x-forwarded-for") ??
              request.headers.get("x-real-ip") ??
              "anonymous"
            );
          })();

      // Check rate limit
      const rateLimitResponse = await checkRateLimit(identifier, config, traceId);
      if (rateLimitResponse) {
        return rateLimitResponse;
      }

      // Execute the actual handler with context
      return await handler(request, context);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);

      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
        {
          status: HTTP_STATUS.INTERNAL_SERVER_ERROR,
          headers: {
            [KERNEL_HEADERS.REQUEST_ID]: traceId,
            [KERNEL_HEADERS.TRACE_ID]: traceId,
          },
        }
      );
    }
  };
}
