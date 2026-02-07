/**
 * @domain tenancy
 * @layer api
 * @responsibility API route handler for /api/v1/organizations
 */

import "@/lib/server/only"
import { parseJson, parseSearchParams } from "@afenda/shared/server/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { ok } from "@afenda/shared/server/response"
import { HttpError } from "@afenda/shared/server/errors"
import { organizationService } from "@/lib/server/organizations/service"
import { getAuthContext } from "@afenda/auth/server"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import { withRlsDb } from "@/lib/server/db/rls"
import {
  createOrganizationSchema,
  organizationQuerySchema
} from "@/lib/contracts/organizations"

export async function GET(req: Request) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const query = parseSearchParams(new URL(req.url).searchParams, organizationQuerySchema)

    return await withRlsDb(auth.userId, async (db) => {
      const result = await organizationService.listForUser(auth.userId, query, db)
      return ok(result)
    })
  })
}

export async function POST(req: Request) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const data = await parseJson(req, createOrganizationSchema)

    return await withRlsDb(auth.userId, async (db) => {
      const organization = await organizationService.create(data, auth.userId, db)
      invalidateTag(`organizations:${auth.userId}`)
      return ok(organization, { status: 201 })
    })
  })
}

