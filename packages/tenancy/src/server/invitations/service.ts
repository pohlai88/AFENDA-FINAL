/**
 * @domain tenancy
 * @layer server
 * @responsibility Invitation management (create, accept, decline, cancel)
 * Phase 3, Step 3.2: Email-based member invitation system
 */

import "server-only";

import { eq, and, sql, lt } from "drizzle-orm";
import { tenancyInvitations, tenancyMemberships, tenancyOrganizations, tenancyTeams } from "@afenda/tenancy/drizzle";
import { db } from "@afenda/shared/server/db";
import type { Database } from "@afenda/shared/server/db";
import { randomBytes } from "crypto";

/**
 * Generate a secure random token for invitation URL
 */
function generateInvitationToken(): string {
  return randomBytes(32).toString("base64url");
}

/**
 * Calculate expiry date (default: 7 days from now)
 */
function getExpiryDate(daysFromNow = 7): Date {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + daysFromNow);
  return expiry;
}

export const tenancyInvitationService = {
  /**
   * Create an organization invitation
   * 
   * @param email - Email address to invite
   * @param organizationId - Organization ID
   * @param role - Role to assign ("owner", "admin", "member")
   * @param invitedBy - User ID of inviter
   * @param message - Optional personal message
   * @param dbx - Optional database instance (for transactions)
   * @returns Created invitation record
   * 
   * @throws Error if invitation already exists or organization not found
   */
  async createOrgInvitation(
    email: string,
    organizationId: string,
    role: "owner" | "admin" | "member",
    invitedBy: string,
    message?: string,
    dbx: Database = db
  ) {
    // Check if user is already a member
    const [existingMembership] = await dbx
      .select()
      .from(tenancyMemberships)
      .where(
        and(
          eq(tenancyMemberships.organizationId, organizationId),
          eq(tenancyMemberships.isActive, true)
        )
      )
      .limit(1);

    if (existingMembership) {
      throw new Error("User is already a member of this organization");
    }

    // Cancel any existing pending invitation for this email+org
    await dbx
      .update(tenancyInvitations)
      .set({
        status: "cancelled",
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(tenancyInvitations.email, email),
          eq(tenancyInvitations.organizationId, organizationId),
          eq(tenancyInvitations.status, "pending")
        )
      );

    // Create new invitation
    const token = generateInvitationToken();
    const expiresAt = getExpiryDate();

    const [invitation] = await dbx
      .insert(tenancyInvitations)
      .values({
        email,
        organizationId,
        teamId: null,
        role,
        token,
        invitedBy,
        message,
        status: "pending",
        expiresAt,
      })
      .returning();

    if (!invitation) {
      throw new Error("Failed to create invitation");
    }

    return invitation;
  },

  /**
   * Create a team invitation
   * 
   * @param email - Email address to invite
   * @param teamId - Team ID
   * @param role - Role to assign ("lead", "member")
   * @param invitedBy - User ID of inviter
   * @param message - Optional personal message
   * @param dbx - Optional database instance
   * @returns Created invitation record
   */
  async createTeamInvitation(
    email: string,
    teamId: string,
    role: "lead" | "member",
    invitedBy: string,
    message?: string,
    dbx: Database = db
  ) {
    // Check if user is already a team member
    const [existingMembership] = await dbx
      .select()
      .from(tenancyMemberships)
      .where(
        and(
          eq(tenancyMemberships.teamId, teamId),
          eq(tenancyMemberships.isActive, true)
        )
      )
      .limit(1);

    if (existingMembership) {
      throw new Error("User is already a member of this team");
    }

    // Cancel any existing pending invitation
    await dbx
      .update(tenancyInvitations)
      .set({
        status: "cancelled",
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(tenancyInvitations.email, email),
          eq(tenancyInvitations.teamId, teamId),
          eq(tenancyInvitations.status, "pending")
        )
      );

    // Create new invitation
    const token = generateInvitationToken();
    const expiresAt = getExpiryDate();

    const [invitation] = await dbx
      .insert(tenancyInvitations)
      .values({
        email,
        organizationId: null,
        teamId,
        role,
        token,
        invitedBy,
        message,
        status: "pending",
        expiresAt,
      })
      .returning();

    if (!invitation) {
      throw new Error("Failed to create invitation");
    }

    return invitation;
  },

  /**
   * Accept an invitation
   * 
   * @param token - Invitation token from URL
   * @param userId - User ID accepting the invitation
   * @param dbx - Optional database instance
   * @returns Created membership record
   * 
   * @throws Error if token invalid, expired, or already used
   */
  async acceptInvitation(token: string, userId: string, dbx: Database = db) {
    // Find invitation
    const [invitation] = await dbx
      .select()
      .from(tenancyInvitations)
      .where(
        and(
          eq(tenancyInvitations.token, token),
          eq(tenancyInvitations.status, "pending")
        )
      );

    if (!invitation) {
      throw new Error("Invitation not found or already used");
    }

    // Check expiry
    if (invitation.expiresAt && new Date() > invitation.expiresAt) {
      // Mark as expired
      await dbx
        .update(tenancyInvitations)
        .set({
          status: "expired",
          updatedAt: sql`now()`,
        })
        .where(eq(tenancyInvitations.id, invitation.id));

      throw new Error("Invitation has expired");
    }

    // Create membership in transaction
    return await dbx.transaction(async (tx) => {
      // Create membership
      const [membership] = await tx
        .insert(tenancyMemberships)
        .values({
          id: crypto.randomUUID(),
          userId,
          organizationId: invitation.organizationId,
          teamId: invitation.teamId,
          role: invitation.role,
          invitedBy: invitation.invitedBy,
          isActive: true,
        })
        .returning();

      if (!membership) {
        throw new Error("Failed to create membership");
      }

      // Mark invitation as accepted
      await tx
        .update(tenancyInvitations)
        .set({
          status: "accepted",
          acceptedBy: userId,
          acceptedAt: sql`now()`,
          updatedAt: sql`now()`,
        })
        .where(eq(tenancyInvitations.id, invitation.id));

      return membership;
    });
  },

  /**
   * Decline an invitation
   * 
   * @param token - Invitation token
   * @param dbx - Optional database instance
   */
  async declineInvitation(token: string, dbx: Database = db) {
    const [invitation] = await dbx
      .update(tenancyInvitations)
      .set({
        status: "declined",
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(tenancyInvitations.token, token),
          eq(tenancyInvitations.status, "pending")
        )
      )
      .returning();

    if (!invitation) {
      throw new Error("Invitation not found or already processed");
    }

    return invitation;
  },

  /**
   * Cancel an invitation (by org admin/owner)
   * 
   * @param invitationId - Invitation ID
   * @param dbx - Optional database instance
   */
  async cancelInvitation(invitationId: string, dbx: Database = db) {
    const [invitation] = await dbx
      .update(tenancyInvitations)
      .set({
        status: "cancelled",
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(tenancyInvitations.id, invitationId),
          eq(tenancyInvitations.status, "pending")
        )
      )
      .returning();

    if (!invitation) {
      throw new Error("Invitation not found or already processed");
    }

    return invitation;
  },

  /**
   * List pending invitations for an organization
   * 
   * @param organizationId - Organization ID
   * @param dbx - Optional database instance
   * @returns Array of pending invitations
   */
  async listOrgInvitations(organizationId: string, dbx: Database = db) {
    const invitations = await dbx
      .select()
      .from(tenancyInvitations)
      .where(
        and(
          eq(tenancyInvitations.organizationId, organizationId),
          eq(tenancyInvitations.status, "pending")
        )
      )
      .orderBy(sql`${tenancyInvitations.createdAt} DESC`);

    return invitations;
  },

  /**
   * List pending invitations for a team
   * 
   * @param teamId - Team ID
   * @param dbx - Optional database instance
   * @returns Array of pending invitations
   */
  async listTeamInvitations(teamId: string, dbx: Database = db) {
    const invitations = await dbx
      .select()
      .from(tenancyInvitations)
      .where(
        and(
          eq(tenancyInvitations.teamId, teamId),
          eq(tenancyInvitations.status, "pending")
        )
      )
      .orderBy(sql`${tenancyInvitations.createdAt} DESC`);

    return invitations;
  },

  /**
   * Get invitation by token (for display on acceptance page)
   * 
   * @param token - Invitation token
   * @param dbx - Optional database instance
   * @returns Invitation with org/team details
   */
  async getInvitationByToken(token: string, dbx: Database = db) {
    const [invitation] = await dbx
      .select({
        id: tenancyInvitations.id,
        email: tenancyInvitations.email,
        organizationId: tenancyInvitations.organizationId,
        teamId: tenancyInvitations.teamId,
        role: tenancyInvitations.role,
        token: tenancyInvitations.token,
        invitedBy: tenancyInvitations.invitedBy,
        message: tenancyInvitations.message,
        status: tenancyInvitations.status,
        expiresAt: tenancyInvitations.expiresAt,
        createdAt: tenancyInvitations.createdAt,
        orgName: tenancyOrganizations.name,
        orgSlug: tenancyOrganizations.slug,
        teamName: tenancyTeams.name,
      })
      .from(tenancyInvitations)
      .leftJoin(
        tenancyOrganizations,
        eq(tenancyInvitations.organizationId, tenancyOrganizations.id)
      )
      .leftJoin(tenancyTeams, eq(tenancyInvitations.teamId, tenancyTeams.id))
      .where(eq(tenancyInvitations.token, token));

    return invitation;
  },

  /**
   * Clean up expired invitations (for cron job)
   * 
   * @param dbx - Optional database instance
   * @returns Number of invitations marked as expired
   */
  async cleanupExpiredInvitations(dbx: Database = db) {
    const result = await dbx
      .update(tenancyInvitations)
      .set({
        status: "expired",
        updatedAt: sql`now()`,
      })
      .where(
        and(
          eq(tenancyInvitations.status, "pending"),
          lt(tenancyInvitations.expiresAt, sql`now()`)
        )
      )
      .returning({ id: tenancyInvitations.id });

    return result.length;
  },
};

