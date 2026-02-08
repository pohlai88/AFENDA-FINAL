/**
 * @domain tenancy
 * @layer ui
 * @responsibility Organizations list with search and filtering
 */

"use client";

import { useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import { Input } from "@afenda/shadcn";
import { IconPlus, IconSearch } from "@tabler/icons-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { useOrganizationsQuery, OrganizationList } from "@afenda/tenancy";

export default function OrganizationsPage() {
  const [search, setSearch] = useState("");
  
  const { data, isLoading, error } = useOrganizationsQuery();

  const organizations = data?.items ?? [];

  const filtered = useMemo(() => {
    if (!search.trim()) return organizations;
    const q = search.toLowerCase();
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        org.slug.toLowerCase().includes(q) ||
        (org.description ?? "").toLowerCase().includes(q)
    );
  }, [organizations, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Organizations</h1>
          <p className="text-muted-foreground">
            Manage your organizations and collaborate with teams
          </p>
        </div>
        <Button asChild>
          <Link href={routes.ui.tenancy.organizations.new()}>
            <IconPlus className="mr-2 h-4 w-4" />
            Create Organization
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>All Organizations</CardTitle>
              <CardDescription>
                {isLoading ? "Loading..." : `${filtered.length} organization${filtered.length !== 1 ? "s" : ""}`}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <OrganizationList 
            organizations={filtered}
            isLoading={isLoading}
            error={error}
            emptyMessage={
              search 
                ? "No organizations match your search." 
                : "No organizations yet. Create your first organization to get started."
            }
          />
        </CardContent>
      </Card>
    </div>
  );
}
