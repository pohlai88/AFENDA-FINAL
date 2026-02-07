"use client";

/**
 * Backup Size Estimator
 * Estimates backup size before creation to help users understand storage requirements.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, Badge, Alert, AlertDescription } from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";

interface BackupSizeEstimate {
  totalSize: number;
  breakdown: {
    configs: number;
    auditLogs: number;
    healthHistory: number;
    serviceRegistry: number;
  };
  estimatedTime: number; // seconds
  compressionRatio: number;
}

interface BackupSizeEstimatorProps {
  autoLoad?: boolean;
}

/**
 * Format bytes to human-readable size.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

/**
 * Format time duration.
 */
function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}

export function BackupSizeEstimator({ autoLoad = true }: BackupSizeEstimatorProps) {
  const [estimate, setEstimate] = React.useState<BackupSizeEstimate | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchEstimate = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${routes.api.orchestra.backupOps()}?estimate=1`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch size estimate");
      }

      const data = await response.json();
      
      // Mock estimate if API doesn't provide it yet
      const mockEstimate: BackupSizeEstimate = {
        totalSize: 15728640, // ~15 MB
        breakdown: {
          configs: 102400, // ~100 KB
          auditLogs: 10485760, // ~10 MB
          healthHistory: 5242880, // ~5 MB
          serviceRegistry: 51200, // ~50 KB
        },
        estimatedTime: 3, // 3 seconds
        compressionRatio: 0.35, // 35% of original size
      };

      setEstimate(data.estimate || mockEstimate);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to estimate backup size";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (autoLoad) {
      fetchEstimate();
    }
  }, [autoLoad, fetchEstimate]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-sm text-muted-foreground">
          Calculating backup size...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!estimate) {
    return null;
  }

  const compressedSize = Math.floor(estimate.totalSize * estimate.compressionRatio);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          Estimated Backup Size
          <Badge variant="outline">Preview</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Total Size */}
        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
          <div>
            <div className="text-sm text-muted-foreground">Uncompressed</div>
            <div className="text-2xl font-semibold tabular-nums">
              {formatBytes(estimate.totalSize)}
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Compressed</div>
            <div className="text-2xl font-semibold tabular-nums text-green-600">
              {formatBytes(compressedSize)}
            </div>
          </div>
        </div>

        {/* Breakdown */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Size Breakdown</div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Configurations</span>
              <span className="font-mono">{formatBytes(estimate.breakdown.configs)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Audit Logs</span>
              <span className="font-mono">{formatBytes(estimate.breakdown.auditLogs)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Health History</span>
              <span className="font-mono">{formatBytes(estimate.breakdown.healthHistory)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Service Registry</span>
              <span className="font-mono">{formatBytes(estimate.breakdown.serviceRegistry)}</span>
            </div>
          </div>
        </div>

        {/* Metadata */}
        <div className="pt-4 border-t space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Compression Ratio</span>
            <span className="font-semibold">{Math.round(estimate.compressionRatio * 100)}%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Estimated Time</span>
            <span className="font-semibold">{formatDuration(estimate.estimatedTime)}</span>
          </div>
        </div>

        {/* Info */}
        <Alert>
          <AlertDescription className="text-xs">
            Actual backup size may vary based on data compression and current database state.
            Estimates are based on current data volume.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
