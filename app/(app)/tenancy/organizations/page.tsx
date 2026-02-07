/**
 * @domain tenancy
 * @layer ui
 * @responsibility Organizations list
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
import { PlusCircle, Users, Settings } from "lucide-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";

interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(routes.api.tenancy.organizations.bff.list())
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data?.items) {
          setOrganizations(data.data.items);
        } else if (data.error) {
          setError(data.error?.message || "Failed to load organizations");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load organizations");
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and collaborate with teams
          </p>
        </div>
        <Button asChild>
          <Link href={routes.ui.tenancy.organizations.new()}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Organization
          </Link>
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              Loading organizations...
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-destructive">{error}</div>
          </CardContent>
        </Card>
      ) : organizations.length === 0 ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center space-y-3">
              <p className="text-muted-foreground">No organizations yet</p>
              <Button asChild>
                <Link href={routes.ui.tenancy.organizations.new()}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Your First Organization
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Card key={org.id}>
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
                <CardDescription>{org.description || "No description"}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={routes.ui.tenancy.organizations.byId(org.id)}>
                      <Users className="mr-2 h-4 w-4" />
                      View
                    </Link>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={routes.ui.tenancy.organizations.settings(org.id)}>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
