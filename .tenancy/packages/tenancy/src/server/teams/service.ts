/**
 * Team CRUD using shared db/schema.
 */
import { getDb, teams } from "@afenda/shared/db"
import type { Db } from "@afenda/shared/db"

export interface CreateTeamInput {
  organizationId: string
  name: string
  slug: string
  description?: string
}

export class TeamService {
  async create(
    input: CreateTeamInput,
    _createdBy: string,
    db?: Db
  ): Promise<{ id: string; name: string; slug: string }> {
    const dbx = db ?? getDb()
    const [row] = await dbx
      .insert(teams)
      .values({
        organizationId: input.organizationId,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
      })
      .returning({ id: teams.id, name: teams.name, slug: teams.slug })
    if (!row) throw new Error("Failed to create team")
    return row
  }
}
