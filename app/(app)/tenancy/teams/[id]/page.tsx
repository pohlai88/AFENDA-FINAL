/**
 * @domain tenancy
 * @layer ui
 * @responsibility Team detail - Overview tab content
 */

"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import { Skeleton } from "@afenda/shadcn";
import { IconBuilding, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { useTeamQuery } from "@afenda/tenancy";

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const { data: team, isLoading, error } = useTeamQuery(id ?? "", {
    enabled: !!id,
  });

  if (!id) return <div>Loading...</div>;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !team) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-destructive">{error?.message || "Team not found"}</p>
          <Button variant="outline" asChild className="mt-4">
            <Link href={routes.ui.tenancy.teams.list()}>Back to teams</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Overview</CardTitle>
        <CardDescription>{team.description || "No description"}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm">
          <IconBuilding className="h-4 w-4 text-muted-foreground" />
          <span className="text-muted-foreground">Organization:</span>
          {team.organizationId ? (
            <Link
              href={routes.ui.tenancy.organizations.byId(team.organizationId)}
              className="font-medium hover:underline"
            >
              {team.orgName ?? "Organization"}
            </Link>
          ) : (
            <span>Standalone (no organization)</span>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.ui.tenancy.teams.members(id)}>
              <IconUsers className="mr-2 h-4 w-4" />
              View Members
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.ui.tenancy.teams.list()}>Back to teams</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
