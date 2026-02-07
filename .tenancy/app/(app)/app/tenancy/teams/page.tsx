/**
 * @domain tenancy
 * @layer ui
 * @responsibility UI route entrypoint for /app/tenancy/teams
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
import { PlusCircle, Users } from "lucide-react"
import Link from "next/link"
import { routes } from "@afenda/shared/constants"
import { Badge } from "@afenda/shadcn"

interface Team {
  id: string
  name: string
  slug: string
  description: string | null
  organizationId: string
  memberCount?: number
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(routes.api.v1.tenancy.teams.list())
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.teams) {
          setTeams(data.data.teams)
        } else if (data.error) {
          setError(data.error.message || "Failed to load teams")
        }
        setLoading(false)
      })
      .catch(() => {
        setError("Failed to load teams")
        setLoading(false)
      })
  }, [])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and collaborate with members
          </p>
        </div>
        <Button asChild>
          <Link href={routes.ui.tenancy.teams.new()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">Loading teams...</div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-destructive">{error}</div>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">No teams yet</p>
              <Button asChild>
                <Link href={routes.ui.tenancy.teams.new()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Team
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <Card key={team.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>{team.description || "No description"}</CardDescription>
                  </div>
                  <Badge variant="outline">{team.slug}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {team.memberCount !== undefined ? (
                    <div className="text-sm text-muted-foreground">
                      {team.memberCount} members
                    </div>
                  ) : null}
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={routes.ui.tenancy.teams.byId(team.id)}>
                      <Users className="mr-2 h-4 w-4" />
                      View Team
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

