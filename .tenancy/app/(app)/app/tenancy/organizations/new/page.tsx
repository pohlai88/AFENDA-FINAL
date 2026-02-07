/**
 * @domain tenancy
 * @layer ui
 * @responsibility UI route entrypoint for /app/tenancy/organizations/new
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
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
import { routes } from "@afenda/shared/constants"
import { ORGANIZATION } from "@afenda/shared/constants"

export default function NewOrganizationPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(routes.api.v1.tenancy.organizations.list(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })

      const data = await res.json()

      if (res.ok && data.data) {
        router.push(routes.ui.tenancy.organizations.list())
      } else {
        setError(data.error?.message || "Failed to create organization")
      }
    } catch {
      setError("Failed to create organization")
    } finally {
      setLoading(false)
    }
  }

  const handleSlugChange = (value: string) => {
    const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
    setFormData({ ...formData, slug })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Organization</h1>
        <p className="text-muted-foreground">
          Set up a new organization to collaborate with your team
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Enter the basic information for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
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
                maxLength={ORGANIZATION.MAX_NAME_LENGTH}
                required
                placeholder="Acme Corporation"
              />
              <p className="text-sm text-muted-foreground">
                Maximum {ORGANIZATION.MAX_NAME_LENGTH} characters
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
                maxLength={ORGANIZATION.MAX_SLUG_LENGTH}
                required
                placeholder="acme-corporation"
              />
              <p className="text-sm text-muted-foreground">
                Lowercase letters, numbers, and hyphens only. Maximum {ORGANIZATION.MAX_SLUG_LENGTH} characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                maxLength={ORGANIZATION.MAX_DESCRIPTION_LENGTH}
                placeholder="A brief description of your organization"
                rows={4}
              />
              <p className="text-sm text-muted-foreground">
                Maximum {ORGANIZATION.MAX_DESCRIPTION_LENGTH} characters
              </p>
            </div>

            {error ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Organization"}
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

