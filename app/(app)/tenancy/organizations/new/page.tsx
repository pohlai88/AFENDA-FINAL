/**
 * @domain tenancy
 * @layer ui
 * @responsibility Create organization
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";
import { Button } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { OrganizationForm, type OrganizationFormValues } from "@afenda/tenancy";
import Link from "next/link";
import { IconAlertCircle, IconArrowLeft } from "@tabler/icons-react";

export default function NewOrganizationPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (values: OrganizationFormValues) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(routes.api.tenancy.organizations.bff.list(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (data.ok && data.data?.id) {
        router.push(routes.ui.tenancy.organizations.list());
      } else {
        setError(data.error?.message || "Failed to create organization");
      }
    } catch {
      setError("Failed to create organization");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild>
          <Link href={routes.ui.tenancy.organizations.list()}>
            <IconArrowLeft className="mr-2 h-4 w-4" />
            Back to Organizations
          </Link>
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Organization</h1>
        <p className="text-muted-foreground">Add a new organization to your workspace</p>
      </div>

      {error && (
        <Alert variant="destructive">
          <IconAlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Organization Details</CardTitle>
          <CardDescription>Enter the organization information below</CardDescription>
        </CardHeader>
        <CardContent>
          <OrganizationForm 
            onSubmit={handleSubmit}
            submitLabel="Create Organization"
            isLoading={loading}
          />
        </CardContent>
      </Card>
    </div>
  );
}
