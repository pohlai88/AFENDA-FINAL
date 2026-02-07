/**
 * @domain tenancy
 * @layer ui
 * @responsibility Tenancy landing
 */

"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import { Building2, Users, UserCircle } from "lucide-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";

const navCards = [
  {
    title: "Organizations",
    description: "Manage organizations and collaborate with teams",
    href: routes.ui.tenancy.organizations.list(),
    icon: Building2,
  },
  {
    title: "Teams",
    description: "Manage teams and members",
    href: routes.ui.tenancy.teams.list(),
    icon: Users,
  },
  {
    title: "Memberships",
    description: "View and manage memberships",
    href: routes.ui.tenancy.memberships(),
    icon: UserCircle,
  },
];

export default function TenancyPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tenancy</h1>
        <p className="text-muted-foreground">
          Multi-tenancy governance: organizations, teams, and memberships
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {navCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.href} className="transition-colors hover:bg-muted/50">
              <Link href={card.href}>
                <CardHeader>
                  <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-base">{card.title}</CardTitle>
                  <CardDescription>{card.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="secondary" size="sm">
                    Open
                  </Button>
                </CardContent>
              </Link>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
