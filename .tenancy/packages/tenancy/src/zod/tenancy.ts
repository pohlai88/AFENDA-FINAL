/**
 * @deprecated Use @afenda/tenancy/zod instead
 * This file is a shim for backward compatibility during migration.
 */
export {
  // Context schemas
  tenancyContextSchema,
  type TenancyContext,
  // Sharing schemas
  tenancyShareResourceSchema,
  tenancyUpdateShareSchema,
  tenancyShareParamsSchema,
  tenancyShareQuerySchema,
  // Permission schema
  tenancyCheckPermissionSchema,
  // Types
  type TenancyShareResource,
  type TenancyUpdateShare,
  type TenancyShareParams,
  type TenancyShareQuery,
  type TenancyCheckPermission,
} from "@afenda/tenancy/zod"

// Legacy alias for backward compatibility
export { tenancyContextSchema as tenancySchema } from "@afenda/tenancy/zod"

/**
 * Tenancy enforcement helpers
 * @deprecated Move to @afenda/tenancy/server
 */
import { type TenancyContext } from "@afenda/tenancy/zod"

export function getTenancyFromRequest(headers: Record<string, string | string[] | undefined>): TenancyContext {
  const userId = headers["x-user-id"]
  if (!userId || typeof userId !== "string") {
    throw new Error("Missing x-user-id header")
  }
  return {
    userId,
    orgId: typeof headers["x-org-id"] === "string" ? headers["x-org-id"] : undefined,
    teamId: typeof headers["x-team-id"] === "string" ? headers["x-team-id"] : undefined,
  }
}
