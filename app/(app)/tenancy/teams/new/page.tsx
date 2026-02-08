/**
 * @domain tenancy
 * @layer ui
 * @responsibility Create team (standalone or org-scoped) with form polish and mobile Drawer
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
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@afenda/shadcn";
import { Alert, AlertDescription } from "@afenda/shadcn";
import { useIsMobile } from "@afenda/shadcn";
import type { TenancyOrganizationResponse } from "@afenda/tenancy";
import { routes } from "@afenda/shared/constants";
import Link from "next/link";

type Org = Pick<TenancyOrganizationResponse, "id" | "name" | "slug">;
type TeamType = "standalone" | "org-scoped";

function CreateTeamForm({
  orgs,
  onSuccess,
  onCancel,
}: {
  orgs: Org[];
  onSuccess: () => void;
  onCancel?: () => void;
}) {
  const [teamType, setTeamType] = useState<TeamType>("standalone");
  const [organizationId, setOrganizationId] = useState("");
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (orgs.length > 0 && !organizationId) {
      setOrganizationId(orgs[0].id);
    }
  }, [orgs, organizationId]);

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
        ...(teamType === "org-scoped" && organizationId
          ? { organizationId }
          : {}),
        name,
        slug:
          slug ||
          derivedSlug ||
          name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
        description: description || undefined,
      };
      const res = await fetch(routes.api.tenancy.teams.bff.list(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (data.ok && data.data?.id) {
        onSuccess();
      } else {
        setError(data.error?.message || "Failed to create team");
      }
    } catch {
      setError("Failed to create team");
    } finally {
      setLoading(false);
    }
  };

  const formContent = (
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
        <p className="mt-1 text-xs text-muted-foreground">
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
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Team"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );

  return formContent;
}

export default function NewTeamPage() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    fetch(routes.api.tenancy.organizations.bff.list())
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data?.items) {
          setOrgs(data.data.items);
        }
      })
      .catch(() => {});
  }, []);

  const handleSuccess = () => {
    setDrawerOpen(false);
    router.push(routes.ui.tenancy.teams.list());
  };

  if (isMobile) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Team
          </h1>
          <p className="text-muted-foreground mt-1">
            Create a standalone team or add a team to an organization
          </p>
        </div>
        <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
          <DrawerTrigger asChild>
            <Button className="w-full">Create Team</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>Create Team</DrawerTitle>
              <DrawerDescription>
                Enter the team name and slug
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <CreateTeamForm
                orgs={orgs}
                onSuccess={handleSuccess}
                onCancel={() => setDrawerOpen(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
        <Button variant="outline" asChild className="w-full">
          <Link href={routes.ui.tenancy.teams.list()}>Back to teams</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Create Team
        </h1>
        <p className="text-muted-foreground mt-1">
          Create a standalone team or add a team to an organization
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Team details</CardTitle>
          <CardDescription>Enter the team name and slug</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateTeamForm
            orgs={orgs}
            onSuccess={() => router.push(routes.ui.tenancy.teams.list())}
          />
          <div className="mt-4">
            <Button variant="outline" asChild>
              <Link href={routes.ui.tenancy.teams.list()}>Cancel</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
