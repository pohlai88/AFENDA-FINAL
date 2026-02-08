/**
 * Admin Assignments Page
 * Primary admin, delegated admins, and RBAC management.
 * Uses Suspense for progressive streaming of data-dependent content.
 *
 * @domain admin
 * @layer page
 */

import "server-only";

import type { Metadata } from "next";
import { Suspense } from "react";
import { IconShield } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Admin Assignments | Admin",
  description:
    "Manage primary administrator, delegated admins, and role-based access control (RBAC)",
  keywords: ["admin", "RBAC", "roles", "permissions", "delegated admins"],
};

import { Card, CardContent } from "@afenda/shadcn";
import { getConfig } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import {
  AdminAssignmentsSchema,
  DEFAULT_ADMIN_ASSIGNMENTS,
} from "@afenda/orchestra";
import { getEffectivePrimaryAdmin } from "./_utils/admin-assignment.utils";
import { PrimaryAdminTable } from "./_components/PrimaryAdminTable.client";
import { DelegatedAdminsTable } from "./_components/DelegatedAdminsTable.client";
import { RBACRoleMatrix } from "./_components/RBACRoleMatrix";
import { AdminsContentSkeleton } from "../_components/AdminSkeleton";
import { ADMIN_CONFIG_KEY } from "./_constants/admin-assignment.constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function AdminAssignmentsContent() {
  const result = await getConfig({ db }, ADMIN_CONFIG_KEY);

  const assignments =
    result.ok && result.data
      ? AdminAssignmentsSchema.safeParse(result.data.value)
      : { success: false as const };
  const data = assignments.success
    ? assignments.data
    : DEFAULT_ADMIN_ASSIGNMENTS;
  const primaryAdmin = getEffectivePrimaryAdmin(data);

  return (
    <>
      <PrimaryAdminTable primaryAdmin={primaryAdmin} />
      <DelegatedAdminsTable delegatedAdmins={data.delegatedAdmins} />
      <RBACRoleMatrix />
    </>
  );
}

export default function AdminAssignmentsPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Admin Assignments
          </h1>
          <p className="text-muted-foreground mt-1">
            Assign primary administrator, delegated admins, and manage RBAC
          </p>
        </div>

        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
          <CardContent className="flex items-start gap-3 py-3">
            <IconShield className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Primary administrator has full control
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Delegated admins receive scoped roles. Only the primary admin or
                a full_admin can modify assignments.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Suspense fallback={<AdminsContentSkeleton />}>
        <AdminAssignmentsContent />
      </Suspense>
    </div>
  );
}
