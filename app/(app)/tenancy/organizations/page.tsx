/**
 * @domain tenancy
 * @layer ui
 * @responsibility Organizations list with server-first data to avoid client waterfall
 */

import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getAuthContext } from "@afenda/orchestra";
import { tenancyOrganizationService } from "@afenda/tenancy/server";
import { Skeleton } from "@afenda/shadcn";
import { OrganizationsPageClient } from "./OrganizationsPageClient";

async function OrganizationsData() {
  const auth = await getAuthContext();
  const userId = auth.userId ?? undefined;
  if (!userId) {
    redirect("/auth/sign-in");
  }

  const raw = await tenancyOrganizationService.listForUser(userId, {
    page: 1,
    limit: 100,
  });
  const initialData = {
    ...raw,
    items: raw.items.map((org) => ({ ...org, settings: org.settings ?? {} })),
  };

  return <OrganizationsPageClient initialData={initialData} />;
}

function OrganizationsFallback() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export default function OrganizationsPage() {
  return (
    <Suspense fallback={<OrganizationsFallback />}>
      <OrganizationsData />
    </Suspense>
  );
}
