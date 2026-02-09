/**
 * Orchestra Kernel Backup Storage Service
 * Dual storage: Cloudflare R2 (primary) + Local filesystem (fallback)
 * Uses @afenda/shared/r2 for R2 client; backup bucket is R2_BACKUP_BUCKET or R2_BUCKET_NAME.
 *
 * @domain orchestra
 * @layer server
 */

import "server-only";

import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { promises as fs } from "fs";
import { join, dirname } from "path";
import { createHash } from "crypto";
import {
  kernelOk,
  kernelFail,
  KERNEL_ERROR_CODES,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import { STORAGE_PROVIDERS, BACKUP_STORAGE_PATHS } from "../constant/orchestra.backup.constants";
import {
  getR2Client,
  getR2BucketName,
  isR2Configured as isSharedR2Configured,
} from "@afenda/shared/r2";

const LOCAL_STORAGE_PATH = process.env.BACKUP_STORAGE_PATH || BACKUP_STORAGE_PATHS.LOCAL_DEFAULT;

/** Backup bucket: R2_BACKUP_BUCKET when set, otherwise main R2_BUCKET_NAME. */
function getBackupBucket(): string {
  return process.env.R2_BACKUP_BUCKET || getR2BucketName();
}

export interface StorageMetadata {
  storageProvider: string;
  storageLocation: string;
  localFallbackPath?: string;
  sizeBytes: number;
  checksum: string;
}

/** R2 configured for backups (shared credentials; bucket is R2_BACKUP_BUCKET or R2_BUCKET_NAME). */
export function isR2Configured(): boolean {
  return isSharedR2Configured();
}

/**
 * Calculate SHA-256 checksum of data
 */
function calculateChecksum(data: Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

/**
 * Ensure local directory exists
 */
async function ensureLocalDirectory(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Upload backup to R2
 */
async function uploadToR2(
  data: Buffer,
  filename: string
): Promise<KernelEnvelope<{ location: string; checksum: string }>> {
  try {
    const client = getR2Client();
    const bucket = getBackupBucket();
    const key = `${BACKUP_STORAGE_PATHS.R2_PREFIX}${filename}`;

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: data,
      ContentType: "application/octet-stream",
    });

    await client.send(command);

    const checksum = calculateChecksum(data);

    return kernelOk({
      location: key,
      checksum,
    });
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to upload backup to R2",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Save backup to local filesystem
 */
async function saveToLocal(
  data: Buffer,
  filename: string
): Promise<KernelEnvelope<{ location: string; checksum: string }>> {
  try {
    const filePath = join(LOCAL_STORAGE_PATH, filename);
    await ensureLocalDirectory(filePath);
    await fs.writeFile(filePath, data);

    const checksum = calculateChecksum(data);

    return kernelOk({
      location: filePath,
      checksum,
    });
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to save backup to local storage",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Store backup with dual storage strategy
 * Production: R2 (primary) + Local (fallback)
 * Development: Local only
 */
export async function storeBackup(
  data: Buffer,
  filename: string
): Promise<KernelEnvelope<StorageMetadata>> {
  const sizeBytes = data.length;

  try {
    if (isR2Configured()) {
      // Production: R2 primary + local fallback
      const r2Result = await uploadToR2(data, filename);

      if (!r2Result.ok) {
        // R2 failed, fallback to local only
        const localResult = await saveToLocal(data, filename);

        if (!localResult.ok) {
          return kernelFail({
            code: KERNEL_ERROR_CODES.INTERNAL,
            message: "Failed to store backup (both R2 and local failed)",
            details: {
              r2Error: r2Result.error,
              localError: localResult.error,
            },
          });
        }

        return kernelOk({
          storageProvider: STORAGE_PROVIDERS.LOCAL,
          storageLocation: localResult.data.location,
          sizeBytes,
          checksum: localResult.data.checksum,
        });
      }

      // R2 succeeded, save local fallback copy
      const localResult = await saveToLocal(data, filename);

      return kernelOk({
        storageProvider: STORAGE_PROVIDERS.R2,
        storageLocation: r2Result.data.location,
        localFallbackPath: localResult.ok ? localResult.data.location : undefined,
        sizeBytes,
        checksum: r2Result.data.checksum,
      });
    } else {
      // Development: Local only
      const localResult = await saveToLocal(data, filename);

      if (!localResult.ok) {
        return localResult;
      }

      return kernelOk({
        storageProvider: STORAGE_PROVIDERS.LOCAL,
        storageLocation: localResult.data.location,
        sizeBytes,
        checksum: localResult.data.checksum,
      });
    }
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to store backup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Download backup from R2
 */
async function downloadFromR2(key: string): Promise<KernelEnvelope<Buffer>> {
  try {
    const client = getR2Client();
    const bucket = getBackupBucket();

    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    const response = await client.send(command);

    if (!response.Body) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: "Backup not found in R2",
      });
    }

    // Convert stream to buffer using AWS SDK's transformToByteArray
    const bytes = await response.Body.transformToByteArray();
    const buffer = Buffer.from(bytes);

    return kernelOk(buffer);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to download backup from R2",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Load backup from local filesystem
 */
async function loadFromLocal(filePath: string): Promise<KernelEnvelope<Buffer>> {
  try {
    const data = await fs.readFile(filePath);
    return kernelOk(data);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.NOT_FOUND,
      message: "Backup not found in local storage",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Retrieve backup from storage
 * Tries primary location first, then fallback
 */
export async function retrieveBackup(
  storageProvider: string,
  storageLocation: string,
  localFallbackPath?: string
): Promise<KernelEnvelope<Buffer>> {
  try {
    if (storageProvider === STORAGE_PROVIDERS.R2) {
      // Try R2 first
      const r2Result = await downloadFromR2(storageLocation);

      if (r2Result.ok) {
        return r2Result;
      }

      // R2 failed, try local fallback
      if (localFallbackPath) {
        return await loadFromLocal(localFallbackPath);
      }

      return r2Result; // Return R2 error if no fallback
    }

    // Local storage
    return await loadFromLocal(storageLocation);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to retrieve backup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete backup from R2
 */
async function deleteFromR2(key: string): Promise<KernelEnvelope<void>> {
  try {
    const client = getR2Client();
    const bucket = getBackupBucket();

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: key,
    });

    await client.send(command);
    return kernelOk(undefined);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to delete backup from R2",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete backup from local filesystem
 */
async function deleteFromLocal(filePath: string): Promise<KernelEnvelope<void>> {
  try {
    await fs.unlink(filePath);
    return kernelOk(undefined);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to delete backup from local storage",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete backup from storage
 * Deletes from both primary and fallback locations
 */
export async function deleteBackup(
  storageProvider: string,
  storageLocation: string,
  localFallbackPath?: string
): Promise<KernelEnvelope<void>> {
  try {
    const errors: string[] = [];

    // Delete from primary location
    if (storageProvider === STORAGE_PROVIDERS.R2) {
      const r2Result = await deleteFromR2(storageLocation);
      if (!r2Result.ok) {
        errors.push(`R2: ${r2Result.error.message}`);
      }
    } else {
      const localResult = await deleteFromLocal(storageLocation);
      if (!localResult.ok) {
        errors.push(`Local: ${localResult.error.message}`);
      }
    }

    // Delete from fallback location
    if (localFallbackPath) {
      const fallbackResult = await deleteFromLocal(localFallbackPath);
      if (!fallbackResult.ok) {
        errors.push(`Fallback: ${fallbackResult.error.message}`);
      }
    }

    if (errors.length > 0) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to delete backup from some locations",
        details: { errors },
      });
    }

    return kernelOk(undefined);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to delete backup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get storage info
 */
export function getStorageInfo() {
  return {
    r2Configured: isR2Configured(),
    localPath: LOCAL_STORAGE_PATH,
    primaryProvider: isR2Configured() ? STORAGE_PROVIDERS.R2 : STORAGE_PROVIDERS.LOCAL,
  };
}
