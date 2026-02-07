/**
 * @domain tenancy
 * @layer ui
 * @responsibility Organization detail
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
import { Settings, Users, Building2 } from "lucide-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function OrganizationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = useState<string | null>(null);
  const [org, setOrg] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(routes.api.tenancy.organizations.bff.byId(id))
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data) {
          setOrg(data.data);
        } else {
          setError(data.error?.message || "Organization not found");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load organization");
        setLoading(false);
      });
  }, [id]);

  if (!id || loading) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (error || !org) {
    return (
      <div className="space-y-6">
        <p className="text-destructive">{error || "Organization not found"}</p>
        <Button variant="outline" asChild>
          <Link href={routes.ui.tenancy.organizations.list()}>Back to organizations</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{org.name}</h1>
          <p className="text-muted-foreground">{org.slug}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.settings(id)}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.members(id)}>
              <Users className="mr-2 h-4 w-4" />
              Members
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.teams(id)}>
              <Building2 className="mr-2 h-4 w-4" />
              Teams
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
          <CardDescription>{org.description || "No description"}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.organizations.list()}>Back to organizations</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
