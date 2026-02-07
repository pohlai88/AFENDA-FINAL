/**
 * @domain tenancy
 * @layer ui
 * @responsibility Team members placeholder
 */

"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";

export default function TeamMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = React.useState<string | null>(null);
  React.useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  if (!id) return <p className="text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Team Members</h1>
      <Card>
        <CardHeader>
          <CardTitle>Members</CardTitle>
          <CardDescription>Member management UI is tenancy-owned and will live here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.byId(id)}>Back to team</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
