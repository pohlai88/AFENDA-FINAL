/**
 * Orchestra Custom Template Service
 * CRUD operations for user-created configuration templates.
 *
 * Zero domain knowledge — generic template CRUD.
 */

import "server-only";

import type { Database } from "@afenda/shared/server/db";
import { eq, and, desc, sql } from "drizzle-orm";

import {
  orchestraCustomTemplates,
  orchestraTemplateHistory,
  type CustomTemplateRow,
  type CustomTemplateInsert,
  type TemplateHistoryInsert,
  type TemplateHistoryRow,
} from "../drizzle/config-templates.schema";
import type {
  CreateCustomTemplateRequest,
  UpdateCustomTemplateRequest,
  DeleteCustomTemplateRequest,
  ArchiveTemplateRequest,
  PublishTemplateRequest,
  CustomTemplateResponse,
  ConfigTemplate,
  TemplateCategory,
  ConfigField,
  TemplateStatus,
} from "../zod/orchestra.config-template.schema";
import {
  kernelOk,
  kernelFail,
  type KernelEnvelope,
  KERNEL_ERROR_CODES,
} from "../zod/orchestra.envelope.schema";
import { CONFIG_TEMPLATES } from "../constant/orchestra.config-templates";

export type CustomTemplateDeps = {
  db: Database;
};

/**
 * Convert DB row to CustomTemplateResponse
 */
function rowToResponse(row: CustomTemplateRow): CustomTemplateResponse {
  return {
    id: `custom-${row.id}`,
    name: row.name,
    description: row.description,
    category: row.category as TemplateCategory,
    icon: row.icon,
    configs: row.configs as ConfigField[],
    status: row.status as TemplateStatus,
    version: row.version || undefined,
    tags: row.tags || undefined,
    createdBy: row.createdBy || undefined,
    updatedBy: row.updatedBy || undefined,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    publishedAt: row.publishedAt || undefined,
    archivedAt: row.archivedAt || undefined,
    appliedCount: row.appliedCount || undefined,
    lastAppliedAt: row.lastAppliedAt || undefined,
  };
}

/**
 * Create history entry
 */
async function createHistoryEntry(
  { db }: CustomTemplateDeps,
  templateId: string,
  changeType: string,
  snapshot: CustomTemplateRow,
  changedBy?: string,
  changeNotes?: string
): Promise<void> {
  const historyEntry: TemplateHistoryInsert = {
    templateId,
    version: snapshot.version || "1.0.0",
    snapshot,
    changeType,
    changedBy,
    changeNotes,
  };

  await db.insert(orchestraTemplateHistory).values(historyEntry);
}

/**
 * List all custom templates (with optional status filter)
 */
export async function listCustomTemplates(
  { db }: CustomTemplateDeps,
  options?: { status?: "draft" | "published" | "archived"; includeArchived?: boolean }
): Promise<KernelEnvelope<CustomTemplateResponse[]>> {
  try {
    const conditions = [];

    if (options?.status) {
      conditions.push(eq(orchestraCustomTemplates.status, options.status));
    } else if (!options?.includeArchived) {
      // By default, exclude archived templates
      conditions.push(sql`${orchestraCustomTemplates.status} != 'archived'`);
    }

    const rows = await db
      .select()
      .from(orchestraCustomTemplates)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orchestraCustomTemplates.updatedAt));

    const templates = rows.map(rowToResponse);
    return kernelOk(templates);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to list custom templates",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * List all templates (built-in + custom)
 */
export async function listAllTemplates(
  deps: CustomTemplateDeps
): Promise<KernelEnvelope<ConfigTemplate[]>> {
  try {
    const customResult = await listCustomTemplates(deps, { includeArchived: false });
    
    if (!customResult.ok) {
      return customResult as KernelEnvelope<never>;
    }

    // Combine built-in and custom templates (customResult.data is CustomTemplateResponse[])
    const customTemplates = customResult.data.map((r): ConfigTemplate => ({
      id: r.id,
      name: r.name,
      description: r.description,
      category: r.category,
      icon: r.icon,
      configs: r.configs,
    }));
    const allTemplates = [...CONFIG_TEMPLATES, ...customTemplates];

    return kernelOk(allTemplates);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to list all templates",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get a custom template by ID
 */
export async function getCustomTemplate(
  { db }: CustomTemplateDeps,
  id: string
): Promise<KernelEnvelope<CustomTemplateResponse>> {
  try {
    // Remove 'custom-' prefix if present
    const cleanId = id.startsWith("custom-") ? id.substring(7) : id;

    const rows = await db
      .select()
      .from(orchestraCustomTemplates)
      .where(eq(orchestraCustomTemplates.id, cleanId))
      .limit(1);

    if (rows.length === 0) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: `Custom template not found: ${id}`,
      });
    }

    return kernelOk(rowToResponse(rows[0]));
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to get custom template",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Create a new custom template
 */
export async function createCustomTemplate(
  deps: CustomTemplateDeps,
  request: CreateCustomTemplateRequest,
  actorId?: string
): Promise<KernelEnvelope<CustomTemplateResponse>> {
  try {
    const { db } = deps;

    const newTemplate: CustomTemplateInsert = {
      name: request.name,
      description: request.description,
      category: request.category,
      icon: request.icon || "IconSettings",
      configs: request.configs as CustomTemplateInsert["configs"],
      status: request.status || "draft",
      tags: request.tags,
      createdBy: actorId,
      updatedBy: actorId,
    };

    const rows = await db
      .insert(orchestraCustomTemplates)
      .values(newTemplate)
      .returning();

    const created = rows[0];

    // Create history entry
    await createHistoryEntry(deps, created.id, "created", created, actorId);

    return kernelOk(rowToResponse(created));
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to create custom template",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Update a custom template
 */
export async function updateCustomTemplate(
  deps: CustomTemplateDeps,
  request: UpdateCustomTemplateRequest,
  actorId?: string
): Promise<KernelEnvelope<CustomTemplateResponse>> {
  try {
    const { db } = deps;
    const cleanId = request.id.startsWith("custom-") ? request.id.substring(7) : request.id;

    // Get current version for history
    const current = await db
      .select()
      .from(orchestraCustomTemplates)
      .where(eq(orchestraCustomTemplates.id, cleanId))
      .limit(1);

    if (current.length === 0) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: `Custom template not found: ${request.id}`,
      });
    }

    // Build update object
    const updates: Partial<CustomTemplateInsert> = {
      updatedBy: actorId,
      updatedAt: new Date(),
    };

    if (request.name !== undefined) updates.name = request.name;
    if (request.description !== undefined) updates.description = request.description;
    if (request.category !== undefined) updates.category = request.category;
    if (request.icon !== undefined) updates.icon = request.icon;
    if (request.configs !== undefined) updates.configs = request.configs as CustomTemplateInsert["configs"];
    if (request.status !== undefined) updates.status = request.status;
    if (request.tags !== undefined) updates.tags = request.tags;

    const rows = await db
      .update(orchestraCustomTemplates)
      .set(updates)
      .where(eq(orchestraCustomTemplates.id, cleanId))
      .returning();

    const updated = rows[0];

    // Create history entry
    await createHistoryEntry(deps, cleanId, "updated", updated, actorId);

    return kernelOk(rowToResponse(updated));
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to update custom template",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Delete a custom template (archive or permanent)
 */
export async function deleteCustomTemplate(
  deps: CustomTemplateDeps,
  request: DeleteCustomTemplateRequest,
  actorId?: string
): Promise<KernelEnvelope<{ deleted: boolean }>> {
  try {
    const { db } = deps;
    const cleanId = request.id.startsWith("custom-") ? request.id.substring(7) : request.id;

    if (request.permanent) {
      // Hard delete
      await db
        .delete(orchestraCustomTemplates)
        .where(eq(orchestraCustomTemplates.id, cleanId));

      return kernelOk({ deleted: true });
    } else {
      // Soft delete (archive)
      const rows = await db
        .update(orchestraCustomTemplates)
        .set({
          status: "archived",
          archivedAt: new Date(),
          archivedBy: actorId,
          updatedAt: new Date(),
          updatedBy: actorId,
        })
        .where(eq(orchestraCustomTemplates.id, cleanId))
        .returning();

      if (rows.length > 0) {
        await createHistoryEntry(deps, cleanId, "archived", rows[0], actorId);
      }

      return kernelOk({ deleted: true });
    }
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to delete custom template",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Archive or restore a custom template
 */
export async function archiveRestoreTemplate(
  deps: CustomTemplateDeps,
  request: ArchiveTemplateRequest,
  actorId?: string
): Promise<KernelEnvelope<CustomTemplateResponse>> {
  try {
    const { db } = deps;
    const cleanId = request.id.startsWith("custom-") ? request.id.substring(7) : request.id;

    const updates: Partial<CustomTemplateInsert> = {
      updatedBy: actorId,
      updatedAt: new Date(),
    };

    if (request.action === "archive") {
      updates.status = "archived";
      updates.archivedAt = new Date();
      updates.archivedBy = actorId;
    } else {
      updates.status = "draft";
      updates.archivedAt = null;
      updates.archivedBy = undefined;
    }

    const rows = await db
      .update(orchestraCustomTemplates)
      .set(updates)
      .where(eq(orchestraCustomTemplates.id, cleanId))
      .returning();

    if (rows.length === 0) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: `Custom template not found: ${request.id}`,
      });
    }

    const updated = rows[0];
    await createHistoryEntry(deps, cleanId, request.action === "archive" ? "archived" : "restored", updated, actorId);

    return kernelOk(rowToResponse(updated));
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: `Failed to ${request.action} template`,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Publish a custom template
 */
export async function publishTemplate(
  deps: CustomTemplateDeps,
  request: PublishTemplateRequest,
  actorId?: string
): Promise<KernelEnvelope<CustomTemplateResponse>> {
  try {
    const { db } = deps;
    const cleanId = request.id.startsWith("custom-") ? request.id.substring(7) : request.id;

    const rows = await db
      .update(orchestraCustomTemplates)
      .set({
        status: "published",
        publishedAt: new Date(),
        version: request.version || "1.0.0",
        updatedBy: actorId,
        updatedAt: new Date(),
      })
      .where(eq(orchestraCustomTemplates.id, cleanId))
      .returning();

    if (rows.length === 0) {
      return kernelFail({
        code: KERNEL_ERROR_CODES.NOT_FOUND,
        message: `Custom template not found: ${request.id}`,
      });
    }

    const updated = rows[0];
    await createHistoryEntry(deps, cleanId, "published", updated, actorId);

    return kernelOk(rowToResponse(updated));
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to publish template",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Get template history
 */
export async function getTemplateHistory(
  { db }: CustomTemplateDeps,
  templateId: string
): Promise<KernelEnvelope<TemplateHistoryRow[]>> {
  try {
    const cleanId = templateId.startsWith("custom-") ? templateId.substring(7) : templateId;

    const history = await db
      .select()
      .from(orchestraTemplateHistory)
      .where(eq(orchestraTemplateHistory.templateId, cleanId))
      .orderBy(desc(orchestraTemplateHistory.createdAt));

    return kernelOk(history);
  } catch (error) {
    return kernelFail({
      code: KERNEL_ERROR_CODES.INTERNAL,
      message: "Failed to get template history",
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
