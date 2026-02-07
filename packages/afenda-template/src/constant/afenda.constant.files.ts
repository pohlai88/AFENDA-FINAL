/**
 * File-related constants and MIME mappings.
 */
export const FILE_EXTENSIONS = {
  JSON: ".json",
  CSV: ".csv",
  PDF: ".pdf",
  PNG: ".png",
  JPG: ".jpg",
  JPEG: ".jpeg",
  WEBP: ".webp",
} as const;

export const FILE_SIZE_LIMITS = {
  SMALL_MB: 2,
  MEDIUM_MB: 10,
  LARGE_MB: 50,
} as const;

export const FILE_MIME_MAP = {
  JSON: "application/json",
  CSV: "text/csv",
  PDF: "application/pdf",
  PNG: "image/png",
  JPG: "image/jpeg",
  WEBP: "image/webp",
} as const;
