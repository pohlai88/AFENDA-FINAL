/**
 * @domain tenancy
 * @layer ui
 * @responsibility Organization settings placeholder
 */

"use client";

import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";

export default function OrganizationSettingsPage({
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
      <h1 className="text-2xl font-semibold">Organization Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>Organization settings UI is tenancy-owned and will live here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.byId(id)}>Back to organization</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
