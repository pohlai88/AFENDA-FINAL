/**
 * @domain tenancy
 * @layer ui
 * @responsibility UI route entrypoint for /app/tenancy/organizations/:id
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

export default async function OrganizationDetailPage({ params }: Props) {
  const { id } = await params

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Organization</h1>
        <p className="text-muted-foreground">ID: {id}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization workspace</CardTitle>
          <CardDescription>
            This is the canonical org detail page in the tenancy domain.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.list()}>Back to organizations</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.settings(id)}>Settings</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.members(id)}>Members</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.teams(id)}>Teams</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

