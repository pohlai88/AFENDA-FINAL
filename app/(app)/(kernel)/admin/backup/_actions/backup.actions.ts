/**
 * Backup Server Actions
 * Next.js Server Actions for backup operations with progressive enhancement.
 *
 * @domain kernel
 * @layer server-action
 */

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createEnhancedBackup,
  deleteBackup as deleteBackupService,
  restoreFromBackup,
  type CreateBackupOptions,
} from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";

/**
 * Trigger backup action
 * Progressive enhancement: works without JavaScript
 */
export async function triggerBackupAction(
  _prevState: unknown,
  formData?: FormData
) {
  try {
    const includeDb = formData?.get("includeDatabase");
    const includeR2 = formData?.get("includeR2Bucket");
    const options: CreateBackupOptions = {
      includeDatabase: includeDb === "true" || includeDb === "on" || !formData?.has("includeDatabase"),
      includeR2Bucket: includeR2 === "true" || includeR2 === "on",
      backupType: (formData?.get("backupType") as string) || "full",
    };

    const result = await createEnhancedBackup({ db }, options);

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: result.error.code,
          message: result.error.message,
        },
      };
    }

    // Revalidate backup page to show new backup
    revalidatePath("/admin/backup");

    return {
      ok: true,
      data: {
        backupId: result.data.id,
        message: "Backup created successfully",
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to create backup",
      },
    };
  }
}

/**
 * Restore from backup action
 * Progressive enhancement: works without JavaScript
 */
export async function restoreFromBackupAction(
  _prevState: unknown,
  formData: FormData
) {
  try {
    const backupId = formData.get("backupId") as string;

    if (!backupId) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Backup ID is required",
        },
      };
    }

    const result = await restoreFromBackup({ db }, backupId);

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: result.error.code,
          message: result.error.message,
        },
      };
    }

    // Revalidate and redirect
    revalidatePath("/admin/backup");
    redirect("/admin/backup");
  } catch (error) {
    // Handle redirect error (expected behavior)
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }

    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to restore backup",
      },
    };
  }
}

/**
 * Delete backup action
 * Progressive enhancement: works without JavaScript
 */
export async function deleteBackupAction(backupId: string) {
  try {
    if (!backupId) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Backup ID is required",
        },
      };
    }

    const result = await deleteBackupService({ db }, backupId);

    if (!result.ok) {
      return {
        ok: false,
        error: {
          code: result.error.code,
          message: result.error.message,
        },
      };
    }

    // Revalidate backup page
    revalidatePath("/admin/backup");

    return {
      ok: true,
      data: {
        message: "Backup deleted successfully",
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete backup",
      },
    };
  }
}

/**
 * Bulk delete backups action
 */
export async function bulkDeleteBackupsAction(backupIds: string[]) {
  try {
    if (!backupIds || backupIds.length === 0) {
      return {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "At least one backup ID is required",
        },
      };
    }

    const results = await Promise.allSettled(
      backupIds.map((id) => deleteBackupService({ db }, id))
    );

    const successful = results.filter((r) => r.status === "fulfilled" && r.value.ok).length;
    const failed = results.length - successful;

    // Revalidate backup page
    revalidatePath("/admin/backup");

    return {
      ok: true,
      data: {
        successful,
        failed,
        message: `Deleted ${successful} backup(s)${failed > 0 ? `, ${failed} failed` : ""}`,
      },
    };
  } catch (error) {
    return {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: error instanceof Error ? error.message : "Failed to delete backups",
      },
    };
  }
}
