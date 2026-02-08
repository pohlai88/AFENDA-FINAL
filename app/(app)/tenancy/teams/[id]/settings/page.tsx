/**
 * @domain tenancy
 * @layer ui
 * @responsibility Team settings page
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
  Input,
  Label,
  Textarea,
  ClientAlertDialog,
  ClientAlertDialogAction,
  ClientAlertDialogCancel,
  ClientAlertDialogContent,
  ClientAlertDialogDescription,
  ClientAlertDialogFooter,
  ClientAlertDialogHeader,
  ClientAlertDialogTitle,
  ClientAlertDialogTrigger,
} from "@afenda/shadcn";
import { toast } from "sonner";
import { useTeamQuery, useUpdateTeamMutation, useDeleteTeamMutation } from "@afenda/tenancy";
import { useRouter } from "next/navigation";
import { routes } from "@afenda/shared/constants";
import { IconTrash, IconDeviceFloppy, IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function TeamSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
  });
  const router = useRouter();

  React.useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const { data, isLoading } = useTeamQuery(id!, { 
    enabled: !!id 
  });

  const updateMutation = useUpdateTeamMutation({
    onSuccess: () => {
      toast.success("Team updated successfully");
    },
    onError: (error: Error) => {
      toast.error("Failed to update team", { description: error.message });
    },
  });

  const deleteMutation = useDeleteTeamMutation({
    onSuccess: () => {
      // Redirect to teams list after deletion
      router.push(routes.ui.tenancy.teams.list());
    },
    onError: (error: Error) => {
      toast.error("Failed to delete team", { description: error.message });
    },
  });

  // Populate form with fetched data
  React.useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
      });
    }
  }, [data]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    updateMutation.mutate({
      id,
      ...formData,
    });
  };

  const handleDelete = () => {
    if (!id) return;
    deleteMutation.mutate(id);
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  if (!id || isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.tenancy.teams.list()}>
              <IconChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Team Settings</h1>
        </div>
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href={routes.ui.tenancy.teams.byId(id)}>
              <IconChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Team Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your team details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>
              Update your team name and description.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Team Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("name", e.target.value)}
                placeholder="My Team"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
                placeholder="Brief description of your team"
                rows={4}
              />
            </div>

            {data?.organizationId && (
              <div className="space-y-2">
                <Label>Organization</Label>
                <p className="text-sm text-muted-foreground">
                  {data.orgName || data.organizationId}
                </p>
              </div>
            )}
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button 
              type="button" 
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
            >
              <IconDeviceFloppy className="h-4 w-4 mr-2" />
              {updateMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions. Please proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ClientAlertDialog>
            <ClientAlertDialogTrigger asChild>
              <Button variant="destructive">
                <IconTrash className="h-4 w-4 mr-2" />
                Delete Team
              </Button>
            </ClientAlertDialogTrigger>
            <ClientAlertDialogContent>
              <ClientAlertDialogHeader>
                <ClientAlertDialogTitle>Are you absolutely sure?</ClientAlertDialogTitle>
                <ClientAlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  team <strong>{data?.name}</strong> and remove all associated data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All team member relationships</li>
                    <li>Team settings and preferences</li>
                  </ul>
                </ClientAlertDialogDescription>
              </ClientAlertDialogHeader>
              <ClientAlertDialogFooter>
                <ClientAlertDialogCancel>Cancel</ClientAlertDialogCancel>
                <ClientAlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Team"}
                </ClientAlertDialogAction>
              </ClientAlertDialogFooter>
            </ClientAlertDialogContent>
          </ClientAlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
