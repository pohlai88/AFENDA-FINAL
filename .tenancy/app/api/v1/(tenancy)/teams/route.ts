/**
 * @domain tenancy
 * @layer api
 * @responsibility API route handler for /api/v1/teams
 */

import "@/lib/server/only"
import { parseJson, parseSearchParams } from "@afenda/shared/server/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { ok } from "@afenda/shared/server/response"
import { HttpError } from "@afenda/shared/server/errors"
import { teamService } from "@/lib/server/teams/service"
import { getAuthContext } from "@afenda/auth/server"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import { withRlsDb } from "@/lib/server/db/rls"
import {
  createTeamSchema,
  teamQuerySchema
} from "@/lib/contracts/organizations"

export async function GET(req: Request) {
  return withApiErrorBoundary(req, async () => {
    const auth = await getAuthContext()
    if (!auth.userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required")
    }

    const query = parseSearchParams(new URL(req.url).searchParams, teamQuerySchema)

    // Check if querying by organization
    const organizationId = new URL(req.url).searchParams.get("organizationId")

    return await withRlsDb(auth.userId, async (db) => {
      const result = organizationId
        ? await teamService.listForOrganization(organizationId, auth.userId, query, db)
        : await teamService.listForUser(auth.userId, query, db)
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

    const data = await parseJson(req, createTeamSchema)

    return await withRlsDb(auth.userId, async (db) => {
      const team = await teamService.create(data, auth.userId, db)
      invalidateTag(`teams:${auth.userId}`)
      return ok(team, { status: 201 })
    })
  })
}

