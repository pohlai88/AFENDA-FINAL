/**
 * @domain magicdrive
 * @layer server
 * @responsibility List objects (documents) and duplicate groups for tenant
 */

import "server-only"

import { and, asc, desc, eq, inArray, isNull, ne, sql } from "drizzle-orm"

import {
  getDb,
  magicdriveDuplicateGroupVersions,
  magicdriveDuplicateGroups,
  magicdriveObjectIndex,
  magicdriveObjectTags,
  magicdriveObjectVersions,
  magicdriveObjects,
} from "@afenda/shared/db"
import type { TagRow } from "./tags"
import { listTagsForObject, listTagsForObjects } from "./tags"

export type ListObjectsQuery = {
  status?: string
  docType?: string
  q?: string
  tagId?: string
  hasTags?: "0" | "1"
  hasType?: "0" | "1"
  dupGroup?: string
  sortBy?: "createdAt" | "title" | "sizeBytes"
  sortOrder?: "asc" | "desc"
  limit: number
  offset: number
}

export type ObjectWithVersion = {
  id: string
  tenantId: string
  teamId?: string | null
  ownerId: string
  title: string | null
  docType: string
  status: string
  currentVersionId: string | null
  deletedAt: Date | null
  archivedAt: Date | null
  createdAt: Date | null
  updatedAt: Date | null
  version?: {
    id: string
    versionNo: number
    mimeType: string
    sizeBytes: number
    sha256: string
    createdAt: Date | null
  }
  tags?: TagRow[]
}

export async function listObjects(
  tenantId: string,
  query: ListObjectsQuery,
  tenantContext?: { tenantId?: string | null; teamId?: string | null }
): Promise<{ items: ObjectWithVersion[]; total: number; limit: number; offset: number }> {
  const db = getDb()

  // Phase 4: Prefer tenantId filter when tenant context available, fallback to tenantId
  const tenantFilter = tenantContext?.tenantId
    ? eq(magicdriveObjects.tenantId, tenantContext.tenantId)
    : eq(magicdriveObjects.tenantId, tenantId)

  const conditions = [tenantFilter, isNull(magicdriveObjects.deletedAt)]
  if (query.status) {
    conditions.push(
      eq(magicdriveObjects.status, query.status as (typeof magicdriveObjects.$inferSelect)["status"])
    )
  }
  if (query.docType) {
    conditions.push(
      eq(magicdriveObjects.docType, query.docType as (typeof magicdriveObjects.$inferSelect)["docType"])
    )
  }
  if (query.tagId) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${magicdriveObjectTags}
        WHERE ${magicdriveObjectTags.objectId} = ${magicdriveObjects.id}
        AND ${magicdriveObjectTags.tagId} = ${query.tagId}
      )`
    )
  }
  if (query.hasTags === "0") {
    conditions.push(
      sql`NOT EXISTS (
        SELECT 1 FROM ${magicdriveObjectTags}
        WHERE ${magicdriveObjectTags.objectId} = ${magicdriveObjects.id}
      )`
    )
  }
  if (query.hasTags === "1") {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${magicdriveObjectTags}
        WHERE ${magicdriveObjectTags.objectId} = ${magicdriveObjects.id}
      )`
    )
  }
  if (query.hasType === "0") {
    conditions.push(eq(magicdriveObjects.docType, "other"))
  }
  if (query.hasType === "1") {
    conditions.push(ne(magicdriveObjects.docType, "other"))
  }
  if (query.dupGroup) {
    conditions.push(
      sql`EXISTS (
        SELECT 1 FROM ${magicdriveDuplicateGroupVersions} dgv
        INNER JOIN ${magicdriveObjectVersions} ov ON ov.id = dgv.version_id
        WHERE dgv.group_id = ${query.dupGroup} AND ov.object_id = ${magicdriveObjects.id}
      )`
    )
  }
  const searchPattern = query.q?.trim()
  if (searchPattern) {
    const like = `%${searchPattern.replace(/%/g, "\\%").replace(/_/g, "\\_")}%`
    // FTS when search_vector exists (migration 0011); else ILIKE on extracted_text
    const searchVectorCol = sql.raw('"search_vector"')
    conditions.push(
      sql`(
        (${magicdriveObjects.title} ILIKE ${like})
        OR
        EXISTS (
          SELECT 1 FROM ${magicdriveObjectIndex} oi
          WHERE oi.object_id = ${magicdriveObjects.id}
          AND oi.extracted_text IS NOT NULL
          AND (
            oi.extracted_text ILIKE ${like}
            OR (oi.${searchVectorCol} IS NOT NULL AND oi.${searchVectorCol} @@ plainto_tsquery('english', ${searchPattern}))
          )
        )
      )`
    )
  }

  const where = and(...conditions)

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(magicdriveObjects)
    .where(where)

  const total = totalResult[0]?.count ?? 0

  const sortBy = query.sortBy ?? "createdAt"
  const sortOrder = query.sortOrder ?? "desc"
  const orderByColumn =
    sortBy === "title"
      ? magicdriveObjects.title
      : sortBy === "sizeBytes"
        ? magicdriveObjectVersions.sizeBytes
        : magicdriveObjects.createdAt
  const orderByFn = sortOrder === "asc" ? asc : desc

  const rows = await db
    .select({
      object: magicdriveObjects,
      versionId: magicdriveObjectVersions.id,
      versionNo: magicdriveObjectVersions.versionNo,
      mimeType: magicdriveObjectVersions.mimeType,
      sizeBytes: magicdriveObjectVersions.sizeBytes,
      sha256: magicdriveObjectVersions.sha256,
      versionCreatedAt: magicdriveObjectVersions.createdAt,
    })
    .from(magicdriveObjects)
    .leftJoin(
      magicdriveObjectVersions,
      eq(magicdriveObjects.currentVersionId, magicdriveObjectVersions.id)
    )
    .where(where)
    .orderBy(
      orderByColumn != null
        ? orderByFn(orderByColumn)
        : desc(magicdriveObjects.createdAt)
    )
    .limit(query.limit)
    .offset(query.offset)

  const objectIds = rows.map((r) => r.object.id)
  const tagsByObjectId = await listTagsForObjects(tenantId, objectIds)

  const items: ObjectWithVersion[] = rows.map((r) => ({
    ...r.object,
    version: r.versionId
      ? {
        id: r.versionId,
        versionNo: r.versionNo!,
        mimeType: r.mimeType!,
        sizeBytes: r.sizeBytes!,
        sha256: r.sha256!,
        createdAt: r.versionCreatedAt!,
      }
      : undefined,
    tags: tagsByObjectId[r.object.id] ?? [],
  }))

  return { items, total, limit: query.limit, offset: query.offset }
}

export type ObjectDetailWithVersions = ObjectWithVersion & {
  versions: Array<{
    id: string
    versionNo: number
    mimeType: string
    sizeBytes: number
    sha256: string
    createdAt: Date | null
  }>
  tags: TagRow[]
  extractedText: string | null
  extractedFields: Record<string, unknown>
}

export async function getObjectById(
  tenantId: string,
  objectId: string,
  tenantContext?: { tenantId?: string | null; teamId?: string | null }
): Promise<ObjectDetailWithVersions | null> {
  const db = getDb()

  // Phase 4: Prefer tenantId filter when available
  const tenantFilter = tenantContext?.tenantId
    ? eq(magicdriveObjects.tenantId, tenantContext.tenantId)
    : eq(magicdriveObjects.tenantId, tenantId)

  const [row] = await db
    .select({
      object: magicdriveObjects,
      versionId: magicdriveObjectVersions.id,
      versionNo: magicdriveObjectVersions.versionNo,
      mimeType: magicdriveObjectVersions.mimeType,
      sizeBytes: magicdriveObjectVersions.sizeBytes,
      sha256: magicdriveObjectVersions.sha256,
      versionCreatedAt: magicdriveObjectVersions.createdAt,
    })
    .from(magicdriveObjects)
    .leftJoin(
      magicdriveObjectVersions,
      eq(magicdriveObjects.currentVersionId, magicdriveObjectVersions.id)
    )
    .where(
      and(
        eq(magicdriveObjects.id, objectId),
        tenantFilter,
        isNull(magicdriveObjects.deletedAt)
      )
    )
    .limit(1)

  if (!row?.object) return null

  const [allVersions, tags, indexRow] = await Promise.all([
    db
      .select({
        id: magicdriveObjectVersions.id,
        versionNo: magicdriveObjectVersions.versionNo,
        mimeType: magicdriveObjectVersions.mimeType,
        sizeBytes: magicdriveObjectVersions.sizeBytes,
        sha256: magicdriveObjectVersions.sha256,
        createdAt: magicdriveObjectVersions.createdAt,
      })
      .from(magicdriveObjectVersions)
      .where(eq(magicdriveObjectVersions.objectId, objectId))
      .orderBy(desc(magicdriveObjectVersions.versionNo)),
    listTagsForObject(tenantId, objectId),
    db
      .select({
        extractedText: magicdriveObjectIndex.extractedText,
        extractedFields: magicdriveObjectIndex.extractedFields,
      })
      .from(magicdriveObjectIndex)
      .where(eq(magicdriveObjectIndex.objectId, objectId))
      .limit(1),
  ])

  const idx = indexRow[0]

  return {
    ...row.object,
    version: row.versionId
      ? {
        id: row.versionId,
        versionNo: row.versionNo!,
        mimeType: row.mimeType!,
        sizeBytes: row.sizeBytes!,
        sha256: row.sha256!,
        createdAt: row.versionCreatedAt!,
      }
      : undefined,
    versions: allVersions,
    tags,
    extractedText: idx?.extractedText ?? null,
    extractedFields: (idx?.extractedFields as Record<string, unknown>) ?? {},
  }
}

export type DuplicateGroupWithVersions = {
  id: string
  tenantId: string
  reason: string
  keepVersionId: string | null
  createdAt: Date | null
  versions: {
    versionId: string
    objectId: string
    title: string | null
    mimeType: string
    sizeBytes: number
    sha256: string
    versionCreatedAt: Date | null
  }[]
}

export async function listDuplicateGroups(
  tenantId: string,
  limit: number,
  offset: number,
  tenantContext?: { tenantId?: string | null; teamId?: string | null }
): Promise<{ items: DuplicateGroupWithVersions[]; total: number; limit: number; offset: number }> {
  const db = getDb()

  // Phase 4: Prefer tenantId filter when available
  const tenantFilter = tenantContext?.tenantId
    ? eq(magicdriveDuplicateGroups.tenantId, tenantContext.tenantId)
    : eq(magicdriveDuplicateGroups.tenantId, tenantId)

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(magicdriveDuplicateGroups)
    .where(tenantFilter)

  const total = totalResult[0]?.count ?? 0

  const groups = await db
    .select()
    .from(magicdriveDuplicateGroups)
    .where(tenantFilter)
    .orderBy(desc(magicdriveDuplicateGroups.createdAt))
    .limit(limit)
    .offset(offset)

  if (groups.length === 0) {
    return { items: [], total, limit, offset }
  }

  const groupIds = groups.map((g) => g.id)
  const versionRows = await db
    .select({
      groupId: magicdriveDuplicateGroupVersions.groupId,
      versionId: magicdriveDuplicateGroupVersions.versionId,
      objectId: magicdriveObjectVersions.objectId,
      title: magicdriveObjects.title,
      mimeType: magicdriveObjectVersions.mimeType,
      sizeBytes: magicdriveObjectVersions.sizeBytes,
      sha256: magicdriveObjectVersions.sha256,
      versionCreatedAt: magicdriveObjectVersions.createdAt,
    })
    .from(magicdriveDuplicateGroupVersions)
    .innerJoin(
      magicdriveObjectVersions,
      eq(magicdriveDuplicateGroupVersions.versionId, magicdriveObjectVersions.id)
    )
    .innerJoin(
      magicdriveObjects,
      eq(magicdriveObjectVersions.objectId, magicdriveObjects.id)
    )
    .where(inArray(magicdriveDuplicateGroupVersions.groupId, groupIds))
    .orderBy(desc(magicdriveObjectVersions.createdAt))

  const versionsByGroup = new Map<string, Array<(typeof versionRows)[number]>>()
  for (const row of versionRows) {
    const bucket = versionsByGroup.get(row.groupId)
    if (bucket) {
      bucket.push(row)
    } else {
      versionsByGroup.set(row.groupId, [row])
    }
  }

  const items: DuplicateGroupWithVersions[] = groups.map((g) => {
    const versions = versionsByGroup.get(g.id) ?? []
    return {
      id: g.id,
      tenantId: g.tenantId,
      reason: g.reason,
      keepVersionId: g.keepVersionId,
      createdAt: g.createdAt,
      versions: versions.map((v) => ({
        versionId: v.versionId,
        objectId: v.objectId,
        title: v.title,
        mimeType: v.mimeType,
        sizeBytes: v.sizeBytes,
        sha256: v.sha256,
        versionCreatedAt: v.versionCreatedAt,
      })),
    }
  })

  return { items, total, limit, offset }
}

/**
 * Dismiss a duplicate group (delete it). Only the group row is deleted;
 * cascade removes duplicate_group_versions. Caller must ensure tenant ownership.
 */
export async function dismissDuplicateGroup(
  tenantId: string,
  groupId: string,
  tenantContext?: { tenantId?: string | null; teamId?: string | null }
): Promise<{ deleted: boolean }> {
  const db = getDb()

  // Phase 4: Prefer tenantId filter when available
  const tenantFilter = tenantContext?.tenantId
    ? eq(magicdriveDuplicateGroups.tenantId, tenantContext.tenantId)
    : eq(magicdriveDuplicateGroups.tenantId, tenantId)

  const deleted = await db
    .delete(magicdriveDuplicateGroups)
    .where(
      and(
        eq(magicdriveDuplicateGroups.id, groupId),
        tenantFilter
      )
    )
    .returning({ id: magicdriveDuplicateGroups.id })
  return { deleted: deleted.length > 0 }
}

