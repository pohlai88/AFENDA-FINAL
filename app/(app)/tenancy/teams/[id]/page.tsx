/**
 * @domain tenancy
 * @layer ui
 * @responsibility Team detail
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
import { Settings, Users } from "lucide-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";

interface Team {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  organizationId: string | null;
}

export default function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(routes.api.tenancy.teams.bff.byId(id))
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data) {
          setTeam(data.data);
        } else {
          setError(data.error?.message || "Team not found");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load team");
        setLoading(false);
      });
  }, [id]);

  if (!id || loading) {
    return <div className="space-y-6"><p className="text-muted-foreground">Loading...</p></div>;
  }

  if (error || !team) {
    return (
      <div className="space-y-6">
        <p className="text-destructive">{error || "Team not found"}</p>
        <Button variant="outline" asChild>
          <Link href={routes.ui.tenancy.teams.list()}>Back to teams</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{team.name}</h1>
          <p className="text-muted-foreground">{team.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.settings(id)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.members(id)}>
              <Users className="mr-2 h-4 w-4" />
              Members
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>{team.description || "No description"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.list()}>Back to teams</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
