/**
 * @domain tenancy
 * @layer ui
 * @responsibility Create team (standalone or org-scoped)
 */

"use client";

import { useEffect, useState } from "react";
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
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import Link from "next/link";

interface Org {
  id: string;
  name: string;
  slug: string;
}

type TeamType = "standalone" | "org-scoped";

export default function NewTeamPage() {
  const router = useRouter();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [teamType, setTeamType] = useState<TeamType>("standalone");
  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(routes.api.tenancy.organizations.bff.list())
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data?.items) {
          setOrgs(data.data.items);
          if (data.data.items.length > 0) {
            setOrganizationId((prev) => prev || data.data.items[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  const derivedSlug =
    slug ||
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (teamType === "org-scoped" && !organizationId) {
      setError("Select an organization");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        ...(teamType === "org-scoped" && organizationId ? { organizationId } : {}),
        name,
        slug: slug || derivedSlug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        description: description || undefined,
      };
      const res = await fetch(routes.api.tenancy.teams.bff.list(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok && data.data?.id) {
        router.push(routes.ui.tenancy.teams.list());
      } else {
        setError(data.error?.message || "Failed to create team");
      }
    } catch {
      setError("Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Team</h1>
        <p className="text-muted-foreground">
          Create a standalone team or add a team to an organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team details</CardTitle>
          <CardDescription>Enter the team name and slug</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="teamType">Team type</Label>
              <ClientSelect
                value={teamType}
                onValueChange={(v) => {
                  setTeamType(v as TeamType);
                  if (v === "standalone") setOrganizationId("");
                }}
              >
                <ClientSelectTrigger id="teamType">
                  <ClientSelectValue placeholder="Select type" />
                </ClientSelectTrigger>
                <ClientSelectContent>
                  <ClientSelectItem value="standalone">
                    Create standalone team (no organization)
                  </ClientSelectItem>
                  <ClientSelectItem value="org-scoped">
                    Create team in organization
                  </ClientSelectItem>
                </ClientSelectContent>
              </ClientSelect>
            </div>
            {teamType === "org-scoped" && (
              <div>
                <Label htmlFor="org">Organization</Label>
                <ClientSelect
                  value={organizationId}
                  onValueChange={setOrganizationId}
                >
                  <ClientSelectTrigger id="org">
                    <ClientSelectValue placeholder="Select organization" />
                  </ClientSelectTrigger>
                  <ClientSelectContent>
                    {orgs.map((org) => (
                      <ClientSelectItem key={org.id} value={org.id}>
                        {org.name}
                      </ClientSelectItem>
                    ))}
                  </ClientSelectContent>
                </ClientSelect>
              </div>
            )}
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Engineering"
                required
              />
            </div>
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="engineering"
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
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
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Creating..." : "Create Team"}
              </Button>
              <Button variant="outline" asChild>
                <Link href={routes.ui.tenancy.teams.list()}>Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
