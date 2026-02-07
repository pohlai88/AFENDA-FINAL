/**
 * @domain tenancy
 * @layer ui
 * @responsibility Memberships (org and standalone team)
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
import { Badge } from "@afenda/shadcn";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import { Building2, Users } from "lucide-react";

interface MembershipItem {
  id: string;
  userId: string;
  organizationId: string | null;
  teamId: string | null;
  role: string;
  joinedAt: string;
  orgName: string | null;
  teamName: string | null;
}

export default function MembershipsPage() {
  const [items, setItems] = useState<MembershipItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(routes.api.tenancy.memberships.bff.list())
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data?.items) {
          setItems(data.data.items);
        } else if (data.error) {
          setError(data.error?.message || "Failed to load memberships");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load memberships");
        setLoading(false);
      });
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Memberships</h1>
        <p className="text-muted-foreground">
          Your organization and standalone team memberships
        </p>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              Loading memberships...
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-destructive">{error}</div>
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
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      {item.organizationId && item.orgName ? (
                        <>
                          <Building2 className="h-4 w-4 shrink-0" />
                          Organization: {item.orgName}
                        </>
                      ) : item.teamId && item.teamName ? (
                        <>
                          <Users className="h-4 w-4 shrink-0" />
                          Team: {item.teamName} (standalone)
                        </>
                      ) : (
                        <span>Membership</span>
                      )}
                    </CardTitle>
                    <CardDescription>Role: {item.role}</CardDescription>
                    <Badge variant="outline">{item.role}</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {item.organizationId && (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link
                      href={routes.ui.tenancy.organizations.byId(
                        item.organizationId
                      )}
                    >
                      View Organization
                    </Link>
                  </Button>
                )}
                {item.teamId && !item.organizationId && (
                  <Button variant="outline" size="sm" asChild className="w-full">
                    <Link href={routes.ui.tenancy.teams.byId(item.teamId)}>
                      View Team
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
