/**
 * @domain tenancy
 * @layer ui
 * @responsibility Memberships with DataTable and type filter
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@afenda/shadcn";
import { ToggleGroup, ToggleGroupItem } from "@afenda/shadcn";
import { Skeleton } from "@afenda/shadcn";
import { Alert, AlertDescription } from "@afenda/shadcn";
import { Badge } from "@afenda/shadcn";
import { IconBuilding, IconSearch, IconUsers } from "@tabler/icons-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { useMembershipsQuery } from "@afenda/tenancy";

type TypeFilter = "all" | "org" | "team";

function MembershipsTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function MembershipsPage() {
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");

  const { data, isLoading, error } = useMembershipsQuery();
  const items = useMemo(() => data?.items ?? [], [data?.items]);

  const filtered = useMemo(() => {
    let result = items;
    if (typeFilter === "org") {
      result = result.filter((i) => i.organizationId != null);
    } else if (typeFilter === "team") {
      result = result.filter((i) => i.teamId != null && !i.organizationId);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          (i.orgName ?? "").toLowerCase().includes(q) ||
          (i.teamName ?? "").toLowerCase().includes(q) ||
          i.role.toLowerCase().includes(q)
      );
    }
    return result;
  }, [items, typeFilter, search]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Memberships</h1>
        <p className="text-muted-foreground">
          Your organization and standalone team memberships
        </p>
      </div>

      {isLoading ? (
        <MembershipsTableSkeleton />
      ) : error ? (
        <Card>
          <CardContent className="pt-6">
            <Alert variant="destructive">
              <AlertDescription>{error.message}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : items.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>No memberships</CardTitle>
            <CardDescription>
              You are not a member of any organization or standalone team yet.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href={routes.ui.tenancy.organizations.list()}>
                  View Organizations
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={routes.ui.tenancy.teams.list()}>View Teams</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Memberships</CardTitle>
                <CardDescription>
                  {filtered.length} membership
                  {filtered.length !== 1 ? "s" : ""}
                </CardDescription>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <ToggleGroup
                  type="single"
                  value={typeFilter}
                  onValueChange={(v) => v && setTypeFilter(v as TypeFilter)}
                  variant="outline"
                  size="sm"
                >
                  <ToggleGroupItem value="all" aria-label="All">
                    All
                  </ToggleGroupItem>
                  <ToggleGroupItem value="org" aria-label="Organizations">
                    Organizations
                  </ToggleGroupItem>
                  <ToggleGroupItem value="team" aria-label="Standalone teams">
                    Standalone teams
                  </ToggleGroupItem>
                </ToggleGroup>
                <div className="relative w-full sm:w-48">
                  <IconSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <p className="py-8 text-center text-muted-foreground">
                No memberships match your filters.
              </p>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {item.organizationId && item.orgName ? (
                            <Badge variant="secondary" className="gap-1">
                              <IconBuilding className="h-3 w-3" />
                              Organization
                            </Badge>
                          ) : item.teamId && item.teamName ? (
                            <Badge variant="outline" className="gap-1">
                              <IconUsers className="h-3 w-3" />
                              Team
                            </Badge>
                          ) : (
                            <Badge variant="outline">—</Badge>
                          )}
                        </TableCell>
                        <TableCell className="font-medium">
                          {item.organizationId && item.orgName
                            ? item.orgName
                            : item.teamId && item.teamName
                              ? `${item.teamName} (standalone)`
                              : "—"}
                        </TableCell>
                        <TableCell>
                          <span className="capitalize">{item.role}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.organizationId && (
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={routes.ui.tenancy.organizations.byId(
                                  item.organizationId
                                )}
                              >
                                View
                              </Link>
                            </Button>
                          )}
                          {item.teamId && !item.organizationId && (
                            <Button variant="outline" size="sm" asChild>
                              <Link href={routes.ui.tenancy.teams.byId(item.teamId)}>
                                View
                              </Link>
                            </Button>
                          )}
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
