/**
 * R2 (S3-compatible) client for Cloudflare R2 or compatible storage.
 * Uses env: R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME.
 */

import { S3Client } from "@aws-sdk/client-s3";

let _client: S3Client | null = null;

export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  );
}

export function getR2BucketName(): string {
  const name = process.env.R2_BUCKET_NAME;
  if (!name) throw new Error("R2_BUCKET_NAME is required");
  return name;
}

/**
 * Optional public base URL for the R2 bucket (e.g. https://pub-xxx.r2.dev).
 * When set, use with object key to build public read URLs; leave unset for private buckets
 * and use presigned GET URLs instead.
 * @see https://neon.com/docs/guides/cloudflare-r2
 */
export function getR2PublicBaseUrl(): string | null {
  const url = process.env.R2_PUBLIC_BASE_URL;
  if (!url || typeof url !== "string") return null;
  return url.replace(/\/$/, "");
}

export function getR2Client(): S3Client {
  if (!_client) {
    const accountId = process.env.R2_ACCOUNT_ID;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error("R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY are required");
    }
    _client = new S3Client({
      region: "auto",
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
  }
  return _client;
}
