/**
 * Tenancy BFF - Organization Invitations
 * GET: List pending invitations for organization
 * POST: Send invitation to join organization
 *
 * @domain tenancy
 * @layer api/bff
 */

import "server-only";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import {
  kernelFail,
  kernelOk,
  KERNEL_ERROR_CODES,
  HTTP_STATUS,
  KERNEL_HEADERS,
  getCurrentUserName,
} from "@afenda/orchestra";
import { 
  tenancyInvitationService, 
  tenancyAuditService, 
  withOrgAccess, 
  withRateLimitRoute, 
  memberInviteLimiter,
  sendInvitationEmail,
} from "@afenda/tenancy/server";
import { tenancyCreateOrgInvitationSchema } from "@afenda/tenancy/zod";
import { parseJson } from "@afenda/shared/server/validate";
import { db } from "@afenda/shared/server/db";
import { tenancyOrganizations } from "@afenda/tenancy/drizzle";
import { eq } from "drizzle-orm";

/**
 * Extract client IP from request headers
 */
function getClientIp(request: NextRequest): string | undefined {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    undefined
  );
}

export const GET = withOrgAccess(async (
  request: NextRequest,
  context
) => {
  const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

  try {
    const { organizationId = context.params.id } = context;
    const invitations = await tenancyInvitationService.listOrgInvitations(organizationId);

    // Convert dates to ISO strings for JSON serialization
    const serializedInvitations = invitations.map(inv => ({
      ...inv,
      expiresAt: inv.expiresAt?.toISOString() ?? "",
      acceptedAt: inv.acceptedAt?.toISOString() ?? null,
      createdAt: inv.createdAt?.toISOString() ?? "",
      updatedAt: inv.updatedAt?.toISOString() ?? "",
    }));

    return NextResponse.json(kernelOk({ invitations: serializedInvitations }, { traceId }), {
      status: HTTP_STATUS.OK,
      headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    
    return NextResponse.json(
      kernelFail({ code: KERNEL_ERROR_CODES.INTERNAL, message }, { traceId }),
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
    );
  }
}, "member");

export const POST = withRateLimitRoute(
  withOrgAccess(async (
    request: NextRequest,
    authContext
  ) => {
    const traceId = request.headers.get(KERNEL_HEADERS.TRACE_ID) ?? crypto.randomUUID();

    try {
      const { organizationId = authContext.params.id, userId } = authContext;
      const body = await request.json();
      const input = await parseJson(body, tenancyCreateOrgInvitationSchema);

      // Create invitation
      const invitation = await tenancyInvitationService.createOrgInvitation(
        input.email,
        organizationId,
        input.role,
        userId,
        input.message
      );

      // Audit log: invitation sent
      await tenancyAuditService.log({
        actorId: userId,
        action: "invitation.send",
        resourceType: "invitation",
        resourceId: invitation.id,
        organizationId,
        metadata: {
          email: input.email,
          role: input.role,
        },
        ipAddress: getClientIp(request),
        userAgent: request.headers.get("user-agent") || undefined,
      });

      // Send invitation email
      try {
        // Get current user's name
        const inviterName = await getCurrentUserName() ?? "A team member";

        // Get organization details
        const [org] = await db
          .select({ name: tenancyOrganizations.name })
          .from(tenancyOrganizations)
          .where(eq(tenancyOrganizations.id, organizationId))
          .limit(1);

        if (!org) {
          throw new Error("Organization not found");
        }

        // Determine base URL (prefer configured URL, fallback to request origin)
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                       process.env.BASE_URL || 
                       `${request.nextUrl.protocol}//${request.nextUrl.host}`;

        // Send the invitation email
        await sendInvitationEmail({
          invitation,
          inviterName,
          entityType: "organization",
          entityName: org.name,
          baseUrl,
        });

        // eslint-disable-next-line no-console -- success logging in API route
        console.log(`Invitation email sent successfully to ${input.email}`, {
          invitationId: invitation.id,
          organizationId,
        });
      } catch (emailError) {
        // Log email error but don't fail the invitation creation
        // eslint-disable-next-line no-console -- error logging in API route
        console.error("Failed to send invitation email (invitation still created):", emailError);
        
        // TODO: Consider implementing email retry queue or notification to admin
      }

      return NextResponse.json(kernelOk({ 
        invitation: {
          ...invitation,
          expiresAt: invitation.expiresAt?.toISOString() ?? "",
          acceptedAt: invitation.acceptedAt?.toISOString() ?? null,
          createdAt: invitation.createdAt?.toISOString() ?? "",
          updatedAt: invitation.updatedAt?.toISOString() ?? "",
        }
      }, { traceId }), {
        status: HTTP_STATUS.CREATED,
        headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const status = message.includes("already a member") 
        ? HTTP_STATUS.BAD_REQUEST 
        : HTTP_STATUS.INTERNAL_SERVER_ERROR;
      
      return NextResponse.json(
        kernelFail({ code: KERNEL_ERROR_CODES.VALIDATION, message }, { traceId }),
        { status, headers: { [KERNEL_HEADERS.REQUEST_ID]: traceId, [KERNEL_HEADERS.TRACE_ID]: traceId } }
      );
    }
  }, "admin"),
  memberInviteLimiter
);

