/**
 * @domain tenancy
 * @layer ui
 * @responsibility UI route entrypoint for /app/tenancy/memberships
 */

import Link from "next/link"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { routes } from "@afenda/shared/constants"

export default function TenancyMembershipsPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Memberships</h1>
        <p className="text-muted-foreground">
          Manage memberships across organizations and teams.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coming soon</CardTitle>
          <CardDescription>
            Membership management UI will live here (domain: tenancy).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.list()}>
              Back to organizations
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.list()}>
              Back to teams
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

