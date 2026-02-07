/**
 * @domain tenancy
 * @layer ui
 * @responsibility UI route entrypoint for /app/tenancy/organizations
 */

"use client"

import { useEffect, useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { PlusCircle, Users, Settings } from "lucide-react"
import Link from "next/link"
import { routes } from "@afenda/shared/constants"

interface Organization {
  id: string
  name: string
  slug: string
  description: string | null
  memberCount?: number
  teamCount?: number
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(routes.api.v1.tenancy.organizations.list())
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.organizations) {
          setOrganizations(data.data.organizations)
        } else if (data.error) {
          setError(data.error.message || "Failed to load organizations")
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load organizations")
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and collaborate with teams
          </p>
        </div>
        <Button asChild>
          <Link href={routes.ui.tenancy.organizations.new()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Organization
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              Loading organizations...
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-destructive">{error}</div>
          </CardContent>
        </Card>
      ) : organizations.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">No organizations yet</p>
              <Button asChild>
                <Link href={routes.ui.tenancy.organizations.new()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Organization
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
                <CardDescription>{org.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {org.memberCount !== undefined || org.teamCount !== undefined ? (
                    <div className="flex gap-4 text-sm text-muted-foreground">
                      {org.memberCount !== undefined ? (
                        <span>{org.memberCount} members</span>
                      ) : null}
                      {org.teamCount !== undefined ? (
                        <span>{org.teamCount} teams</span>
                      ) : null}
                    </div>
                  ) : null}
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={routes.ui.tenancy.organizations.byId(org.id)}>
                        <Users className="mr-2 h-4 w-4" />
                        View
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={routes.ui.tenancy.organizations.settings(org.id)}>
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

