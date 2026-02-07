/**
 * @domain tenancy
 * @layer ui
 * @responsibility UI route entrypoint for /app/tenancy/organizations/:id/teams
 */

import Link from "next/link"

import { Button } from "@afenda/shadcn"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { routes } from "@afenda/shared/constants"

export const revalidate = 3600

type Props = {
  params: Promise<{ id: string }>
}

// NOTE: Auth-based static params removed; headers aren't available at build time.

export default async function OrganizationTeamsPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Organization Teams</h1>
        <p className="text-muted-foreground">Organization ID: {id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>Organization-scoped team management is tenancy-owned and will live here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.byId(id)}>Back to org</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.list()}>All teams</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

