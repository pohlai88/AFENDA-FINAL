/**
 * @layer domain (magicdrive)
 * @responsibility Drizzle ORM schemas and relations for magicdrive domain.
 */

export * from "./magicdrive.schema";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";
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

export type magicdriveObject = InferSelectModel<typeof magicdriveObjects>;
export type magicdriveObjectInsert = InferInsertModel<typeof magicdriveObjects>;
export type magicdriveVersion = InferSelectModel<typeof magicdriveObjectVersions>;
export type magicdriveVersionInsert = InferInsertModel<typeof magicdriveObjectVersions>;
export type magicdriveUpload = InferSelectModel<typeof magicdriveUploads>;
export type magicdriveUploadInsert = InferInsertModel<typeof magicdriveUploads>;
export type magicdriveDuplicateGroup = InferSelectModel<typeof magicdriveDuplicateGroups>;
export type magicdriveTag = InferSelectModel<typeof magicdriveTags>;
export type magicdriveSavedView = InferSelectModel<typeof magicdriveSavedViews>;
export type magicdriveObjectIndexRow = InferSelectModel<typeof magicdriveObjectIndex>;
export type magicdriveCollection = InferSelectModel<typeof magicdriveCollections>;
export type magicdriveTenantSettingsRow = InferSelectModel<typeof magicdriveTenantSettings>;
export type magicdriveUserPreferencesRow = InferSelectModel<typeof magicdriveUserPreferences>;

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
