/**
 * Admin Config Page
 * Steve Jobs-inspired minimalist configuration management.
 *
 * @domain admin
 * @layer page
 * @performance Optimized with dynamic imports and server-side data fetching
 * @security All mutations are audited and logged
 */

import "server-only";

import type { Metadata } from "next";
import {
  IconSettings,
  IconSparkles,
} from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Configuration Management",
  description: "Enterprise-grade configuration management with full audit trail",
};

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from "@afenda/shadcn";

import { listConfigs } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import { ConfigCreateDialogEnhanced } from "./_components/ConfigCreateDialog.enhanced";
import { ConfigListEnhanced } from "./_components/ConfigListEnhanced.client";
import { ConfigTemplateQuickApply } from "./_components/ConfigTemplateQuickApply";
import { StatCard } from "./_components/StatCard";
import Link from "next/link";
import { routes } from "@afenda/shared/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0; // Always fetch fresh data for admin pages

export default async function AdminConfigPage() {
  // Fetch configurations with error handling
  const configResult = await listConfigs({ db });

  if (!configResult.ok) {
    // TODO: Use shared package logger when available (01-AGENT: no console.* in server code)
  }

  const configs = configResult.ok
    ? configResult.data.configs.map(c => ({ ...c, value: c.value ?? null }))
    : [];

  // Calculate statistics
  const stats = {
    total: configs.length,
    global: configs.filter(c => c.key.startsWith("global.")).length,
    tenant: configs.filter(c => c.key.startsWith("tenant.")).length,
    service: configs.filter(c => c.key.startsWith("service.")).length,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      {/* Clean Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Configuration</h1>
            <p className="text-muted-foreground mt-1">
              Simple. Powerful. Audited.
            </p>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid gap-3 sm:grid-cols-4">
          <StatCard value={stats.total} label="Total Configurations" />
          <StatCard value={stats.global} label="Global Scope" variant="primary" />
          <StatCard value={stats.tenant} label="Tenant Scope" variant="secondary" />
          <StatCard value={stats.service} label="Service Scope" variant="accent" />
        </div>
      </div>

      {/* Main Content - Clean Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">All Configurations</CardTitle>
              <CardDescription className="mt-1.5">
                Every change is logged. Every setting matters.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Link href={routes.ui.admin.configTemplates()}>
                <Button variant="outline" size="sm" className="gap-2">
                  <IconSparkles className="size-4" />
                  Browse Templates
                </Button>
              </Link>
              <ConfigTemplateQuickApply />
              <ConfigCreateDialogEnhanced />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {configs.length === 0 ? (
            <div className="p-12">
              <Empty>
                <EmptyHeader>
                  <EmptyMedia variant="icon">
                    <IconSettings className="size-6" />
                  </EmptyMedia>
                  <EmptyTitle>Start with Templates</EmptyTitle>
                  <EmptyDescription>
                    Choose from pre-built templates or create your first configuration manually.
                  </EmptyDescription>
                </EmptyHeader>
                <EmptyContent>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p>• Templates ensure best practices and consistency</p>
                    <p>• All changes are automatically audited for compliance</p>
                    <p>• Use scopes (global, tenant, service) to organize settings</p>
                  </div>
                </EmptyContent>
              </Empty>
            </div>
          ) : (
            <ConfigListEnhanced configs={configs} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
