/**
 * @domain tenancy
 * @layer components
 * @responsibility Team list with loading and empty states
 */

"use client";

import * as React from "react";
import { TeamCard } from "./team-card";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Skeleton,
} from "@afenda/shadcn";
import { IconAlertCircle, IconUsers } from "@tabler/icons-react";
import type { TenancyTeamListItem } from "../../zod";

export interface TeamListProps {
  teams: TenancyTeamListItem[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
}

export function TeamList({
  teams,
  isLoading = false,
  error = null,
  emptyMessage = "No teams found. Create your first team to get started.",
}: TeamListProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-3 rounded-lg border p-6">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <IconAlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || "Failed to load teams"}
        </AlertDescription>
      </Alert>
    );
  }

  if (teams.length === 0) {
    return (
      <Alert>
        <IconUsers className="h-4 w-4" />
        <AlertTitle>No Teams</AlertTitle>
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {teams.map((team) => (
        <TeamCard key={team.id} team={team} />
      ))}
    </div>
  );
}
