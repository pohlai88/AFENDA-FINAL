/**
 * @domain tenancy
 * @layer ui
 * @responsibility Create organization
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import { Input } from "@afenda/shadcn";
import { Label } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import Link from "next/link";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derivedSlug =
    slug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalSlug =
      slug ||
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(routes.api.tenancy.organizations.bff.list(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug: finalSlug,
          description: description || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok && data.data?.id) {
        router.push(routes.ui.tenancy.organizations.list());
      } else {
        setError(data.error?.message || "Failed to create organization");
      }
    } catch {
      setError("Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Organization</h1>
        <p className="text-muted-foreground">Add a new organization</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Organization details</CardTitle>
          <CardDescription>Enter the organization name and slug</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Acme Inc"
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="acme-inc"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                title="Lowercase letters, numbers, hyphens only"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Will use: {derivedSlug || "(auto from name)"}
              </p>
            </div>
            <div>
              <Label htmlFor="description">Description (optional)</Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description"
              />
            </div>
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Organization"}
              </Button>
              <Button variant="outline" asChild>
                <Link href={routes.ui.tenancy.organizations.list()}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
