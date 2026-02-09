/**
 * @layer domain (magicdrive)
 * @responsibility Drizzle ORM relation definitions for MagicDrive domain tables.
 *
 * Enables the relational query API:
 * ```ts
 * db.query.magicdriveObjects.findMany({ with: { versions: true, tags: true } })
 * ```
 */

import { relations } from "drizzle-orm";
import {
  magicdriveObjects,
  magicdriveObjectVersions,
  magicdriveUploads as _magicdriveUploads,
  magicdriveDuplicateGroups,
  magicdriveDuplicateGroupVersions,
  magicdriveObjectIndex,
  magicdriveTags,
  magicdriveObjectTags,
  magicdriveSavedViews as _magicdriveSavedViews,
  magicdriveUserPreferences as _magicdriveUserPreferences,
  magicdriveTenantSettings as _magicdriveTenantSettings,
  magicdriveCollections,
  magicdriveCollectionObjects,
} from "./magicdrive.schema";

// ─── Objects (documents) ─────────────────────────────────────────────
export const magicdriveObjectsRelations = relations(
  magicdriveObjects,
  ({ many }) => ({
    versions: many(magicdriveObjectVersions),
    index: many(magicdriveObjectIndex),
    objectTags: many(magicdriveObjectTags),
    collectionObjects: many(magicdriveCollectionObjects),
  })
);

// ─── Object Versions ─────────────────────────────────────────────────
export const magicdriveObjectVersionsRelations = relations(
  magicdriveObjectVersions,
  ({ one }) => ({
    object: one(magicdriveObjects, {
      fields: [magicdriveObjectVersions.objectId],
      references: [magicdriveObjects.id],
    }),
  })
);

// ─── Object Index (full-text / OCR) ──────────────────────────────────
export const magicdriveObjectIndexRelations = relations(
  magicdriveObjectIndex,
  ({ one }) => ({
    object: one(magicdriveObjects, {
      fields: [magicdriveObjectIndex.objectId],
      references: [magicdriveObjects.id],
    }),
  })
);

// ─── Duplicate Groups ────────────────────────────────────────────────
export const magicdriveDuplicateGroupsRelations = relations(
  magicdriveDuplicateGroups,
  ({ many }) => ({
    versions: many(magicdriveDuplicateGroupVersions),
  })
);

export const magicdriveDuplicateGroupVersionsRelations = relations(
  magicdriveDuplicateGroupVersions,
  ({ one }) => ({
    group: one(magicdriveDuplicateGroups, {
      fields: [magicdriveDuplicateGroupVersions.groupId],
      references: [magicdriveDuplicateGroups.id],
    }),
  })
);

// ─── Tags ────────────────────────────────────────────────────────────
export const magicdriveTagsRelations = relations(
  magicdriveTags,
  ({ many }) => ({
    objectTags: many(magicdriveObjectTags),
  })
);

// ─── Object Tags (junction) ─────────────────────────────────────────
export const magicdriveObjectTagsRelations = relations(
  magicdriveObjectTags,
  ({ one }) => ({
    object: one(magicdriveObjects, {
      fields: [magicdriveObjectTags.objectId],
      references: [magicdriveObjects.id],
    }),
    tag: one(magicdriveTags, {
      fields: [magicdriveObjectTags.tagId],
      references: [magicdriveTags.id],
    }),
  })
);

// ─── Collections ─────────────────────────────────────────────────────
export const magicdriveCollectionsRelations = relations(
  magicdriveCollections,
  ({ many }) => ({
    collectionObjects: many(magicdriveCollectionObjects),
  })
);

// ─── Collection Objects (junction) ───────────────────────────────────
export const magicdriveCollectionObjectsRelations = relations(
  magicdriveCollectionObjects,
  ({ one }) => ({
    collection: one(magicdriveCollections, {
      fields: [magicdriveCollectionObjects.collectionId],
      references: [magicdriveCollections.id],
    }),
    object: one(magicdriveObjects, {
      fields: [magicdriveCollectionObjects.objectId],
      references: [magicdriveObjects.id],
    }),
  })
);

// ─── Standalone tables (no FK relations needed) ──────────────────────
// magicdriveUploads — has objectId/versionId columns but they reference
// quarantine-stage data; no Drizzle FK in schema. Relation omitted.
// magicdriveSavedViews — user-scoped, no FK relations.
// magicdriveUserPreferences — user-scoped, no FK relations.
// magicdriveTenantSettings — tenant-scoped singleton, no FK relations.
