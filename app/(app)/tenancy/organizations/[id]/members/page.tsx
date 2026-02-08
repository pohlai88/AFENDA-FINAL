/**
 * @domain tenancy
 * @layer ui
 * @responsibility Organization members management page
 */

"use client";

import * as React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader,
  CardTitle,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogFooter,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
  ClientAlertDialog,
  ClientAlertDialogAction,
  ClientAlertDialogCancel,
  ClientAlertDialogContent,
  ClientAlertDialogDescription,
  ClientAlertDialogFooter,
  ClientAlertDialogHeader,
  ClientAlertDialogTitle,
  ClientAlertDialogTrigger,
  Input,
  Label,
  Textarea,
  Badge,
} from "@afenda/shadcn";
import { 
  useOrgMembersQuery, 
  useUpdateMemberRoleMutation, 
  useRemoveMemberMutation,
  useCreateOrgInvitationMutation,
  useOrgInvitationsQuery,
  useCancelInvitationMutation,
} from "@afenda/tenancy";
import { routes } from "@afenda/shared/constants";
import { IconChevronLeft, IconUserPlus, IconTrash, IconCrown, IconShield, IconUser } from "@tabler/icons-react";
import Link from "next/link";

const roleIcons = {
  owner: IconCrown,
  admin: IconShield,
  member: IconUser,
};

const roleColors = {
  owner: "text-yellow-600 dark:text-yellow-400",
  admin: "text-blue-600 dark:text-blue-400",
  member: "text-gray-600 dark:text-gray-400",
};

export default function OrganizationMembersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = React.useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviteRole, setInviteRole] = React.useState<"owner" | "admin" | "member">("member");
  const [inviteMessage, setInviteMessage] = React.useState("");
  const [isInviteDialogOpen, setIsInviteDialogOpen] = React.useState(false);

  React.useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const { data, isLoading } = useOrgMembersQuery(id!, {
    enabled: !!id,
  });

  const { data: invitationsData, isLoading: invitationsLoading } = useOrgInvitationsQuery(id!, {
    enabled: !!id,
  });

  const updateRoleMutation = useUpdateMemberRoleMutation({
    onSuccess: () => {
      console.log("Role updated successfully");
    },
  });

  const removeMemberMutation = useRemoveMemberMutation({
    onSuccess: () => {
      console.log("Member removed successfully");
    },
  });

  const inviteMutation = useCreateOrgInvitationMutation({
    onSuccess: () => {
      setIsInviteDialogOpen(false);
      setInviteEmail("");
      setInviteMessage("");
      setInviteRole("member");
      console.log("Invitation sent successfully");
    },
    onError: (error: Error) => {
      console.error("Failed to send invitation:", error);
    },
  });

  const cancelInvitationMutation = useCancelInvitationMutation({
    onSuccess: () => {
      console.log("Invitation cancelled successfully");
    },
  });

  const handleRoleChange = (userId: string, newRole: "owner" | "admin" | "member") => {
    if (!id) return;
    updateRoleMutation.mutate({ organizationId: id, userId, role: newRole });
  };

  const handleRemoveMember = (userId: string) => {
    if (!id) return;
    removeMemberMutation.mutate({ organizationId: id, userId });
  };

  const handleSendInvite = () => {
    if (!id || !inviteEmail) return;
    inviteMutation.mutate({
      organizationId: id,
      email: inviteEmail,
      role: inviteRole,
      message: inviteMessage || undefined,
    });
  };

  const handleCancelInvitation = (invitationId: string) => {
    if (!id) return;
    cancelInvitationMutation.mutate({
      organizationId: id,
      invitationId,
    });
  };

  if (!id || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.tenancy.organizations.list()}>
              <IconChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Organization Members</h1>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const members = data?.members || [];
  const invitations = invitationsData?.invitations || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.tenancy.organizations.byId(id)}>
              <IconChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Organization Members</h1>
            <p className="text-sm text-muted-foreground">
              Manage who has access to this organization
            </p>
          </div>
        </div>
        
        <ClientDialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
          <ClientDialogTrigger asChild>
            <Button>
              <IconUserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </ClientDialogTrigger>
          <ClientDialogContent>
            <ClientDialogHeader>
              <ClientDialogTitle>Invite Member</ClientDialogTitle>
              <ClientDialogDescription>
                Send an invitation email to add a new member to this organization.
              </ClientDialogDescription>
            </ClientDialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
                  placeholder="developer@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  They&apos;ll receive an email with an invitation link
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Role</Label>
                <ClientSelect value={inviteRole} onValueChange={(v) => setInviteRole(v as "owner" | "admin" | "member")}>
                  <ClientSelectTrigger id="role">
                    <ClientSelectValue />
                  </ClientSelectTrigger>
                  <ClientSelectContent>
                    <ClientSelectItem value="member">Member</ClientSelectItem>
                    <ClientSelectItem value="admin">Admin</ClientSelectItem>
                    <ClientSelectItem value="owner">Owner</ClientSelectItem>
                  </ClientSelectContent>
                </ClientSelect>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={inviteMessage}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setInviteMessage(e.target.value)}
                  placeholder="Add a personal message to the invitation..."
                  rows={3}
                  maxLength={500}
                />
                <p className="text-xs text-muted-foreground">
                  {inviteMessage.length}/500 characters
                </p>
              </div>
            </div>
            <ClientDialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsInviteDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSendInvite}
                disabled={!inviteEmail || inviteMutation.isPending}
              >
                {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
              </Button>
            </ClientDialogFooter>
          </ClientDialogContent>
        </ClientDialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Members ({members.length})</CardTitle>
          <CardDescription>
            People who have access to this organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {members.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No members yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User ID</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => {
                  const RoleIcon = roleIcons[member.role as keyof typeof roleIcons];
                  const roleColor = roleColors[member.role as keyof typeof roleColors];
                  
                  return (
                    <TableRow key={member.id}>
                      <TableCell className="font-mono text-sm">
                        {member.userId}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {RoleIcon && <RoleIcon className={`h-4 w-4 ${roleColor}`} />}
                          <span className="capitalize">{member.role}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <ClientSelect
                            value={member.role}
                            onValueChange={(newRole) => handleRoleChange(member.userId, newRole as "owner" | "admin" | "member")}
                          >
                            <ClientSelectTrigger className="w-32">
                              <ClientSelectValue />
                            </ClientSelectTrigger>
                            <ClientSelectContent>
                              <ClientSelectItem value="member">Member</ClientSelectItem>
                              <ClientSelectItem value="admin">Admin</ClientSelectItem>
                              <ClientSelectItem value="owner">Owner</ClientSelectItem>
                            </ClientSelectContent>
                          </ClientSelect>
                          
                          <ClientAlertDialog>
                            <ClientAlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <IconTrash className="h-4 w-4 text-destructive" />
                              </Button>
                            </ClientAlertDialogTrigger>
                            <ClientAlertDialogContent>
                              <ClientAlertDialogHeader>
                                <ClientAlertDialogTitle>Remove Member</ClientAlertDialogTitle>
                                <ClientAlertDialogDescription>
                                  Are you sure you want to remove this member? They will lose access to this organization.
                                </ClientAlertDialogDescription>
                              </ClientAlertDialogHeader>
                              <ClientAlertDialogFooter>
                                <ClientAlertDialogCancel>Cancel</ClientAlertDialogCancel>
                                <ClientAlertDialogAction
                                  onClick={() => handleRemoveMember(member.userId)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Remove
                                </ClientAlertDialogAction>
                              </ClientAlertDialogFooter>
                            </ClientAlertDialogContent>
                          </ClientAlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations ({invitations.length})</CardTitle>
            <CardDescription>
              Email invitations that haven&apos;t been accepted yet
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Invited</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invitations.map((invitation) => {
                  const expiresAt = new Date(invitation.expiresAt);
                  const now = new Date();
                  const hoursUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60));
                  const isExpiringSoon = hoursUntilExpiry < 24 && hoursUntilExpiry > 0;
                  
                  return (
                    <TableRow key={invitation.id}>
                      <TableCell className="font-medium">
                        {invitation.email}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {invitation.role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(invitation.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <span className={isExpiringSoon ? "text-warning" : "text-muted-foreground text-sm"}>
                          {isExpiringSoon 
                            ? `${hoursUntilExpiry}h remaining` 
                            : expiresAt.toLocaleDateString()
                          }
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ClientAlertDialog>
                          <ClientAlertDialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <IconTrash className="h-4 w-4 text-destructive" />
                            </Button>
                          </ClientAlertDialogTrigger>
                          <ClientAlertDialogContent>
                            <ClientAlertDialogHeader>
                              <ClientAlertDialogTitle>Cancel Invitation</ClientAlertDialogTitle>
                              <ClientAlertDialogDescription>
                                Are you sure you want to cancel this invitation to {invitation.email}?
                              </ClientAlertDialogDescription>
                            </ClientAlertDialogHeader>
                            <ClientAlertDialogFooter>
                              <ClientAlertDialogCancel>No, keep it</ClientAlertDialogCancel>
                              <ClientAlertDialogAction
                                onClick={() => handleCancelInvitation(invitation.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Yes, cancel
                              </ClientAlertDialogAction>
                            </ClientAlertDialogFooter>
                          </ClientAlertDialogContent>
                        </ClientAlertDialog>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
