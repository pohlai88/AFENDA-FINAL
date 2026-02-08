/**
 * @domain tenancy
 * @layer ui
 * @responsibility Organizations list with DataTable, skeleton, empty state
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@afenda/shadcn";
import { Skeleton } from "@afenda/shadcn";
import { Alert, AlertDescription } from "@afenda/shadcn";
import { IconPlus, IconSearch, IconUsers, IconSettings } from "@tabler/icons-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { useOrganizationsQuery } from "@afenda/tenancy";

function OrganizationsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full max-w-sm" />
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[120px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5].map((i) => (
                <TableRow key={i}>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-20" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

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

      {isLoading ? (
        <OrganizationsTableSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : organizations.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No organizations yet</CardTitle>
            <CardDescription>
              Create your first organization to start collaborating with teams
              and members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={routes.ui.tenancy.organizations.new()}>
                <IconPlus className="mr-2 h-4 w-4" />
                Create Your First Organization
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Organizations</CardTitle>
                <CardDescription>
                  {filtered.length} organization{filtered.length !== 1 ? "s" : ""}
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
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No organizations match your search.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="w-[160px] text-right">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((org) => (
                      <TableRow key={org.id}>
                        <TableCell className="font-medium">{org.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {org.slug}
                        </TableCell>
                        <TableCell className="max-w-[300px] truncate text-muted-foreground">
                          {org.description || "—"}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" asChild>
                              <Link href={routes.ui.tenancy.organizations.byId(org.id)}>
                                <IconUsers className="mr-1.5 h-3.5 w-3.5" />
                                View
                              </Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={routes.ui.tenancy.organizations.settings(
                                  org.id
                                )}
                              >
                                <IconSettings className="mr-1.5 h-3.5 w-3.5" />
                                Settings
                              </Link>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
