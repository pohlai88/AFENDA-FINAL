/**
 * @domain tenancy
 * @layer ui
 * @responsibility Invitation acceptance page
 */

"use client";

import * as React from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader,
  CardTitle,
  Button,
  Alert,
  AlertDescription,
  AlertTitle,
} from "@afenda/shadcn";
import { useInvitationDetailsQuery, useAcceptInvitationMutation, useDeclineInvitationMutation } from "@afenda/tenancy";
import { useRouter } from "next/navigation";
import { routes } from "@afenda/shared/constants";
import { 
  IconMailCheck, 
  IconClock, 
  IconBuildingCommunity, 
  IconUsers,
  IconAlertTriangle,
} from "@tabler/icons-react";
import { toast } from "sonner";

export default function InvitationAcceptancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [token, setToken] = React.useState<string | null>(null);
  const router = useRouter();

  React.useEffect(() => {
    params.then((p) => setToken(p.token));
  }, [params]);

  const { data, isLoading, error } = useInvitationDetailsQuery(token!, {
    enabled: !!token,
  });

  const acceptMutation = useAcceptInvitationMutation({
    onSuccess: (data) => {
      // Redirect to the organization or team page
      const result = data as { membership?: { organizationId?: string; teamId?: string } } | undefined;
      const orgId = result?.membership?.organizationId;
      const teamId = result?.membership?.teamId;
      
      if (orgId) {
        router.push(routes.ui.tenancy.organizations.byId(orgId));
      } else if (teamId) {
        router.push(routes.ui.tenancy.teams.byId(teamId));
      } else {
        router.push(routes.ui.tenancy.root());
      }
    },
    onError: (error: Error) => {
      toast.error("Failed to accept invitation", { description: error.message });
    },
  });

  const declineMutation = useDeclineInvitationMutation({
    onSuccess: () => {
      toast.success("Invitation declined");
      router.push(routes.ui.tenancy.root());
    },
    onError: (error: Error) => {
      toast.error("Failed to decline invitation", { description: error.message });
    },
  });

  const handleAccept = () => {
    if (!token) return;
    acceptMutation.mutate({ token });
  };

  const handleDecline = () => {
    if (!token) return;
    declineMutation.mutate({ token });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Loading Invitation...</CardTitle>
            <CardDescription>Please wait</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !data?.invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <IconAlertTriangle className="h-5 w-5" />
              Invalid Invitation
            </CardTitle>
            <CardDescription>This invitation link is not valid</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {error instanceof Error ? error.message : "The invitation you're trying to access doesn't exist or has already been used."}
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => router.push(routes.ui.tenancy.root())}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const invitation = data.invitation;
  const isExpired = invitation.isExpired || (invitation.status !== "pending");
  const entityName = invitation.orgName || invitation.teamName || "Unknown";
  const entityType = invitation.orgName ? "organization" : "team";

  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20">
        <Card className="w-full max-w-md border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <IconClock className="h-5 w-5" />
              Invitation Expired
            </CardTitle>
            <CardDescription>This invitation is no longer valid</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert variant="destructive">
              <IconClock className="h-4 w-4" />
              <AlertTitle>Expired</AlertTitle>
              <AlertDescription>
                This invitation to join &quot;{entityName}&quot; has expired or has already been used.
                Please contact the organization administrator for a new invitation.
              </AlertDescription>
            </Alert>
          </CardContent>
          <CardFooter>
            <Button
              variant="outline"
              onClick={() => router.push(routes.ui.tenancy.root())}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
            <IconMailCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <CardTitle className="text-2xl">You&apos;ve Been Invited!</CardTitle>
            <CardDescription className="mt-2">
              {invitation.email} has been invited to join
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-start gap-3">
              {entityType === "organization" ? (
                <IconBuildingCommunity className="h-5 w-5 text-primary mt-0.5" />
              ) : (
                <IconUsers className="h-5 w-5 text-primary mt-0.5" />
              )}
              <div className="flex-1">
                <p className="text-sm text-muted-foreground capitalize">{entityType}</p>
                <p className="font-semibold text-lg">{entityName}</p>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="font-medium capitalize">{invitation.role}</span>
            </div>

            {invitation.message && (
              <div className="pt-2 border-t">
                <p className="text-sm text-muted-foreground mb-1">Message</p>
                <p className="text-sm italic">&quot;{invitation.message}&quot;</p>
              </div>
            )}

            <div className="flex items-center justify-between pt-2 border-t">
              <span className="text-sm text-muted-foreground">Expires</span>
              <span className="text-sm">
                {new Date(invitation.expiresAt).toLocaleDateString()}
              </span>
            </div>
          </div>

          {acceptMutation.isError && (
            <Alert variant="destructive">
              <IconAlertTriangle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>
                {acceptMutation.error instanceof Error 
                  ? acceptMutation.error.message 
                  : "Failed to accept invitation. Please try again."}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            onClick={handleAccept}
            disabled={acceptMutation.isPending}
            className="w-full"
            size="lg"
          >
            {acceptMutation.isPending ? "Accepting..." : "Accept Invitation"}
          </Button>
          <Button
            onClick={handleDecline}
            variant="ghost"
            disabled={acceptMutation.isPending || declineMutation.isPending}
            className="w-full"
          >
            {declineMutation.isPending ? "Declining..." : "Decline"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

