/**
 * Admin Backup Page
 * Enterprise-grade backup and restore operations with audit trail.
 *
 * @domain admin
 * @layer page
 * @performance Server-side data fetching with dynamic revalidation
 * @security All operations audited and logged
 */

import type { Metadata } from "next";
import { IconDatabase, IconCloudUpload, IconHistory, IconShield, IconClock, IconLock, IconCloud } from "@tabler/icons-react";

export const metadata: Metadata = {
  title: "Backup & Restore | Admin",
  description: "Enterprise-grade encrypted backup and restore operations with dual storage (R2 + local) and full audit trail",
  keywords: ["backup", "restore", "encryption", "AES-256-GCM", "disaster recovery", "data protection"],
};

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@afenda/shadcn";

import { listBackups, listBackupSchedules } from "@afenda/orchestra";
import { db } from "@afenda/shared/server/db";
import { BackupTriggerCard } from "./_components/BackupTriggerCard";
import { RestoreCard } from "./_components/RestoreCard";
import { BackupTableEnhanced } from "./_components/BackupTableEnhanced.client";
import { BackupTableRefreshButton } from "./_components/BackupTableRefreshButton";
import { BackupScheduler } from "./_components/BackupScheduler";
import { BackupSizeEstimator } from "./_components/BackupSizeEstimator";
import type { BackupEntry } from "./_components/BackupTableEnhanced.client";

function formatTimestamp(date: Date): string {
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${Number((bytes / Math.pow(k, i)).toFixed(1))} ${["B", "KB", "MB", "GB", "TB"][i]}`;
}

export const dynamic = "force-dynamic";
export const revalidate = 0; // Always fetch fresh data for admin pages

export default async function AdminBackupPage() {
  // Get backup list and schedules in parallel
  const [backupsResult, schedulesResult] = await Promise.all([
    listBackups({ db }, { limit: 50, offset: 0 }),
    listBackupSchedules({ db }),
  ]);

  const backups = backupsResult.ok ? backupsResult.data.backups : [];
  const totalSizeBytes = backupsResult.ok ? backupsResult.data.totalSizeBytes : 0;
  const scheduleRows = schedulesResult.ok ? schedulesResult.data : [];
  const schedules = scheduleRows.map((s) => ({
    id: s.id,
    name: s.name,
    cronExpression: s.cronExpression,
    enabled: s.enabled,
    lastRun: s.lastRun ?? undefined,
    nextRun: s.nextRun ?? undefined,
  }));

  // Transform to BackupEntry format for table
  const backupEntries: BackupEntry[] = backups.map((backup) => ({
    id: backup.id,
    filename: backup.filename,
    type: (backup.backupType || "full") as "full" | "incremental" | "differential",
    size: backup.sizeBytes,
    duration: 0, // Duration not stored in new schema
    status: backup.status === "completed" ? "success" : backup.status === "failed" ? "failed" : "in-progress",
    createdBy: backup.createdBy,
    createdAt: backup.createdAt,
    storageProvider: backup.storageProvider,
    encrypted: backup.encrypted,
    encryptionAlgorithm: backup.encryptionAlgorithm,
    checksum: backup.checksum,
    metadata: backup.metadata as Record<string, unknown> | undefined,
  }));

  // Calculate statistics (total/count from list response; totalSizeBytes from GET)
  const stats = {
    total: backupsResult.ok ? backupsResult.data.total : backups.length,
    successful: backups.filter(b => b.status === "completed").length,
    lastBackup: backups[0] ? new Date(backups[0].createdAt) : null,
    totalSizeBytes,
  };

  return (
    <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
      {/* Clean Header */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Backup & Restore</h1>
            <p className="text-muted-foreground mt-1">
              Enterprise-grade encrypted data protection with dual storage
            </p>
          </div>
        </div>

        {/* Encryption Info Banner */}
        <Card className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/50">
          <CardContent className="flex items-start gap-3 py-3">
            <IconLock className="size-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                AES-256-GCM Encryption Enabled
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                All backups are encrypted at rest with auto-generated keys. Dual storage: Cloudflare R2 (primary) + Local filesystem (fallback).
              </p>
            </div>
            <IconCloud className="size-5 text-blue-600 dark:text-blue-400" />
          </CardContent>
        </Card>

        {/* Stats Row */}
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Backups</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <IconDatabase className="size-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Successful</p>
                  <p className="text-2xl font-bold text-green-600">{stats.successful}</p>
                </div>
                <IconCloudUpload className="size-8 text-green-600/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Storage</p>
                  <p className="text-2xl font-bold tabular-nums">{formatBytes(stats.totalSizeBytes)}</p>
                </div>
                <IconDatabase className="size-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Last Backup</p>
                  <p className="text-sm font-semibold">
                    {stats.lastBackup ? formatTimestamp(stats.lastBackup) : "Never"}
                  </p>
                </div>
                <IconClock className="size-8 text-muted-foreground/30" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Warning banner */}
      <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
        <CardContent className="flex items-start gap-3 py-3">
          <IconShield className="size-5 text-amber-600 dark:text-amber-400 mt-0.5" />
          <div className="flex-1 space-y-1">
            <p className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Security & Audit Notice
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-300">
              All backup and restore operations are logged in the audit trail. Restores will overwrite current data and cannot be undone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Action cards */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <BackupTriggerCard />
        <RestoreCard />
      </div>

      {/* Schedule backup + size estimator */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="border-0 shadow-sm lg:col-span-2">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center gap-2 text-xl">
              <IconClock className="size-5" />
              Scheduled Backups
            </CardTitle>
            <CardDescription className="mt-1.5">
              Create and manage automated backup schedules (cron-based)
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <BackupScheduler schedules={schedules} />
          </CardContent>
        </Card>
        <BackupSizeEstimator autoLoad />
      </div>

      {/* Backup History Table */}
      <Card className="border-0 shadow-sm">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl">
                <IconHistory className="size-5" />
                Backup History
              </CardTitle>
              <CardDescription className="mt-1.5">
                Complete backup history with search, filter, and export capabilities
              </CardDescription>
            </div>
            <BackupTableRefreshButton />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <BackupTableEnhanced backups={backupEntries} />
        </CardContent>
      </Card>
    </div>
  );
}

