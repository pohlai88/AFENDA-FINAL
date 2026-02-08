/**
 * @domain tenancy
 * @layer components
 * @responsibility Display invitation list with status
 */

"use client";

import * as React from "react";
import { InvitationStatusBadge } from "./invitation-status-badge";
import { RoleBadge } from "../memberships/role-badge";
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
  Button,
} from "@afenda/shadcn";
import { IconAlertCircle, IconMailCheck, IconTrash } from "@tabler/icons-react";
import { format } from "date-fns";

export interface InvitationItem {
  id: string;
  email: string;
  role: string;
  status: string;
  invitedBy?: string;
  message?: string | null;
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  orgName?: string | null;
  teamName?: string | null;
}

export interface InvitationListProps {
  invitations: InvitationItem[];
  isLoading?: boolean;
  error?: Error | null;
  emptyMessage?: string;
  onCancel?: (invitationId: string) => void;
  showOrgName?: boolean;
  showTeamName?: boolean;
}

export function InvitationList({
  invitations,
  isLoading = false,
  error = null,
  emptyMessage = "No pending invitations.",
  onCancel,
  showOrgName = false,
  showTeamName = false,
}: InvitationListProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
              {onCancel && <TableHead className="w-[100px]">Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                {onCancel && <TableCell><Skeleton className="h-8 w-16" /></TableCell>}
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
          {error.message || "Failed to load invitations"}
        </AlertDescription>
      </Alert>
    );
  }

  if (invitations.length === 0) {
    return (
      <Alert>
        <IconMailCheck className="h-4 w-4" />
        <AlertTitle>No Invitations</AlertTitle>
        <AlertDescription>{emptyMessage}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
            {showOrgName && <TableHead>Organization</TableHead>}
            {showTeamName && <TableHead>Team</TableHead>}
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Expires</TableHead>
            {onCancel && <TableHead className="w-[100px]">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {invitations.map((invitation) => {
            const isExpired = new Date(invitation.expiresAt) < new Date();
            
            return (
              <TableRow key={invitation.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{invitation.email}</div>
                    {invitation.message && (
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {invitation.message}
                      </div>
                    )}
                  </div>
                </TableCell>
                {showOrgName && (
                  <TableCell className="text-sm text-muted-foreground">
                    {invitation.orgName || "—"}
                  </TableCell>
                )}
                {showTeamName && (
                  <TableCell className="text-sm text-muted-foreground">
                    {invitation.teamName || "—"}
                  </TableCell>
                )}
                <TableCell>
                  <RoleBadge role={invitation.role} />
                </TableCell>
                <TableCell>
                  <InvitationStatusBadge 
                    status={isExpired ? "expired" : invitation.status} 
                  />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {format(new Date(invitation.expiresAt), "MMM d, yyyy")}
                </TableCell>
                {onCancel && (
                  <TableCell>
                    {invitation.status === "pending" && !isExpired && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onCancel(invitation.id)}
                      >
                        <IconTrash className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
