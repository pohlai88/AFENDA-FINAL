/**
 * @domain tenancy
 * @layer server
 * @responsibility Audit logging for governance and compliance
 * Phase 2, Step 2.5: Track critical tenant actions
 */

import "server-only";

import { desc, and, eq } from "drizzle-orm";
import { tenancyAuditLogs } from "@afenda/tenancy/drizzle";
import { db } from "@afenda/shared/server/db";
import type { Database } from "@afenda/shared/server/db";

export type AuditAction =
  | "organization.create"
  | "organization.update"
  | "organization.delete"
  | "organization.transfer_ownership"
  | "team.create"
  | "team.update"
  | "team.delete"
  | "membership.add"
  | "membership.role_change"
  | "membership.remove"
  | "membership.leave"
  | "invitation.send"
  | "invitation.accept"
  | "invitation.decline"
  | "invitation.cancel"
  | "design_system.update";

export interface AuditLogParams {
  actorId: string;
  actorEmail?: string;
  action: AuditAction;
  resourceType: "organization" | "team" | "membership" | "invitation" | "design_system";
  resourceId: string;
  organizationId?: string;
  teamId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
}

export interface AuditLogFilters {
  actorId?: string;
  resourceType?: string;
  resourceId?: string;
  organizationId?: string;
  teamId?: string;
  action?: AuditAction;
  limit?: number;
  offset?: number;
}

export const tenancyAuditService = {
  /**
   * Log an audit event
   * 
   * @param params - Audit log parameters
   * @param dbx - Optional database instance (for transactions)
   * @returns Created audit log record
   * 
   * @example
   * ```ts
   * await tenancyAuditService.log({
   *   actorId: userId,
   *   actorEmail: "user@example.com",
   *   action: "membership.role_change",
   *   resourceType: "membership",
   *   resourceId: membershipId,
   *   organizationId: orgId,
   *   metadata: { oldRole: "member", newRole: "admin" },
   *   ipAddress: request.headers.get("x-forwarded-for"),
   *   userAgent: request.headers.get("user-agent"),
   * });
   * ```
   */
  async log(params: AuditLogParams, dbx: Database = db) {
    const [record] = await dbx
      .insert(tenancyAuditLogs)
      .values({
        actorId: params.actorId,
        actorEmail: params.actorEmail,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        organizationId: params.organizationId,
        teamId: params.teamId,
        metadata: params.metadata,
        ipAddress: params.ipAddress,
        userAgent: params.userAgent,
      })
      .returning();

    return record;
  },

  /**
   * Retrieve audit logs with filters
   * 
   * @param filters - Query filters (actorId, resourceType, etc.)
   * @param dbx - Optional database instance
   * @returns Array of audit log records
   * 
   * @example
   * ```ts
   * const logs = await tenancyAuditService.getLogs({
   *   organizationId: "org-123",
   *   resourceType: "membership",
   *   limit: 50,
   * });
   * ```
   */
  async getLogs(filters: AuditLogFilters, dbx: Database = db) {
    const conditions = [];

    if (filters.actorId) {
      conditions.push(eq(tenancyAuditLogs.actorId, filters.actorId));
    }
    if (filters.resourceType) {
      conditions.push(eq(tenancyAuditLogs.resourceType, filters.resourceType));
    }
    if (filters.resourceId) {
      conditions.push(eq(tenancyAuditLogs.resourceId, filters.resourceId));
    }
    if (filters.organizationId) {
      conditions.push(eq(tenancyAuditLogs.organizationId, filters.organizationId));
    }
    if (filters.teamId) {
      conditions.push(eq(tenancyAuditLogs.teamId, filters.teamId));
    }
    if (filters.action) {
      conditions.push(eq(tenancyAuditLogs.action, filters.action));
    }

    const query = dbx
      .select()
      .from(tenancyAuditLogs)
      .orderBy(desc(tenancyAuditLogs.createdAt))
      .limit(filters.limit ?? 100)
      .offset(filters.offset ?? 0);

    if (conditions.length > 0) {
      return query.where(and(...conditions));
    }

    return query;
  },

  /**
   * Get audit logs for a specific organization
   * 
   * @param organizationId - Organization ID
   * @param limit - Max records to return (default 100)
   * @param offset - Pagination offset (default 0)
   * @param dbx - Optional database instance
   * @returns Array of audit log records
   */
  async getOrganizationLogs(
    organizationId: string,
    limit = 100,
    offset = 0,
    dbx: Database = db
  ) {
    return this.getLogs({ organizationId, limit, offset }, dbx);
  },

  /**
   * Get audit logs for a specific team
   * 
   * @param teamId - Team ID
   * @param limit - Max records to return (default 100)
   * @param offset - Pagination offset (default 0)
   * @param dbx - Optional database instance
   * @returns Array of audit log records
   */
  async getTeamLogs(teamId: string, limit = 100, offset = 0, dbx: Database = db) {
    return this.getLogs({ teamId, limit, offset }, dbx);
  },

  /**
   * Get audit logs for a specific resource
   * 
   * @param resourceType - Type of resource
   * @param resourceId - Resource ID
   * @param limit - Max records to return (default 50)
   * @param dbx - Optional database instance
   * @returns Array of audit log records
   */
  async getResourceLogs(
    resourceType: string,
    resourceId: string,
    limit = 50,
    dbx: Database = db
  ) {
    return this.getLogs({ resourceType, resourceId, limit }, dbx);
  },

  /**
   * Get audit logs by actor (user)
   * 
   * @param actorId - User ID who performed actions
   * @param limit - Max records to return (default 100)
   * @param offset - Pagination offset (default 0)
   * @param dbx - Optional database instance
   * @returns Array of audit log records
   */
  async getActorLogs(actorId: string, limit = 100, offset = 0, dbx: Database = db) {
    return this.getLogs({ actorId, limit, offset }, dbx);
  },
};
