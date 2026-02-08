/**
 * @domain tenancy
 * @layer ui
 * @responsibility Tenancy landing dashboard
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
import { IconBuilding, IconPlus, IconUsers, IconUserCircle } from "@tabler/icons-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";

const navCards = [
  {
    title: "Organizations",
    description: "Manage organizations and collaborate with teams",
    href: routes.ui.tenancy.organizations.list(),
    icon: IconBuilding,
  },
  {
    title: "Teams",
    description: "Manage teams and members",
    href: routes.ui.tenancy.teams.list(),
    icon: IconUsers,
  },
  {
    title: "Memberships",
    description: "View and manage memberships",
    href: routes.ui.tenancy.memberships(),
    icon: IconUserCircle,
  },
];

export default function TenancyPage() {
  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tenancy</h1>
          <p className="text-muted-foreground mt-1">
            Multi-tenancy governance: organizations, teams, and memberships
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild>
            <Link href={routes.ui.tenancy.organizations.new()}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Organization
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={routes.ui.tenancy.teams.new()}>
              <IconPlus className="mr-2 h-4 w-4" />
              Create Team
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs dark:*:data-[slot=card]:bg-card">
        {navCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.href}
              className="transition-colors hover:bg-muted/50 cursor-pointer"
            >
              <Link href={card.href} className="block h-full">
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
