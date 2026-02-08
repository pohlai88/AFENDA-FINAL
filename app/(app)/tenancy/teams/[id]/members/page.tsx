/**
 * @domain tenancy
 * @layer ui
 * @responsibility Team members with DataTable and Add Member flow
 */

"use client";

import * as React from "react";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import { Input } from "@afenda/shadcn";
import { Label } from "@afenda/shadcn";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@afenda/shadcn";
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
} from "@afenda/shadcn";
import {
  ClientDropdownMenu,
  ClientDropdownMenuContent,
  ClientDropdownMenuItem,
  ClientDropdownMenuTrigger,
} from "@afenda/shadcn";
import {
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
} from "@afenda/shadcn";
import { Skeleton } from "@afenda/shadcn";
import { Alert, AlertDescription } from "@afenda/shadcn";
import { IconDotsVertical, IconUserPlus } from "@tabler/icons-react";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";

type TeamMember = {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
};

export default function TeamMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = React.useState<string | null>(null);
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addUserId, setAddUserId] = useState("");
  const [addRole, setAddRole] = useState<"lead" | "member">("member");
  const [addSubmitting, setAddSubmitting] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  React.useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    fetch(routes.api.tenancy.teams.bff.members(id))
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.data?.items) {
          setMembers(data.data.items);
        } else if (data.error) {
          setError(data.error?.message ?? "Failed to load members");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Failed to load members");
        setLoading(false);
      });
  }, [id]);

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !addUserId.trim()) return;
    setAddSubmitting(true);
    setAddError(null);
    try {
      const res = await fetch(routes.api.tenancy.teams.bff.members(id), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teamId: id,
          userId: addUserId.trim(),
          role: addRole,
        }),
      });
      const data = await res.json();
      if (data.ok && data.data) {
        setMembers((prev) => [
          ...prev,
          {
            id: data.data.id,
            userId: data.data.userId,
            role: data.data.role,
            joinedAt: data.data.joinedAt ?? new Date().toISOString(),
          },
        ]);
        setAddOpen(false);
        setAddUserId("");
        setAddRole("member");
      } else {
        setAddError(data.error?.message ?? "Failed to add member");
      }
    } catch {
      setAddError("Failed to add member");
    } finally {
      setAddSubmitting(false);
    }
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString("en-US", {
        month: "short",
        year: "numeric",
        day: "numeric",
      });
    } catch {
      return iso;
    }
  };

  if (!id) return null;

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button variant="outline" asChild className="mt-4">
            <Link href={routes.ui.tenancy.teams.byId(id)}>Back to team</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Members</CardTitle>
            <CardDescription>
              {members.length} member{members.length !== 1 ? "s" : ""} in this team
            </CardDescription>
          </div>
          <ClientDialog open={addOpen} onOpenChange={setAddOpen}>
            <ClientDialogTrigger asChild>
              <Button size="sm">
                <IconUserPlus className="mr-2 h-4 w-4" />
                Add Member
              </Button>
            </ClientDialogTrigger>
            <ClientDialogContent>
              <form onSubmit={handleAddMember}>
                <ClientDialogHeader>
                  <ClientDialogTitle>Add team member</ClientDialogTitle>
                  <ClientDialogDescription>
                    Add a member by user ID. Note: Adding by email invite will be
                    available in a future update.
                  </ClientDialogDescription>
                </ClientDialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label htmlFor="userId">User ID</Label>
                    <Input
                      id="userId"
                      value={addUserId}
                      onChange={(e) => setAddUserId(e.target.value)}
                      placeholder="Enter user ID (from auth)"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="role">Role</Label>
                    <ClientSelect
                      value={addRole}
                      onValueChange={(v) =>
                        setAddRole(v as "lead" | "member")
                      }
                    >
                      <ClientSelectTrigger id="role">
                        <ClientSelectValue placeholder="Select role" />
                      </ClientSelectTrigger>
                      <ClientSelectContent>
                        <ClientSelectItem value="lead">Lead</ClientSelectItem>
                        <ClientSelectItem value="member">Member</ClientSelectItem>
                      </ClientSelectContent>
                    </ClientSelect>
                  </div>
                  {addError && (
                    <Alert variant="destructive">
                      <AlertDescription>{addError}</AlertDescription>
                    </Alert>
                  )}
                </div>
                <ClientDialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setAddOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={addSubmitting}>
                    {addSubmitting ? "Adding..." : "Add Member"}
                  </Button>
                </ClientDialogFooter>
              </form>
            </ClientDialogContent>
          </ClientDialog>
        </div>
      </CardHeader>
      <CardContent>
        {members.length === 0 ? (
          <div className="py-10 text-center text-muted-foreground">
            <p>No members yet.</p>
            <Button
              variant="link"
              className="mt-2"
              onClick={() => setAddOpen(true)}
            >
              Add the first member
            </Button>
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-mono text-sm">
                      {m.userId}
                    </TableCell>
                    <TableCell>
                      <span className="capitalize">{m.role}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {formatDate(m.joinedAt)}
                    </TableCell>
                    <TableCell>
                      <ClientDropdownMenu>
                        <ClientDropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <IconDotsVertical className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </ClientDropdownMenuTrigger>
                        <ClientDropdownMenuContent align="end">
                          <ClientDropdownMenuItem disabled>
                            Change role (coming soon)
                          </ClientDropdownMenuItem>
                          <ClientDropdownMenuItem disabled className="text-destructive">
                            Remove (coming soon)
                          </ClientDropdownMenuItem>
                        </ClientDropdownMenuContent>
                      </ClientDropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
