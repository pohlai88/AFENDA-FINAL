/**
 * @layer domain (magicdrive)
 * @responsibility MagicDrive domain tables (authoritative DB schema).
 * Prefix all tables with "magicdrive_" to avoid conflicts.
 *
 * ## Multi-Tenancy Contract
 *
 * Every domain table MUST have:
 *   - tenant_id (required, FK to tenancy.teams.id)
 *   - team_id (required, FK to tenancy.teams.id)
 *   - RLS policies enforcing tenant isolation
 *
 * @see .dev-note/multi-tenancy-schema.md
 */

import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { tenancyColumns, tenancyIndexes } from "@afenda/tenancy/drizzle";
import {
  timestamps,
  createdAtOnly,
  idx,
  domainPolicies,
  domainPoliciesTenantOnly,
} from "@afenda/shared/drizzle/manifest";

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
    ownerId: text("owner_id").notNull(),
    currentVersionId: text("current_version_id"),
    title: text("title"),
    docType: magicdriveDocTypeEnum("doc_type").notNull().default("other"),
    status: magicdriveStatusEnum("status").notNull().default("inbox"),
    deletedAt: timestamp("deleted_at", { withTimezone: true, mode: "date" }),
    archivedAt: timestamp("archived_at", { withTimezone: true, mode: "date" }),
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magicdrive_objects", t),
    idx("magicdrive_objects", "status").on(t.status),
    idx("magicdrive_objects", "doc_type").on(t.docType),
    ...domainPoliciesTenantOnly("magicdrive_objects", t),
  ],
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
    ...tenancyColumns.withTenancy(),
    ...createdAtOnly(),
  },
  (t) => [
    ...tenancyIndexes("magicdrive_object_versions", t),
    idx("magicdrive_object_versions", "object_id").on(t.objectId),
    idx("magicdrive_object_versions", "sha256").on(t.sha256),
    ...domainPoliciesTenantOnly("magicdrive_object_versions", t),
  ],
);

// Uploads (quarantine → ingest flow)
export const magicdriveUploads = pgTable(
  "magicdrive_uploads",
  {
    id: text("id").primaryKey(),
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
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magicdrive_uploads", t),
    idx("magicdrive_uploads", "status").on(t.status),
    ...domainPoliciesTenantOnly("magicdrive_uploads", t),
  ],
);

// Duplicate groups
export const magicdriveDuplicateGroups = pgTable(
  "magicdrive_duplicate_groups",
  {
    id: text("id").primaryKey(),
    reason: magicdriveDupReasonEnum("reason").notNull(),
    keepVersionId: text("keep_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magicdrive_duplicate_groups", t),
    ...domainPoliciesTenantOnly("magicdrive_duplicate_groups", t),
  ],
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
  (t) => [
    uniqueIndex("magicdrive_dgv_group_version_idx").on(
      t.groupId,
      t.versionId
    ),
    idx("magicdrive_dgv", "group_id").on(t.groupId),
  ],
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
    ...tenancyColumns.withTenancy(),
    ...timestamps(),
  },
  (t) => [
    ...tenancyIndexes("magicdrive_object_index", t),
    idx("magicdrive_object_index", "object_id").on(t.objectId),
    idx("magicdrive_object_index", "text_hash").on(t.textHash),
    ...domainPoliciesTenantOnly("magicdrive_object_index", t),
  ],
);

// Tags
export const magicdriveTags = pgTable(
  "magicdrive_tags",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    color: text("color"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magicdrive_tags", t),
    idx("magicdrive_tags", "slug").on(t.slug),
    ...domainPoliciesTenantOnly("magicdrive_tags", t),
  ],
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
  (t) => [
    uniqueIndex("magicdrive_ot_object_tag_idx").on(t.objectId, t.tagId),
    idx("magicdrive_ot", "object_id").on(t.objectId),
    idx("magicdrive_ot", "tag_id").on(t.tagId),
  ],
);

// Saved views
export const magicdriveSavedViews = pgTable(
  "magicdrive_saved_views",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    filters: jsonb("filters").default({}),
    viewMode: text("view_mode").default("cards"),
    sortBy: text("sort_by").default("createdAt"),
    sortOrder: text("sort_order").default("desc"),
    isPublic: boolean("is_public").default(false),
    isDefault: boolean("is_default").default(false),
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magicdrive_saved_views", t),
    idx("magicdrive_saved_views", "user_id").on(t.userId),
    ...domainPolicies("magicdrive_saved_views", t),
  ],
);

// User preferences
export const magicdriveUserPreferences = pgTable(
  "magicdrive_user_preferences",
  {
    id: text("id").primaryKey(),
    userId: text("user_id").notNull(),
    defaultView: text("default_view").default("cards"),
    itemsPerPage: integer("items_per_page").default(20),
    defaultSort: text("default_sort"),
    showFileExtensions: boolean("show_file_extensions").default(true),
    showThumbnails: boolean("show_thumbnails").default(true),
    compactMode: boolean("compact_mode").default(false),
    quickSettings: jsonb("quick_settings").default({}),
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    uniqueIndex("magicdrive_up_tenant_user_idx").on(t.tenantId, t.userId),
    ...tenancyIndexes("magicdrive_user_preferences", t),
    ...domainPolicies("magicdrive_user_preferences", t),
  ],
);

// Tenant settings
export const magicdriveTenantSettings = pgTable(
  "magicdrive_tenant_settings",
  {
    id: text("id").primaryKey(),
    documentTypes: jsonb("document_types").default([]),
    statusWorkflow: jsonb("status_workflow").default([]),
    enableAiSuggestions: boolean("enable_ai_suggestions").default(false),
    enablePublicShares: boolean("enable_public_shares").default(false),
    maxFileSizeMb: integer("max_file_size_mb").default(100),
    allowedFileTypes: jsonb("allowed_file_types").default([]),
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    uniqueIndex("magicdrive_tenant_settings_tenant_unique").on(t.tenantId),
    ...tenancyIndexes("magicdrive_tenant_settings", t),
    ...domainPoliciesTenantOnly("magicdrive_tenant_settings", t),
  ],
);

// Collections (albums)
export const magicdriveCollections = pgTable(
  "magicdrive_collections",
  {
    id: text("id").primaryKey(),
    ownerId: text("owner_id"),
    name: text("name").notNull(),
    description: text("description"),
    color: text("color"),
    icon: text("icon"),
    sortOrder: integer("sort_order").default(0),
    isSmartCollection: boolean("is_smart_collection").default(false),
    smartFilter: jsonb("smart_filter"),
    ...timestamps(),
    ...tenancyColumns.withTenancy(),
  },
  (t) => [
    ...tenancyIndexes("magicdrive_collections", t),
    ...domainPoliciesTenantOnly("magicdrive_collections", t),
  ],
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
  (t) => [
    uniqueIndex("magicdrive_co_collection_object_idx").on(
      t.collectionId,
      t.objectId
    ),
    idx("magicdrive_co", "collection_id").on(t.collectionId),
    idx("magicdrive_co", "object_id").on(t.objectId),
  ],
);
