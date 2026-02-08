/**
 * @domain magicdrive
 * @layer server
 * @responsibility Tags: list by tenant, add/remove tag on object
 */

import "server-only"

import { and, eq, inArray } from "drizzle-orm"
import { randomUUID } from "node:crypto"

import {
  getDb,
  magicdriveObjectTags,
  magicdriveObjects,
  magicdriveTags,
} from "@afenda/shared/db"
import { magicdriveLogger } from "@afenda/magicdrive/pino"

export type TagRow = {
  id: string
  legacyTenantId: string
  organizationId?: string | null
  teamId?: string | null
  name: string
  slug: string
  color?: string | null
  createdAt: Date | null
}

export async function listTagsByTenant(
  tenantId: string
): Promise<TagRow[]> {
  try {
    const db = getDb()
    const rows = await db
      .select()
      .from(magicdriveTags)
      .where(eq(magicdriveTags.legacyTenantId, tenantId))
    return rows
  } catch (error) {
    magicdriveLogger.error({ err: error, tenantId }, "[magicdrive/tags] listTagsByTenant failed")
    throw error
  }
}

export async function listTagsForObject(
  tenantId: string,
  objectId: string
): Promise<TagRow[]> {
  const db = getDb()
  const rows = await db
    .select({
      id: magicdriveTags.id,
      legacyTenantId: magicdriveTags.legacyTenantId,
      name: magicdriveTags.name,
      slug: magicdriveTags.slug,
      createdAt: magicdriveTags.createdAt,
    })
    .from(magicdriveObjectTags)
    .innerJoin(
      magicdriveTags,
      eq(magicdriveObjectTags.tagId, magicdriveTags.id)
    )
    .where(
      and(
        eq(magicdriveObjectTags.objectId, objectId),
        eq(magicdriveTags.legacyTenantId, tenantId)
      )
    )
  return rows
}

/**
 * Batch-fetch tags for multiple objects. Returns a map objectId -> TagRow[].
 */
export async function listTagsForObjects(
  tenantId: string,
  objectIds: string[]
): Promise<Record<string, TagRow[]>> {
  if (objectIds.length === 0) return {}
  const db = getDb()
  const rows = await db
    .select({
      objectId: magicdriveObjectTags.objectId,
      id: magicdriveTags.id,
      legacyTenantId: magicdriveTags.legacyTenantId,
      name: magicdriveTags.name,
      slug: magicdriveTags.slug,
      createdAt: magicdriveTags.createdAt,
    })
    .from(magicdriveObjectTags)
    .innerJoin(
      magicdriveTags,
      eq(magicdriveObjectTags.tagId, magicdriveTags.id)
    )
    .where(
      and(
        inArray(magicdriveObjectTags.objectId, objectIds),
        eq(magicdriveTags.legacyTenantId, tenantId)
      )
    )
  const map: Record<string, TagRow[]> = {}
  for (const id of objectIds) map[id] = []
  for (const r of rows) {
    const tag: TagRow = {
      id: r.id,
      legacyTenantId: r.legacyTenantId,
      name: r.name,
      slug: r.slug,
      createdAt: r.createdAt,
    }
    map[r.objectId].push(tag)
  }
  return map
}

export async function addTagToObject(
  tenantId: string,
  objectId: string,
  tagId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb()

  const [obj] = await db
    .select({ id: magicdriveObjects.id })
    .from(magicdriveObjects)
    .where(
      and(
        eq(magicdriveObjects.id, objectId),
        eq(magicdriveObjects.legacyTenantId, tenantId)
      )
    )
    .limit(1)
  if (!obj) return { ok: false, error: "Object not found" }

  const [tag] = await db
    .select({ id: magicdriveTags.id })
    .from(magicdriveTags)
    .where(
      and(
        eq(magicdriveTags.id, tagId),
        eq(magicdriveTags.legacyTenantId, tenantId)
      )
    )
    .limit(1)
  if (!tag) return { ok: false, error: "Tag not found" }

  await db
    .insert(magicdriveObjectTags)
    .values({ objectId, tagId })
    .onConflictDoNothing()
  return { ok: true }
}

export async function removeTagFromObject(
  tenantId: string,
  objectId: string,
  tagId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb()

  const [obj] = await db
    .select({ id: magicdriveObjects.id })
    .from(magicdriveObjects)
    .where(
      and(
        eq(magicdriveObjects.id, objectId),
        eq(magicdriveObjects.legacyTenantId, tenantId)
      )
    )
    .limit(1)
  if (!obj) return { ok: false, error: "Object not found" }

  await db
    .delete(magicdriveObjectTags)
    .where(
      and(
        eq(magicdriveObjectTags.objectId, objectId),
        eq(magicdriveObjectTags.tagId, tagId)
      )
    )
  return { ok: true }
}

function nameToSlug(name: string): string {
  return name.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")
}

export async function deleteTag(
  tenantId: string,
  tagId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = getDb()
  const [tag] = await db
    .select({ id: magicdriveTags.id })
    .from(magicdriveTags)
    .where(
      and(
        eq(magicdriveTags.id, tagId),
        eq(magicdriveTags.legacyTenantId, tenantId)
      )
    )
    .limit(1)
  if (!tag) return { ok: false, error: "Tag not found" }
  await db
    .delete(magicdriveObjectTags)
    .where(eq(magicdriveObjectTags.tagId, tagId))
  await db.delete(magicdriveTags).where(eq(magicdriveTags.id, tagId))
  return { ok: true }
}

export async function createTag(
  tenantId: string,
  name: string
): Promise<{ ok: true; tag: TagRow } | { ok: false; error: string }> {
  const db = getDb()
  const slug = nameToSlug(name)
  const id = randomUUID()
  await db.insert(magicdriveTags).values({
    id,
    legacyTenantId: tenantId,
    name,
    slug: slug || id.slice(0, 8),
  })
  const [tag] = await db.select().from(magicdriveTags).where(eq(magicdriveTags.id, id)).limit(1)
  if (!tag) return { ok: false, error: "Failed to create tag" }
  return { ok: true, tag }
}

/**
 * Find tag by name (slug match) or create it. Returns tag id for addTagToObject.
 */
export async function findOrCreateTagByName(
  tenantId: string,
  name: string
): Promise<{ ok: true; tagId: string } | { ok: false; error: string }> {
  const slug = nameToSlug(name)
  if (!slug) return { ok: false, error: "Invalid tag name" }
  const db = getDb()
  const [existing] = await db
    .select({ id: magicdriveTags.id })
    .from(magicdriveTags)
    .where(and(eq(magicdriveTags.legacyTenantId, tenantId), eq(magicdriveTags.slug, slug)))
    .limit(1)
  if (existing) return { ok: true, tagId: existing.id }
  const created = await createTag(tenantId, name)
  if (!created.ok) return created
  return { ok: true, tagId: created.tag.id }
}
