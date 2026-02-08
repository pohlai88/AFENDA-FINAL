/**
 * @domain tenancy
 * @layer components
 * @responsibility Display team card with actions
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Badge,
} from "@afenda/shadcn";
import { IconUsers, IconEye, IconSettings, IconBuilding } from "@tabler/icons-react";
import type { TenancyTeamListItem } from "../../zod";

export interface TeamCardProps {
  team: TenancyTeamListItem;
  showActions?: boolean;
}

export function TeamCard({
  team,
  showActions = true,
}: TeamCardProps) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <IconUsers className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {team.name}
              </CardTitle>
              <CardDescription className="text-xs">
                @{team.slug}
              </CardDescription>
            </div>
          </div>
          {team.isActive ? (
            <Badge variant="default" className="h-6">Active</Badge>
          ) : (
            <Badge variant="secondary" className="h-6">Inactive</Badge>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-2">
        {team.orgName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <IconBuilding className="h-4 w-4" />
            <span>{team.orgName}</span>
          </div>
        )}
        {team.description && (
          <p className="text-sm text-muted-foreground line-clamp-2">
            {team.description}
          </p>
        )}
      </CardContent>

      {showActions && (
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.ui.tenancy.teams.byId(team.id)}>
              <IconEye className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.tenancy.teams.settings(team.id)}>
              <IconSettings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
