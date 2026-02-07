/**
 * Shared Attachments / Cross-domain linking
 * ID-based references only — no cross-domain internal imports.
 *
 * @example
 * import type { Attachable, Attachment } from "@afenda/shared/attachments";
 */

export interface Attachment {
  id: string;
  sourceType: string;
  sourceId: string;
  targetType: string;
  targetId: string;
  createdAt?: string;
}

/**
 * Interface for entities that can have attachments
 */
export interface Attachable {
  id: string;
  attachments?: Attachment[];
}
