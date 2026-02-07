/**
 * @domain tenancy
 * @layer ui
 * @responsibility UI route entrypoint for /app/tenancy/teams/new
 */

"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn"
import { Button } from "@afenda/shadcn"
import { Input } from "@afenda/shadcn"
import { Label } from "@afenda/shadcn"
import { Textarea } from "@afenda/shadcn"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@afenda/shadcn"
import { routes } from "@afenda/shared/constants"
import { TEAM } from "@afenda/shared/constants"

interface Organization {
  id: string
  name: string
}

export default function NewTeamPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingOrgs, setLoadingOrgs] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [formData, setFormData] = useState({
    organizationId: "",
    name: "",
    slug: "",
    description: "",
  })

  useEffect(() => {
    fetch(routes.api.v1.tenancy.organizations.list())
      .then((res) => res.json())
      .then((data) => {
        if (data.data?.organizations) {
          setOrganizations(data.data.organizations)
        }
        setLoadingOrgs(false)
      })
      .catch(() => {
        setError("Failed to load organizations")
        setLoadingOrgs(false)
      })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(routes.api.v1.tenancy.teams.list(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok && data.data) {
        router.push(routes.ui.tenancy.teams.list())
      } else {
        setError(data.error?.message || "Failed to create team")
      }
    } catch {
      setError("Failed to create team")
    } finally {
      setLoading(false)
    }
  }

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    setFormData({ ...formData, slug })
  }

  if (loadingOrgs) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (organizations.length === 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">
                You need to create an organization first
              </p>
              <Button asChild>
                <Link href={routes.ui.tenancy.organizations.new()}>Create Organization</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Team</h1>
        <p className="text-muted-foreground">
          Set up a new team within your organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team Details</CardTitle>
          <CardDescription>Enter the basic information for your team</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationId">
                Organization <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.organizationId}
                onValueChange={(value) =>
                  setFormData({ ...formData, organizationId: value })
                }
                required
              >
                <SelectTrigger id="organizationId">
                  <SelectValue placeholder="Select an organization" />
                </SelectTrigger>
                <SelectContent>
                  {organizations.map((org) => (
                    <SelectItem key={org.id} value={org.id}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">
                Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value })
                  if (!formData.slug) {
                    handleSlugChange(e.target.value)
                  }
                }}
                maxLength={TEAM.MAX_NAME_LENGTH}
                required
                placeholder="Engineering Team"
              />
              <p className="text-sm text-muted-foreground">
                Maximum {TEAM.MAX_NAME_LENGTH} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug <span className="text-destructive">*</span>
              </Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                pattern="[a-z0-9-]+"
                maxLength={TEAM.MAX_SLUG_LENGTH}
                required
                placeholder="engineering-team"
              />
              <p className="text-sm text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. Maximum {TEAM.MAX_SLUG_LENGTH} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                maxLength={TEAM.MAX_DESCRIPTION_LENGTH}
                placeholder="A brief description of your team"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Maximum {TEAM.MAX_DESCRIPTION_LENGTH} characters
              </p>
            </div>

            {error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading || !formData.organizationId}>
                {loading ? "Creating..." : "Create Team"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

