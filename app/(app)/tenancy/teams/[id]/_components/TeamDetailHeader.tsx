/**
 * @domain tenancy
 * @layer ui
 * @responsibility Team detail header with breadcrumb and tabs
 */

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import { Tabs, TabsList, TabsTrigger } from "@afenda/shadcn";
import { IconSettings, IconUserPlus, IconUsers } from "@tabler/icons-react";
import { routes } from "@afenda/shared/constants";
import { useTeamQuery } from "@afenda/tenancy";

export function TeamDetailHeader({
  teamId,
  children,
}: {
  teamId: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { data: team } = useTeamQuery(teamId);

  const basePath = routes.ui.tenancy.teams.byId(teamId);
  const membersPath = routes.ui.tenancy.teams.members(teamId);
  const settingsPath = routes.ui.tenancy.teams.settings(teamId);

  const activeTab =
    pathname === membersPath
      ? "members"
      : pathname === settingsPath
        ? "settings"
        : "overview";

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={routes.ui.tenancy.root()}>Tenancy</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={routes.ui.tenancy.teams.list()}>Teams</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{team?.name ?? "Team"}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {team?.name ?? "Team"}
          </h1>
          <p className="text-muted-foreground">{team?.slug ?? ""}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={membersPath}>
              <IconUserPlus className="mr-2 h-4 w-4" />
              Add Member
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={settingsPath}>
              <IconSettings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      <Tabs value={activeTab}>
        <TabsList>
          <TabsTrigger value="overview" asChild>
            <Link href={basePath}>Overview</Link>
          </TabsTrigger>
          <TabsTrigger value="members" asChild>
            <Link href={membersPath}>
              <IconUsers className="mr-2 h-4 w-4" />
              Members
            </Link>
          </TabsTrigger>
          <TabsTrigger value="settings" asChild>
            <Link href={settingsPath}>Settings</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {children}
    </div>
  );
}
