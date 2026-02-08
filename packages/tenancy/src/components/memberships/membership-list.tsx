/**
 * @domain tenancy
 * @layer components
 * @responsibility Display membership list with member info
 */

"use client";

import * as React from "react";
import { RoleBadge } from "./role-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Alert,
  AlertDescription,
  AlertTitle,
  Skeleton,
  Avatar,
  AvatarFallback,
} from "@afenda/shadcn";
import { IconAlertCircle, IconUserCircle } from "@tabler/icons-react";
import { format } from "date-fns";

export interface MembershipItem {
  id: string;
  userId: string;
  email?: string;
  name?: string;
  role: string;
  joinedAt: string;
  isActive: boolean;
}

export interface MembershipListProps {
  memberships: MembershipItem[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  onRoleChange?: (membershipId: string, newRole: string) => void;
  onRemove?: (membershipId: string) => void;
}

export function MembershipList({
  memberships,
  isLoading = false,
  error = null,
  emptyMessage = "No members found.",
}: MembershipListProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <IconAlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>
          {error.message || "Failed to load memberships"}
        </AlertDescription>
      </Alert>
    );
  }

  if (memberships.length === 0) {
    return (
      <Alert>
        <IconUserCircle className="h-4 w-4" />
        <AlertTitle>No Members</AlertTitle>
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {memberships.map((membership) => {
            const initials = membership.name
              ? membership.name.split(" ").map(n => n[0]).join("").toUpperCase()
              : membership.email?.[0]?.toUpperCase() ?? "U";

            return (
              <TableRow key={membership.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">
                        {membership.name || membership.email || membership.userId}
                      </div>
                      {membership.name && membership.email && (
                        <div className="text-xs text-muted-foreground">
                          {membership.email}
                        </div>
                      )}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={membership.role} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(membership.joinedAt), "MMM d, yyyy")}
                </TableCell>
                <TableCell>
                  <RoleBadge role={membership.isActive ? "Active" : "Inactive"} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
