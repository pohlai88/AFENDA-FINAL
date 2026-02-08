/**
 * @domain tenancy
 * @layer components
 * @responsibility Display organization card with actions
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
import { IconBuilding, IconUsers, IconSettings } from "@tabler/icons-react";
import type { TenancyOrganizationResponse } from "../../zod";

export interface OrganizationCardProps {
  organization: TenancyOrganizationResponse;
  showActions?: boolean;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export function OrganizationCard({
  organization,
  showActions = true,
}: OrganizationCardProps) {
  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <IconBuilding className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {organization.name}
              </CardTitle>
              <CardDescription className="text-xs">
                @{organization.slug}
              </CardDescription>
            </div>
          </div>
          {organization.isActive ? (
            <Badge variant="default" className="h-6">Active</Badge>
          ) : (
            <Badge variant="secondary" className="h-6">Inactive</Badge>
          )}
        </div>
      </CardHeader>
      
      {organization.description && (
        <CardContent>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {organization.description}
          </p>
        </CardContent>
      )}

      {showActions && (
        <CardFooter className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.ui.tenancy.organizations.byId(organization.id)}>
              <IconUsers className="mr-2 h-4 w-4" />
              View
            </Link>
          </Button>
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.tenancy.organizations.settings(organization.id)}>
              <IconSettings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}
