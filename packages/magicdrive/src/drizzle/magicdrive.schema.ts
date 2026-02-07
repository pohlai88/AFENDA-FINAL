/**
 * @layer domain (magicdrive)
 * @responsibility MagicDrive domain tables (authoritative DB schema).
 * Prefix all tables with "magicdrive_" to avoid conflicts.
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const magicdriveUploadStatusEnum = pgEnum("magicdrive_upload_status", [
  "presigned",
  "uploaded",
  "ingested",
  "failed",
]);

export const magicdriveDocTypeEnum = pgEnum("magicdrive_doc_type", [
  "pdf",
  "image",
  "document",
  "spreadsheet",
  "presentation",
  "archive",
  "video",
  "audio",
  "other",
]);

export const magicdriveStatusEnum = pgEnum("magicdrive_status", [
  "inbox",
  "processing",
  "ready",
  "archived",
  "error",
  "deleted",
]);

export const magicdriveDupReasonEnum = pgEnum("magicdrive_dup_reason", ["exact", "near"]);

// Objects (documents)
export const magicdriveObjects = pgTable(
  "magicdrive_objects",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    ownerId: text("owner_id").notNull(),
    currentVersionId: text("current_version_id"),
    title: text("title"),
    docType: magicdriveDocTypeEnum("doc_type").notNull().default("other"),
    status: magicdriveStatusEnum("status").notNull().default("inbox"),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("magicdrive_objects_tenant_id_idx").on(table.tenantId),
    statusIdx: index("magicdrive_objects_status_idx").on(table.status),
    docTypeIdx: index("magicdrive_objects_doc_type_idx").on(table.docType),
  })
);

// Object versions (file content metadata)
export const magicdriveObjectVersions = pgTable(
  "magicdrive_object_versions",
  {
    id: text("id").primaryKey(),
    objectId: text("object_id")
      .notNull()
      .references(() => magicdriveObjects.id, { onDelete: "cascade" }),
    versionNo: integer("version_no").notNull(),
    r2Key: text("r2_key").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    objectIdx: index("magicdrive_object_versions_object_id_idx").on(table.objectId),
    sha256Idx: index("magicdrive_object_versions_sha256_idx").on(table.sha256),
  })
);

// Uploads (quarantine → ingest flow)
export const magicdriveUploads = pgTable(
  "magicdrive_uploads",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    ownerId: text("owner_id").notNull(),
    objectId: text("object_id").notNull(),
    versionId: text("version_id").notNull(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    sizeBytes: integer("size_bytes").notNull(),
    sha256: text("sha256").notNull(),
    r2KeyQuarantine: text("r2_key_quarantine").notNull(),
    status: magicdriveUploadStatusEnum("status").notNull().default("presigned"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("magicdrive_uploads_tenant_id_idx").on(table.tenantId),
    statusIdx: index("magicdrive_uploads_status_idx").on(table.status),
  })
);

// Duplicate groups
export const magicdriveDuplicateGroups = pgTable(
  "magicdrive_duplicate_groups",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    reason: magicdriveDupReasonEnum("reason").notNull(),
    keepVersionId: text("keep_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("magicdrive_duplicate_groups_tenant_id_idx").on(table.tenantId),
  })
);

// Duplicate group versions (junction)
export const magicdriveDuplicateGroupVersions = pgTable(
  "magicdrive_duplicate_group_versions",
  {
    groupId: text("group_id")
      .notNull()
      .references(() => magicdriveDuplicateGroups.id, { onDelete: "cascade" }),
    versionId: text("version_id").notNull(),
  },
  (table) => ({
    groupVersionIdx: uniqueIndex("magicdrive_dgv_group_version_idx").on(
      table.groupId,
      table.versionId
    ),
    groupIdx: index("magicdrive_dgv_group_id_idx").on(table.groupId),
  })
);

// Object index (full-text / OCR content for near-duplicate detection)
export const magicdriveObjectIndex = pgTable(
  "magicdrive_object_index",
  {
    id: text("id").primaryKey(),
    objectId: text("object_id")
      .notNull()
      .references(() => magicdriveObjects.id, { onDelete: "cascade" }),
    textHash: text("text_hash"),
    extractedText: text("extracted_text"),
    extractedFields: jsonb("extracted_fields"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    objectIdx: index("magicdrive_object_index_object_id_idx").on(table.objectId),
    textHashIdx: index("magicdrive_object_index_text_hash_idx").on(table.textHash),
  })
);

// Tags
export const magicdriveTags = pgTable(
  "magicdrive_tags",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("magicdrive_tags_tenant_id_idx").on(table.tenantId),
    slugIdx: index("magicdrive_tags_slug_idx").on(table.slug),
  })
);

// Object tags (junction)
export const magicdriveObjectTags = pgTable(
  "magicdrive_object_tags",
  {
    objectId: text("object_id")
      .notNull()
      .references(() => magicdriveObjects.id, { onDelete: "cascade" }),
    tagId: text("tag_id")
      .notNull()
      .references(() => magicdriveTags.id, { onDelete: "cascade" }),
  },
  (table) => ({
    objectTagIdx: uniqueIndex("magicdrive_ot_object_tag_idx").on(table.objectId, table.tagId),
    objectIdx: index("magicdrive_ot_object_id_idx").on(table.objectId),
    tagIdx: index("magicdrive_ot_tag_id_idx").on(table.tagId),
  })
);

// Saved views
export const magicdriveSavedViews = pgTable(
  "magicdrive_saved_views",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    filters: jsonb("filters").default({}),
    viewMode: text("view_mode").default("cards"),
    sortBy: text("sort_by").default("createdAt"),
    sortOrder: text("sort_order").default("desc"),
    isPublic: boolean("is_public").default(false),
    isDefault: boolean("is_default").default(false),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("magicdrive_saved_views_tenant_id_idx").on(table.tenantId),
    userIdx: index("magicdrive_saved_views_user_id_idx").on(table.userId),
  })
);

// User preferences
export const magicdriveUserPreferences = pgTable(
  "magicdrive_user_preferences",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    userId: text("user_id").notNull(),
    defaultView: text("default_view").default("cards"),
    itemsPerPage: integer("items_per_page").default(20),
    defaultSort: text("default_sort"),
    showFileExtensions: boolean("show_file_extensions").default(true),
    showThumbnails: boolean("show_thumbnails").default(true),
    compactMode: boolean("compact_mode").default(false),
    quickSettings: jsonb("quick_settings").default({}),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    tenantUserIdx: uniqueIndex("magicdrive_up_tenant_user_idx").on(table.tenantId, table.userId),
  })
);

// Tenant settings
export const magicdriveTenantSettings = pgTable(
  "magicdrive_tenant_settings",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull().unique(),
    documentTypes: jsonb("document_types").default([]),
    statusWorkflow: jsonb("status_workflow").default([]),
    enableAiSuggestions: boolean("enable_ai_suggestions").default(false),
    enablePublicShares: boolean("enable_public_shares").default(false),
    maxFileSizeMb: integer("max_file_size_mb").default(100),
    allowedFileTypes: jsonb("allowed_file_types").default([]),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("magicdrive_tenant_settings_tenant_id_idx").on(table.tenantId),
  })
);

// Collections (albums)
export const magicdriveCollections = pgTable(
  "magicdrive_collections",
  {
    id: text("id").primaryKey(),
    tenantId: text("tenant_id").notNull(),
    ownerId: text("owner_id"),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"),
    icon: text("icon"),
    sortOrder: integer("sort_order").default(0),
    isSmartCollection: boolean("is_smart_collection").default(false),
    smartFilter: jsonb("smart_filter"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  },
  (table) => ({
    tenantIdx: index("magicdrive_collections_tenant_id_idx").on(table.tenantId),
  })
);

// Collection objects (junction)
export const magicdriveCollectionObjects = pgTable(
  "magicdrive_collection_objects",
  {
    collectionId: text("collection_id")
      .notNull()
      .references(() => magicdriveCollections.id, { onDelete: "cascade" }),
    objectId: text("object_id")
      .notNull()
      .references(() => magicdriveObjects.id, { onDelete: "cascade" }),
  },
  (table) => ({
    collObjIdx: uniqueIndex("magicdrive_co_collection_object_idx").on(
      table.collectionId,
      table.objectId
    ),
    collectionIdx: index("magicdrive_co_collection_id_idx").on(table.collectionId),
    objectIdx: index("magicdrive_co_object_id_idx").on(table.objectId),
  })
);
