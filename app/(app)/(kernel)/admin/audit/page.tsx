/**
 * Admin Audit Page
 * Immutable audit log viewer with filtering and export.
 *
 * @domain admin
 * @layer page
 */

import { IconShield } from "@tabler/icons-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";

import { queryAuditLogs } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import { routes } from "@afenda/shared/constants";
import { AuditFilters } from "./_components/AuditFilters";
import { AuditPagination } from "./_components/AuditPagination";
import { AuditExportButton } from "./_components/AuditExportButton";
import { RealTimeAuditStream } from "./_components/RealTimeAuditStream";
import { EmptyStateEnhanced } from "../_components/EmptyStateEnhanced";
import { AuditTableEnhanced } from "./_components/AuditTableEnhanced.client";
import {
  AUDIT_PAGINATION,
  AUDIT_RETENTION,
} from "./_constants/audit.constants";

export const dynamic = "force-dynamic";

interface AuditPageProps {
  searchParams: Promise<{
    eventType?: string;
    entityType?: string;
    startDate?: string;
    endDate?: string;
    page?: string;
  }>;
}

export default async function AdminAuditPage({ searchParams }: AuditPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10);
  const pageSize = AUDIT_PAGINATION.DEFAULT_PAGE_SIZE;
  const offset = (page - 1) * pageSize;

  const auditResult = await queryAuditLogs(
    { db },
    {
      eventType: params.eventType,
      entityType: params.entityType,
      startDate: params.startDate,
      endDate: params.endDate,
      limit: pageSize,
      offset,
    }
  );

  const entries = auditResult.ok ? auditResult.data.entries : [];
  const total = auditResult.ok ? auditResult.data.total : 0;
  const hasMore = auditResult.ok ? auditResult.data.hasMore : false;

  return (
    <div className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Audit Log</h1>
          <p className="text-muted-foreground">
            Immutable record of system events
          </p>
        </div>
        <AuditExportButton />
      </div>

      {/* Info banner */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
        <CardContent className="flex items-center gap-3 py-3">
          <IconShield className="size-5 text-amber-600 dark:text-amber-400" />
          <span className="text-sm">
            Audit entries are immutable and cannot be modified or deleted. All exports include integrity metadata.
          </span>
        </CardContent>
      </Card>

      {/* Real-time stream (client-only, optional) */}
      <RealTimeAuditStream maxEvents={50} autoScroll />

      {/* Filters */}
      <AuditFilters
        eventType={params.eventType}
        entityType={params.entityType}
        startDate={params.startDate}
        endDate={params.endDate}
      />

      {/* Audit table */}
      <Card>
        <CardHeader>
          <CardTitle>Audit Entries</CardTitle>
          <CardDescription>
            {total} total entries
          </CardDescription>
        </CardHeader>
        <CardContent>
          {entries.length === 0 ? (
            <EmptyStateEnhanced
              icon={<IconShield className="size-16 text-muted-foreground/30" />}
              title="No Audit Entries Found"
              description="Audit entries will appear here once system events occur. All configuration changes and system operations are automatically logged."
              tips={[
                `Audit logs are immutable and retained for ${AUDIT_RETENTION.DISPLAY_TEXT}`,
                "All configuration changes are automatically logged",
                "Use filters to narrow down specific events",
              ]}
              actions={[
                {
                  label: "Adjust Filters",
                  href: routes.ui.admin.audit(),
                  variant: "outline",
                },
              ]}
            />
          ) : (
            <AuditTableEnhanced
              entries={entries.map((entry) => ({
                ...entry,
                entityType: entry.entityType ?? null,
                actorType: entry.actorType ?? null,
                details: entry.details ?? null,
                previousValues: entry.previousValues ?? null,
                ipAddress: entry.ipAddress ?? null,
                userAgent: entry.userAgent ?? null,
              }))}
            />
          )}

          {/* Pagination */}
          {total > pageSize && (
            <div className="mt-4">
              <AuditPagination
                currentPage={page}
                pageSize={pageSize}
                total={total}
                hasMore={hasMore}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
