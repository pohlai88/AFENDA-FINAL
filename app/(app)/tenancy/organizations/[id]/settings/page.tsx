/**
 * @domain tenancy
 * @layer ui
 * @responsibility Organization settings page
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
import { useOrganizationQuery, useUpdateOrganizationMutation, useDeleteOrganizationMutation } from "@afenda/tenancy";
import { useRouter } from "next/navigation";
import { routes } from "@afenda/shared/constants";
import { IconTrash, IconDeviceFloppy, IconChevronLeft } from "@tabler/icons-react";
import Link from "next/link";

export default function OrganizationSettingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [id, setId] = React.useState<string | null>(null);
  const [formData, setFormData] = React.useState({
    name: "",
    slug: "",
    description: "",
  });
  const router = useRouter();

  React.useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  const { data, isLoading } = useOrganizationQuery(id!, { 
    enabled: !!id 
  });

  const updateMutation = useUpdateOrganizationMutation({
    onSuccess: () => {
      // Show success message
      toast.success("Organization updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update organization", { description: error.message });
    },
  });

  const deleteMutation = useDeleteOrganizationMutation({
    onSuccess: () => {
      // Redirect to organizations list after deletion
      router.push(routes.ui.tenancy.organizations.list());
    },
    onError: (error: Error) => {
      toast.error("Failed to delete organization", { description: error.message });
    },
  });

  // Populate form with fetched data
  React.useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        slug: data.slug || "",
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
            <Link href={routes.ui.tenancy.organizations.list()}>
              <IconChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Organization Settings</h1>
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
            <Link href={routes.ui.tenancy.organizations.byId(id)}>
              <IconChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-semibold">Organization Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your organization details</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General Information</CardTitle>
            <CardDescription>
              Update your organization name, slug, and description. The slug is used in URL paths.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("name", e.target.value)}
                placeholder="My Organization"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange("slug", e.target.value)}
                placeholder="my-organization"
                pattern="[a-z0-9-]+"
                title="Only lowercase letters, numbers, and hyphens"
                required
              />
              <p className="text-xs text-muted-foreground">
                Only lowercase letters, numbers, and hyphens. Used in URLs.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleChange("description", e.target.value)}
                placeholder="Brief description of your organization"
                rows={4}
              />
            </div>
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
                Delete Organization
              </Button>
            </ClientAlertDialogTrigger>
            <ClientAlertDialogContent>
              <ClientAlertDialogHeader>
                <ClientAlertDialogTitle>Are you absolutely sure?</ClientAlertDialogTitle>
                <ClientAlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  organization <strong>{data?.name}</strong> and remove all associated data including:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>All teams within this organization</li>
                    <li>All member relationships</li>
                    <li>Organization settings and preferences</li>
                  </ul>
                </ClientAlertDialogDescription>
              </ClientAlertDialogHeader>
              <ClientAlertDialogFooter>
                <ClientAlertDialogCancel>Cancel</ClientAlertDialogCancel>
                <ClientAlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteMutation.isPending ? "Deleting..." : "Delete Organization"}
                </ClientAlertDialogAction>
              </ClientAlertDialogFooter>
            </ClientAlertDialogContent>
          </ClientAlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
