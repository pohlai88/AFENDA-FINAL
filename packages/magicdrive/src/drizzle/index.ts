/**
 * @layer domain (magicdrive)
 * @responsibility Drizzle ORM schemas and relations for magicdrive domain.
 */

export * from "./magicdrive.schema";
export * from "./magicdrive.relations";
import {
  magicdriveObjects,
  magicdriveObjectVersions,
  magicdriveUploads,
  magicdriveDuplicateGroups,
  magicdriveTags,
  magicdriveSavedViews,
  magicdriveObjectIndex,
  magicdriveCollections,
  magicdriveTenantSettings,
  magicdriveUserPreferences,
} from "./magicdrive.schema";

// ─── Type Exports ($inferSelect / $inferInsert) ─────────────────────
export type MagicDriveObjectRow = typeof magicdriveObjects.$inferSelect;
export type MagicDriveObjectInsert = typeof magicdriveObjects.$inferInsert;
export type MagicDriveVersionRow = typeof magicdriveObjectVersions.$inferSelect;
export type MagicDriveVersionInsert = typeof magicdriveObjectVersions.$inferInsert;
export type MagicDriveUploadRow = typeof magicdriveUploads.$inferSelect;
export type MagicDriveUploadInsert = typeof magicdriveUploads.$inferInsert;
export type MagicDriveDuplicateGroupRow = typeof magicdriveDuplicateGroups.$inferSelect;
export type MagicDriveDuplicateGroupInsert = typeof magicdriveDuplicateGroups.$inferInsert;
export type MagicDriveTagRow = typeof magicdriveTags.$inferSelect;
export type MagicDriveTagInsert = typeof magicdriveTags.$inferInsert;
export type MagicDriveSavedViewRow = typeof magicdriveSavedViews.$inferSelect;
export type MagicDriveSavedViewInsert = typeof magicdriveSavedViews.$inferInsert;
export type MagicDriveObjectIndexRow = typeof magicdriveObjectIndex.$inferSelect;
export type MagicDriveObjectIndexInsert = typeof magicdriveObjectIndex.$inferInsert;
export type MagicDriveCollectionRow = typeof magicdriveCollections.$inferSelect;
export type MagicDriveCollectionInsert = typeof magicdriveCollections.$inferInsert;
export type MagicDriveTenantSettingsRow = typeof magicdriveTenantSettings.$inferSelect;
export type MagicDriveTenantSettingsInsert = typeof magicdriveTenantSettings.$inferInsert;
export type MagicDriveUserPreferencesRow = typeof magicdriveUserPreferences.$inferSelect;
export type MagicDriveUserPreferencesInsert = typeof magicdriveUserPreferences.$inferInsert;

// ─── Legacy type aliases (deprecated — use PascalCase above) ────────
/** @deprecated Use MagicDriveObjectRow */
export type magicdriveObject = MagicDriveObjectRow;
/** @deprecated Use MagicDriveObjectInsert */
export type magicdriveObjectInsert = MagicDriveObjectInsert;
/** @deprecated Use MagicDriveVersionRow */
export type magicdriveVersion = MagicDriveVersionRow;
/** @deprecated Use MagicDriveVersionInsert */
export type magicdriveVersionInsert = MagicDriveVersionInsert;
/** @deprecated Use MagicDriveUploadRow */
export type magicdriveUpload = MagicDriveUploadRow;
/** @deprecated Use MagicDriveUploadInsert */
export type magicdriveUploadInsert = MagicDriveUploadInsert;
/** @deprecated Use MagicDriveDuplicateGroupRow */
export type magicdriveDuplicateGroup = MagicDriveDuplicateGroupRow;
/** @deprecated Use MagicDriveTagRow */
export type magicdriveTag = MagicDriveTagRow;
/** @deprecated Use MagicDriveSavedViewRow */
export type magicdriveSavedView = MagicDriveSavedViewRow;
/** @deprecated Use MagicDriveObjectIndexRow */
export type magicdriveObjectIndexRow = MagicDriveObjectIndexRow;
/** @deprecated Use MagicDriveCollectionRow */
export type magicdriveCollection = MagicDriveCollectionRow;
/** @deprecated Use MagicDriveTenantSettingsRow */
export type magicdriveTenantSettingsRow = MagicDriveTenantSettingsRow;
/** @deprecated Use MagicDriveUserPreferencesRow */
export type magicdriveUserPreferencesRow = MagicDriveUserPreferencesRow;

/** Document status values. */
export const DOCUMENT_STATUS = {
  INBOX: "inbox",
  PROCESSING: "processing",
  READY: "ready",
  ARCHIVED: "archived",
  ERROR: "error",
} as const;

/** Drizzle/schema document status (zod contracts use DocumentStatus from magicdrive.document.zod). */
export type DrizzleDocumentStatus = (typeof DOCUMENT_STATUS)[keyof typeof DOCUMENT_STATUS];

/** Document type values. */
export const DOCUMENT_TYPES = {
  PDF: "pdf",
  IMAGE: "image",
  DOCUMENT: "document",
  SPREADSHEET: "spreadsheet",
  PRESENTATION: "presentation",
  ARCHIVE: "archive",
  VIDEO: "video",
  AUDIO: "audio",
  OTHER: "other",
} as const;

/** Drizzle/schema document type (zod contracts use DocumentType from magicdrive.document.zod). */
export type DrizzleDocumentType = (typeof DOCUMENT_TYPES)[keyof typeof DOCUMENT_TYPES];
