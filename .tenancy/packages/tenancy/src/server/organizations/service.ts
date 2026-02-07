/**
 * Organization CRUD using shared db/schema.
 */
import { getDb } from "@afenda/shared/db"
import { organizations } from "@afenda/shared/db"
import type { Db } from "@afenda/shared/db"

export interface CreateOrganizationInput {
  name: string
  slug: string
  description?: string
}

export class OrganizationService {
  async create(
    input: CreateOrganizationInput,
    createdBy: string,
    db?: Db
  ): Promise<{ id: string; name: string; slug: string }> {
    const dbx = db ?? getDb()
    const [row] = await dbx
      .insert(organizations)
      .values({
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        createdBy,
      })
      .returning({ id: organizations.id, name: organizations.name, slug: organizations.slug })
    if (!row) throw new Error("Failed to create organization")
    return row
  }
}
