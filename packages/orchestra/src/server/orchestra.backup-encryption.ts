/**
 * Orchestra Kernel Backup Encryption Service
 * AES-256-GCM encryption for backup files with system config key management.
 *
 * @domain orchestra
 * @layer server
 */

import "server-only";

import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { getConfig, setConfig } from "./orchestra.admin-config";
import { logAudit, type AuditServiceDeps } from "./orchestra.audit";
import { AUDIT_EVENT_TYPES } from "../drizzle/orchestra.schema";
import {
  kernelOk,
  kernelFail,
  KERNEL_ERROR_CODES,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";

// Encryption constants
const ALGORITHM = "aes-256-gcm" as const;
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const ENCRYPTION_KEY_CONFIG = "system.backup.encryption_key";

export type EncryptionServiceDeps = AuditServiceDeps;

/**
 * Get or generate encryption key from system config.
 * Key is auto-generated on first use and stored in orchestra_admin_config.
 */
export async function getOrGenerateEncryptionKey(
  deps: EncryptionServiceDeps,
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<Buffer>> {
  const { db } = deps;

  try {
    // Try to get existing key from system config
    const existingKeyResult = await getConfig({ db }, ENCRYPTION_KEY_CONFIG);

    if (existingKeyResult.ok && existingKeyResult.data) {
      const base64Key = existingKeyResult.data.value;
      const keyBuffer = Buffer.from(
        typeof base64Key === "string" ? base64Key : String(base64Key),
        "base64"
      );

      // Validate key length
      if (keyBuffer.length !== KEY_LENGTH) {
        return kernelFail({
          code: KERNEL_ERROR_CODES.INTERNAL,
          message: "Invalid encryption key length in config",
          details: { expected: KEY_LENGTH, actual: keyBuffer.length },
        });
      }

      return kernelOk(keyBuffer);
    }

    // Generate new 256-bit key
    const newKey = randomBytes(KEY_LENGTH);
    const base64Key = newKey.toString("base64");

    // Store in system config
    const setConfigResult = await setConfig(
      { db },
      {
        key: ENCRYPTION_KEY_CONFIG,
        value: base64Key,
        description: "Backup encryption key (AES-256-GCM) - Auto-generated",
      },
      { traceId: opts?.traceId, actorId: opts?.actorId }
    );

    if (!setConfigResult.ok) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to store encryption key in config",
        details: setConfigResult.error,
      });
    }

    // Log audit event
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.CONFIG_CREATED,
      entityType: "system",
      entityId: ENCRYPTION_KEY_CONFIG,
      actorId: opts?.actorId,
      traceId: opts?.traceId,
      details: {
        action: "encryption_key_generated",
        algorithm: ALGORITHM,
        keyLength: KEY_LENGTH * 8, // bits
      },
    });

    return kernelOk(newKey);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to get or generate encryption key",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Encrypt backup data using AES-256-GCM.
 * Format: [IV (16 bytes)][Auth Tag (16 bytes)][Encrypted Data]
 */
export async function encryptBackup(
  data: Buffer,
  key: Buffer
): Promise<KernelEnvelope<Buffer>> {
  try {
    // Validate key length
    if (key.length !== KEY_LENGTH) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.VALIDATION,
        message: "Invalid encryption key length",
        details: { expected: KEY_LENGTH, actual: key.length },
      });
    }

    // Generate random IV
    const iv = randomBytes(IV_LENGTH);

    // Create cipher
    const cipher = createCipheriv(ALGORITHM, key, iv);

    // Encrypt data
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);

    // Get authentication tag
    const authTag = cipher.getAuthTag();

    // Combine: [IV][AuthTag][EncryptedData]
    const result = Buffer.concat([iv, authTag, encrypted]);

    return kernelOk(result);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to encrypt backup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Decrypt backup data using AES-256-GCM.
 * Expects format: [IV (16 bytes)][Auth Tag (16 bytes)][Encrypted Data]
 */
export async function decryptBackup(
  encryptedData: Buffer,
  key: Buffer
): Promise<KernelEnvelope<Buffer>> {
  try {
    // Validate key length
    if (key.length !== KEY_LENGTH) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.VALIDATION,
        message: "Invalid encryption key length",
        details: { expected: KEY_LENGTH, actual: key.length },
      });
    }

    // Validate minimum encrypted data length
    const minLength = IV_LENGTH + AUTH_TAG_LENGTH;
    if (encryptedData.length < minLength) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.VALIDATION,
        message: "Invalid encrypted data length",
        details: { minimum: minLength, actual: encryptedData.length },
      });
    }

    // Extract components
    const iv = encryptedData.subarray(0, IV_LENGTH);
    const authTag = encryptedData.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
    const encrypted = encryptedData.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

    // Create decipher
    const decipher = createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    // Decrypt data
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);

    return kernelOk(decrypted);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to decrypt backup",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Validate encryption key exists and is valid.
 */
export async function validateEncryptionKey(
  deps: EncryptionServiceDeps
): Promise<KernelEnvelope<boolean>> {
  const keyResult = await getOrGenerateEncryptionKey(deps);

  if (!keyResult.ok) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Encryption key validation failed",
      details: keyResult.error,
    });
  }

  return kernelOk(true);
}

/**
 * Get encryption algorithm info.
 */
export function getEncryptionInfo() {
  return {
    algorithm: ALGORITHM,
    keyLength: KEY_LENGTH * 8, // bits
    ivLength: IV_LENGTH,
    authTagLength: AUTH_TAG_LENGTH,
  };
}
