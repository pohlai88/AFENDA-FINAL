/**
 * @domain tenancy
 * @layer ui
 * @responsibility UI route entrypoint for /app/tenancy/teams/:id/settings
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

export default async function TeamSettingsPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Team Settings</h1>
        <p className="text-muted-foreground">Team ID: {id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>Settings UI is tenancy-owned and will live here.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.byId(id)}>Back to team</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.list()}>Teams list</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

