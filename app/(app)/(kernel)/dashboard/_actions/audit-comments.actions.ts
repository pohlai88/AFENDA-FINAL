"use server";

/**
 * Audit Log Comments Server Actions
 * Add and fetch comments for audit events
 */

import { db } from "@afenda/shared/server/db";
import { auditLogComments } from "@afenda/orchestra";
import { eq, desc } from "drizzle-orm";

export interface AuditComment {
  id: string;
  auditLogId: string;
  userId: string;
  userName: string;
  comment: string;
  createdAt: string;
  updatedAt: string;
}

export interface AddCommentInput {
  auditLogId: string;
  userId: string;
  userName: string;
  comment: string;
}

/**
 * Add a comment to an audit log entry
 */
export async function addAuditComment(input: AddCommentInput): Promise<AuditComment> {
  const [inserted] = await db
    .insert(auditLogComments)
    .values({
      auditLogId: input.auditLogId,
      userId: input.userId,
      userName: input.userName,
      comment: input.comment,
    })
    .returning();

  return {
    id: inserted.id,
    auditLogId: inserted.auditLogId,
    userId: inserted.userId,
    userName: inserted.userName,
    comment: inserted.comment,
    createdAt: inserted.createdAt.toISOString(),
    updatedAt: inserted.updatedAt.toISOString(),
  };
}

/**
 * Get all comments for an audit log entry
 */
export async function getAuditComments(auditLogId: string): Promise<AuditComment[]> {
  const rows = await db
    .select()
    .from(auditLogComments)
    .where(eq(auditLogComments.auditLogId, auditLogId))
    .orderBy(desc(auditLogComments.createdAt));

  return rows.map((row) => ({
    id: row.id,
    auditLogId: row.auditLogId,
    userId: row.userId,
    userName: row.userName,
    comment: row.comment,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }));
}

/**
 * Get comment counts for multiple audit logs
 */
export async function getAuditCommentCounts(
  auditLogIds: string[]
): Promise<Record<string, number>> {
  if (auditLogIds.length === 0) return {};

  const rows = await db
    .select()
    .from(auditLogComments)
    .where(eq(auditLogComments.auditLogId, auditLogIds[0])); // Simple implementation for now

  // Group by auditLogId and count
  const counts: Record<string, number> = {};
  for (const id of auditLogIds) {
    const count = rows.filter((r) => r.auditLogId === id).length;
    if (count > 0) counts[id] = count;
  }

  return counts;
}
