/**
 * Common MIME types.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeStringEnum } from "./afenda.core.helper";

export const MIME_TYPES = {
  JSON: "application/json",
  TEXT: "text/plain",
  HTML: "text/html",
  CSV: "text/csv",
  PDF: "application/pdf",
  PNG: "image/png",
  JPEG: "image/jpeg",
  WEBP: "image/webp",
} as const;

export type MimeType = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];

const MimeTypeEnum = makeStringEnum(MIME_TYPES);

export const MIME_TYPE_LIST = MimeTypeEnum.list as readonly MimeType[];
export const isMimeType = MimeTypeEnum.is;

export function toMimeType(value: unknown, fallback: MimeType = MIME_TYPES.JSON): MimeType {
  return MimeTypeEnum.to(value, fallback) as MimeType;
}
