/**
 * @domain tenancy
 * @layer ui
 * @responsibility Teams list with Tabs/ToggleGroup filters, skeleton, search
 */

"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import { Input } from "@afenda/shadcn";
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn";
import { ToggleGroup, ToggleGroupItem } from "@afenda/shadcn";
import { Skeleton } from "@afenda/shadcn";
import { Alert, AlertDescription } from "@afenda/shadcn";
import { Badge } from "@afenda/shadcn";
import { IconPlus, IconSearch, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import {
  useTeamsQuery,
  useOrganizationsQuery,
  type TenancyOrganizationResponse,
} from "@afenda/tenancy";

type Org = Pick<TenancyOrganizationResponse, "id" | "name" | "slug">;
type Filter = "all" | "standalone" | "org";

function TeamsGridSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-start justify-between gap-2">
              <div className="space-y-2 min-w-0 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-20" />
              </div>
              <Skeleton className="h-5 w-16 shrink-0" />
            </div>
          </CardHeader>
          <CardContent>
            <Skeleton className="h-9 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function TeamsPage() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [search, setSearch] = useState("");

  // Fetch organizations for filter dropdown
  const { data: orgsData } = useOrganizationsQuery();
  const orgs = orgsData?.items ?? [];

  // Auto-select first org when filter is 'org' and no org is selected
  if (filter === "org" && !selectedOrgId && orgs.length > 0) {
    setSelectedOrgId(orgs[0].id);
  }

  // Build query params based on filter
  const queryParams = useMemo(() => {
    if (filter === "standalone") {
      return { organizationId: "" };
    } else if (filter === "org" && selectedOrgId) {
      return { organizationId: selectedOrgId };
    }
    return undefined;
  }, [filter, selectedOrgId]);

  // Fetch teams with dynamic params
  const { data: teamsData, isLoading, error } = useTeamsQuery(queryParams);
  const teams = teamsData?.items ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return teams;
    const q = search.toLowerCase();
    return teams.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.slug.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q) ||
        (t.orgName ?? "").toLowerCase().includes(q)
    );
  }, [teams, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Teams</h1>
          <p className="text-muted-foreground">
            Manage your teams and collaborate with members
          </p>
        </div>
        <Button asChild>
          <Link href={routes.ui.tenancy.teams.new()}>
            <IconPlus className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <TeamsGridSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : teams.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No teams yet</CardTitle>
            <CardDescription>
              Create your first team to start collaborating. You can create a
              standalone team or add a team to an organization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={routes.ui.tenancy.teams.new()}>
                <IconPlus className="mr-2 h-4 w-4" />
                Create Your First Team
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <ToggleGroup
                type="single"
                value={filter}
                onValueChange={(v) => v && setFilter(v as Filter)}
                variant="outline"
                size="sm"
              >
                <ToggleGroupItem value="all" aria-label="All teams">
                  All teams
                </ToggleGroupItem>
                <ToggleGroupItem value="standalone" aria-label="Standalone">
                  Standalone
                </ToggleGroupItem>
                <ToggleGroupItem value="org" aria-label="By organization">
                  By org
                </ToggleGroupItem>
              </ToggleGroup>
              {filter === "org" && orgs.length > 0 && (
                <ClientSelect
                  value={selectedOrgId}
                  onValueChange={(v) => setSelectedOrgId(v)}
                >
                  <ClientSelectTrigger className="w-[200px]">
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
              )}
            </div>
            <div className="relative w-full sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search teams..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {filtered.length === 0 ? (
            <Card>
              <CardContent className="py-10">
                <p className="text-center text-muted-foreground">
                  No teams match your search.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filtered.map((team) => (
                <Card key={team.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <CardTitle>{team.name}</CardTitle>
                        <CardDescription>
                          {team.description || "No description"}
                        </CardDescription>
                        {team.organizationId && team.orgName ? (
                          <Badge variant="secondary" className="mt-1">
                            {team.orgName}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="mt-1">
                            Standalone
                          </Badge>
                        )}
                      </div>
                      <Badge variant="outline" className="shrink-0">
                        {team.slug}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button variant="outline" size="sm" asChild className="w-full">
                      <Link href={routes.ui.tenancy.teams.byId(team.id)}>
                        <IconUsers className="mr-2 h-4 w-4" />
                        View Team
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
