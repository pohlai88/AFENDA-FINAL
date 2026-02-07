/**
 * @domain tenancy
 * @layer api
 * @responsibility API route handler for /api/v1/teams/:id
 */

import "@/lib/server/only"
import { parseJson } from "@afenda/shared/server/validate"
import { invalidateTag } from "@/lib/server/cache/revalidate"
import { ok, fail } from "@afenda/shared/server/response"
import { HttpError } from "@afenda/shared/server/errors"
import { teamService } from "@/lib/server/teams/service"
import { getAuthContext } from "@afenda/auth/server"
import { withApiErrorBoundary } from "@/lib/server/api/handler"
import { withRlsDb } from "@/lib/server/db/rls"
import {
  updateTeamSchema,
  teamParamsSchema
} from "@/lib/contracts/organizations"
import { requireTeamManager } from "@/lib/server/permissions/middleware"

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
    const { id } = teamParamsSchema.parse(params)

    return await withRlsDb(auth.userId, async (db) => {
      // Check if user is member of the team
      const isMember = await teamService.isMember(auth.userId, id, db)
      if (!isMember) {
        return fail({ code: "ACCESS_DENIED", message: "Access denied" }, 403)
      }

      const team = await teamService.getById(id, db)
      return ok(team)
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
    const { id } = teamParamsSchema.parse(params)
    const data = await parseJson(req, updateTeamSchema)

    // Check manager permissions
    await requireTeamManager()(req)

    return await withRlsDb(auth.userId, async (db) => {
      const team = await teamService.update(id, data, db)
      invalidateTag(`teams:${auth.userId}`)
      return ok(team)
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
    const { id } = teamParamsSchema.parse(params)

    // Check manager permissions
    await requireTeamManager()(req)

    return await withRlsDb(auth.userId, async (db) => {
      const team = await teamService.delete(id, db)
      invalidateTag(`teams:${auth.userId}`)
      return ok(team)
    })
  })
}

