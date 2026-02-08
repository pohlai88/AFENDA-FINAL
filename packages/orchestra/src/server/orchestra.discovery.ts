/**
 * Orchestra Kernel Discovery Service
 * Service registry management (register, list, unregister)
 *
 * Zero domain knowledge — just DNS-like service tracking.
 */

import "server-only";

import { eq } from "drizzle-orm";
import type { Database } from "@afenda/shared/server/db";

import {
  orchestraServiceRegistry,
  type ServiceRegistryInsert,
  type ServiceRegistryRow,
} from "../drizzle/orchestra.schema";
import {
  KERNEL_ERROR_CODES,
  kernelOk,
  kernelFail,
  type KernelEnvelope,
} from "../zod/orchestra.envelope.schema";
import {
  SERVICE_STATUS,
  type RegisterServiceInput,
  type UpdateServiceMetadata,
  type ServiceRecord,
  type ServiceListItem,
  type ServiceListResponse,
} from "../zod/orchestra.service.schema";
import { logAudit } from "./orchestra.audit";
import { AUDIT_EVENT_TYPES } from "../drizzle/orchestra.schema";

/** Convert DB row to API record */
function rowToServiceRecord(row: ServiceRegistryRow): ServiceRecord {
  return {
    id: row.id,
    endpoint: row.endpoint,
    healthCheck: row.healthCheck,
    description: row.description,
    version: row.version,
    tags: row.tags,
    status: row.status as ServiceRecord["status"],
    lastHealthCheck: row.lastHealthCheck?.toISOString() ?? null,
    ownerContact: row.ownerContact,
    documentationUrl: row.documentationUrl,
    healthCheckIntervalMs: row.healthCheckIntervalMs,
    healthCheckTimeoutMs: row.healthCheckTimeoutMs,
    registeredAt: row.registeredAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/** Convert DB row to list item */
function rowToListItem(row: ServiceRegistryRow): ServiceListItem {
  return {
    id: row.id,
    endpoint: row.endpoint,
    status: row.status as ServiceListItem["status"],
    lastHealthCheck: row.lastHealthCheck?.toISOString() ?? null,
  };
}

export type DiscoveryServiceDeps = {
  db: Database;
};

/**
 * Register a new service with the kernel.
 */
export async function registerService(
  deps: DiscoveryServiceDeps,
  input: RegisterServiceInput,
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<ServiceRecord>> {
  const { db } = deps;

  try {
    // Check if service already exists
    const existing = await db
      .select()
      .from(orchestraServiceRegistry)
      .where(eq(orchestraServiceRegistry.id, input.id));

    if (existing.length > 0) {
      return kernelFail(
        {
          code: KERNEL_ERROR_CODES.CONFLICT,
          message: `Service '${input.id}' is already registered`,
        },
        { traceId: opts?.traceId }
      );
    }

    const row: ServiceRegistryInsert = {
      id: input.id,
      endpoint: input.endpoint,
      healthCheck: input.healthCheck,
      description: input.description ?? null,
      version: input.version ?? null,
      tags: input.tags ?? null,
      status: SERVICE_STATUS.REGISTERED,
      ownerContact: input.ownerContact ?? null,
      documentationUrl: input.documentationUrl ?? null,
      healthCheckIntervalMs: input.healthCheckIntervalMs ?? 30000,
      healthCheckTimeoutMs: input.healthCheckTimeoutMs ?? 5000,
    };

    const [inserted] = await db
      .insert(orchestraServiceRegistry)
      .values(row)
      .returning();

    // Audit log
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.SERVICE_REGISTERED,
      entityType: "service",
      entityId: input.id,
      actorId: opts?.actorId,
      details: { endpoint: input.endpoint, healthCheck: input.healthCheck },
      traceId: opts?.traceId,
    });

    return kernelOk(rowToServiceRecord(inserted), {
      message: `Service '${input.id}' registered successfully`,
      traceId: opts?.traceId,
    });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to register service",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * List all registered services.
 */
export async function listServices(
  deps: DiscoveryServiceDeps,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<ServiceListResponse>> {
  const { db } = deps;

  try {
    const rows = await db.select().from(orchestraServiceRegistry);

    const services = rows.map(rowToListItem);

    return kernelOk(
      { services, total: services.length },
      { traceId: opts?.traceId }
    );
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to list services",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Get a single service by ID.
 */
export async function getService(
  deps: DiscoveryServiceDeps,
  serviceId: string,
  opts?: { traceId?: string }
): Promise<KernelEnvelope<ServiceRecord>> {
  const { db } = deps;

  try {
    const [row] = await db
      .select()
      .from(orchestraServiceRegistry)
      .where(eq(orchestraServiceRegistry.id, serviceId));

    if (!row) {
      return kernelFail(
        {
          code: KERNEL_ERROR_CODES.NOT_FOUND,
          message: `Service '${serviceId}' not found`,
        },
        { traceId: opts?.traceId }
      );
    }

    return kernelOk(rowToServiceRecord(row), { traceId: opts?.traceId });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to get service",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Unregister a service from the kernel.
 */
export async function unregisterService(
  deps: DiscoveryServiceDeps,
  serviceId: string,
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<{ id: string }>> {
  const { db } = deps;

  try {
    // Get existing service for audit log
    const [existing] = await db
      .select()
      .from(orchestraServiceRegistry)
      .where(eq(orchestraServiceRegistry.id, serviceId));

    if (!existing) {
      return kernelFail(
        {
          code: KERNEL_ERROR_CODES.NOT_FOUND,
          message: `Service '${serviceId}' not found`,
        },
        { traceId: opts?.traceId }
      );
    }

    await db
      .delete(orchestraServiceRegistry)
      .where(eq(orchestraServiceRegistry.id, serviceId));

    // Audit log
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.SERVICE_UNREGISTERED,
      entityType: "service",
      entityId: serviceId,
      actorId: opts?.actorId,
      previousValues: { endpoint: existing.endpoint },
      traceId: opts?.traceId,
    });

    return kernelOk(
      { id: serviceId },
      {
        message: `Service '${serviceId}' unregistered successfully`,
        traceId: opts?.traceId,
      }
    );
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to unregister service",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Update service status (used by health check).
 */
export async function updateServiceStatus(
  deps: DiscoveryServiceDeps,
  serviceId: string,
  status: string,
  healthResult?: { latencyMs?: number; error?: string },
  opts?: { traceId?: string }
): Promise<KernelEnvelope<ServiceRecord>> {
  const { db } = deps;

  try {
    const [updated] = await db
      .update(orchestraServiceRegistry)
      .set({
        status,
        lastHealthCheck: new Date(),
        lastHealthLatencyMs: healthResult?.latencyMs ?? null,
        lastHealthError: healthResult?.error ?? null,
        updatedAt: new Date(),
      })
      .where(eq(orchestraServiceRegistry.id, serviceId))
      .returning();

    if (!updated) {
      return kernelFail(
        {
          code: KERNEL_ERROR_CODES.NOT_FOUND,
          message: `Service '${serviceId}' not found`,
        },
        { traceId: opts?.traceId }
      );
    }

    return kernelOk(rowToServiceRecord(updated), { traceId: opts?.traceId });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to update service status",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}

/**
 * Update service metadata.
 */
export async function updateServiceMetadata(
  deps: DiscoveryServiceDeps,
  serviceId: string,
  metadata: UpdateServiceMetadata,
  opts?: { traceId?: string; actorId?: string }
): Promise<KernelEnvelope<ServiceRecord>> {
  const { db } = deps;

  try {
    // Get existing service for audit log
    const [existing] = await db
      .select()
      .from(orchestraServiceRegistry)
      .where(eq(orchestraServiceRegistry.id, serviceId));

    if (!existing) {
      return kernelFail(
        {
          code: KERNEL_ERROR_CODES.NOT_FOUND,
          message: `Service '${serviceId}' not found`,
        },
        { traceId: opts?.traceId }
      );
    }

    const [updated] = await db
      .update(orchestraServiceRegistry)
      .set({
        ...metadata,
        updatedAt: new Date(),
      })
      .where(eq(orchestraServiceRegistry.id, serviceId))
      .returning();

    // Audit log
    await logAudit(deps, {
      eventType: AUDIT_EVENT_TYPES.SERVICE_UPDATED,
      entityType: "service",
      entityId: serviceId,
      actorId: opts?.actorId,
      details: metadata,
      previousValues: {
        description: existing.description,
        version: existing.version,
        tags: existing.tags,
        ownerContact: existing.ownerContact,
        documentationUrl: existing.documentationUrl,
        healthCheckIntervalMs: existing.healthCheckIntervalMs,
        healthCheckTimeoutMs: existing.healthCheckTimeoutMs,
      },
      traceId: opts?.traceId,
    });

    return kernelOk(rowToServiceRecord(updated!), {
      message: `Service '${serviceId}' metadata updated successfully`,
      traceId: opts?.traceId,
    });
  } catch (error) {
    return kernelFail(
      {
        code: KERNEL_ERROR_CODES.INTERNAL,
        message: "Failed to update service metadata",
        details: error instanceof Error ? error.message : String(error),
      },
      { traceId: opts?.traceId }
    );
  }
}
