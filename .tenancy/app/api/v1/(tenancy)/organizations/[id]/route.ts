/**
 * @domain tenancy
 * @layer api
 * @responsibility API route handler for /api/v1/organizations/:id
 */

import "@/lib/server/only"
import { parseJson } from "@afenda/shared/server/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { ok, fail } from "@afenda/shared/server/response"
import { HttpError } from "@afenda/shared/server/errors"
import { organizationService } from "@/lib/server/organizations/service"
import { getAuthContext } from "@afenda/auth/server"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import { withRlsDb } from "@/lib/server/db/rls"
import {
  updateOrganizationSchema,
  organizationParamsSchema
} from "@/lib/contracts/organizations"
import { requireOrganizationAdmin } from "@/lib/server/permissions/middleware"

interface Context {
  params: Promise<{ id: string }>
}

export async function GET(req: Request, context: Context) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const params = await context.params
    const { id } = organizationParamsSchema.parse(params)

    return await withRlsDb(auth.userId, async (db) => {
      // Check if user is member of the organization
      const isMember = await organizationService.isMember(auth.userId, id, db)
      if (!isMember) {
        return fail({ code: "ACCESS_DENIED", message: "Access denied" }, 403)
      }

      const organization = await organizationService.getById(id, db)
      return ok(organization)
    })
  })
}

export async function PATCH(req: Request, context: Context) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const params = await context.params
    const { id } = organizationParamsSchema.parse(params)
    const data = await parseJson(req, updateOrganizationSchema)

    // Check admin permissions
    await requireOrganizationAdmin()(req)

    return await withRlsDb(auth.userId, async (db) => {
      const organization = await organizationService.update(id, data, db)
      invalidateTag(`organizations:${auth.userId}`)
      return ok(organization)
    })
  })
}

export async function DELETE(req: Request, context: Context) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const params = await context.params
    const { id } = organizationParamsSchema.parse(params)

    // Check admin permissions
    await requireOrganizationAdmin()(req)

    return await withRlsDb(auth.userId, async (db) => {
      const organization = await organizationService.delete(id, db)
      invalidateTag(`organizations:${auth.userId}`)
      return ok(organization)
    })
  })
}

