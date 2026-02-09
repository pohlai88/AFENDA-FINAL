/**
 * R2 presigned URL helpers (S3-compatible).
 * Follows Cloudflare R2 presigned URL best practices:
 * https://developers.cloudflare.com/r2/api/s3/presigned-urls/
 *
 * Use for temporary upload (PUT) or download (GET) without exposing API credentials.
 * Restrict Content-Type on PUT to limit abuse; configure CORS on the bucket for browser uploads.
 */

import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { getR2Client } from "./client";

export interface PresignPutOptions {
  bucket: string;
  key: string;
  contentType?: string;
  contentLength?: number;
  /** Expiry in seconds (default 3600). Max 604800 (7 days) for R2. */
  expiresIn?: number;
}

export interface PresignGetOptions {
  bucket: string;
  key: string;
  /** Expiry in seconds (default 3600). */
  expiresIn?: number;
}

const DEFAULT_EXPIRY = 3600;

/**
 * Generate a presigned PUT URL for uploading an object to R2.
 * Caller must use the same Content-Type (and optionally Content-Length) when uploading.
 */
export async function presignPutObject(
  options: PresignPutOptions
): Promise<{ url: string }> {
  const s3 = getR2Client();
  const expiresIn = options.expiresIn ?? DEFAULT_EXPIRY;
  const command = new PutObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
    ...(options.contentType != null && { ContentType: options.contentType }),
    ...(options.contentLength != null && { ContentLength: options.contentLength }),
  });
  const url = await getSignedUrl(s3, command, { expiresIn });
  return { url };
}

/**
 * Generate a presigned GET URL for downloading an object from R2.
 */
export async function presignGetObject(
  options: PresignGetOptions
): Promise<{ url: string }> {
  const s3 = getR2Client();
  const expiresIn = options.expiresIn ?? DEFAULT_EXPIRY;
  const command = new GetObjectCommand({
    Bucket: options.bucket,
    Key: options.key,
  });
  const url = await getSignedUrl(s3, command, { expiresIn });
  return { url };
}
