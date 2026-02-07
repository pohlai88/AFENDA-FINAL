/**
 * @domain tenancy
 * @layer ui
 * @responsibility Teams list (all / standalone / by organization)
 */

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn";
import { PlusCircle, Users } from "lucide-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { Badge } from "@afenda/shadcn";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organizationId: string | null;
  orgName?: string | null;
}

interface Org {
  id: string;
  name: string;
  slug: string;
}

type Filter = "all" | "standalone" | "org";

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(() => {
    setLoading(true);
    setError(null);
    const base = routes.api.tenancy.teams.bff.list();
    const params = new URLSearchParams();
    if (filter === "standalone") {
      params.set("organizationId", "");
    } else if (filter === "org" && selectedOrgId) {
      params.set("organizationId", selectedOrgId);
    }
    const url = params.toString() ? `${base}?${params.toString()}` : base;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data?.items) {
          setTeams(data.data.items);
        } else if (data.error) {
          setError(data.error?.message || "Failed to load teams");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load teams");
        setLoading(false);
      });
  }, [filter, selectedOrgId]);

  useEffect(() => {
    fetch(routes.api.tenancy.organizations.bff.list())
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data?.items) {
          setOrgs(data.data.items);
          if (data.data.items.length > 0 && filter === "org" && !selectedOrgId) {
            setSelectedOrgId(data.data.items[0].id);
          }
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

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
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm text-muted-foreground">Filter:</span>
        <ClientSelect
          value={filter}
          onValueChange={(v) => setFilter(v as Filter)}
        >
          <ClientSelectTrigger className="w-[180px]">
            <ClientSelectValue placeholder="Filter teams" />
          </ClientSelectTrigger>
          <ClientSelectContent>
            <ClientSelectItem value="all">All teams</ClientSelectItem>
            <ClientSelectItem value="standalone">Standalone</ClientSelectItem>
            <ClientSelectItem value="org">By organization</ClientSelectItem>
          </ClientSelectContent>
        </ClientSelect>
        {filter === "org" && (
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
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle>{team.name}</CardTitle>
                    <CardDescription>{team.description || "No description"}</CardDescription>
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
                  <Badge variant="outline" className="shrink-0">{team.slug}</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <Button variant="outline" size="sm" asChild className="w-full">
                  <Link href={routes.ui.tenancy.teams.byId(team.id)}>
                    <Users className="mr-2 h-4 w-4" />
                    View Team
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
