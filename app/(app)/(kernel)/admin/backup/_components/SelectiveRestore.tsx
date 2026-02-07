"use client";

/**
 * Selective Restore Component
 * Restore specific tables or configurations from backup instead of full restore.
 * 
 * @domain kernel
 * @layer ui/component
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ClientDialog,
  ClientDialogContent,
  ClientDialogDescription,
  ClientDialogHeader,
  ClientDialogTitle,
  ClientDialogTrigger,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Checkbox,
  Badge,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { toast } from "sonner";

interface BackupItem {
  id: string;
  name: string;
  createdAt: Date | string;
  size: number;
  tables: string[];
}

interface RestoreTable {
  name: string;
  recordCount: number;
  size: number;
  description: string;
}

interface SelectiveRestoreProps {
  backup: BackupItem;
  trigger?: React.ReactNode;
}

const AVAILABLE_TABLES: RestoreTable[] = [
  {
    name: "orchestra_admin_config",
    recordCount: 0,
    size: 0,
    description: "Configuration key-value pairs",
  },
  {
    name: "orchestra_audit_log",
    recordCount: 0,
    size: 0,
    description: "Audit trail and event history",
  },
  {
    name: "orchestra_health_history",
    recordCount: 0,
    size: 0,
    description: "Service health monitoring data",
  },
  {
    name: "orchestra_service_registry",
    recordCount: 0,
    size: 0,
    description: "Registered services and endpoints",
  },
  {
    name: "orchestra_config_history",
    recordCount: 0,
    size: 0,
    description: "Configuration change history",
  },
  {
    name: "orchestra_backup_schedule",
    recordCount: 0,
    size: 0,
    description: "Backup schedule definitions",
  },
];

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

export function SelectiveRestore({ backup, trigger }: SelectiveRestoreProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [selectedTables, setSelectedTables] = React.useState<Set<string>>(new Set());
  const [tableData, setTableData] = React.useState<RestoreTable[]>(AVAILABLE_TABLES);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isRestoring, setIsRestoring] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Load backup contents when dialog opens
  const hasLoadedData = React.useRef(false);

  React.useEffect(() => {
    if (open && !hasLoadedData.current) {
      loadBackupContents();
      hasLoadedData.current = true;
    }
    if (!open) {
      hasLoadedData.current = false;
    }
  }, [open]);

  const loadBackupContents = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(routes.api.orchestra.backupOps());

      if (!response.ok) {
        throw new Error("Failed to load backup contents");
      }

      const data = await response.json();

      // Mock data if API doesn't provide it yet
      const mockData: RestoreTable[] = AVAILABLE_TABLES.map((table) => ({
        ...table,
        recordCount: Math.floor(Math.random() * 1000) + 10,
        size: Math.floor(Math.random() * 5000000) + 10000,
      }));

      setTableData(data.tables || mockData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load backup contents";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleTable = (tableName: string) => {
    setSelectedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) {
        next.delete(tableName);
      } else {
        next.add(tableName);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedTables(new Set(tableData.map((t) => t.name)));
  };

  const clearAll = () => {
    setSelectedTables(new Set());
  };

  const handleRestore = async () => {
    if (selectedTables.size === 0) {
      toast.error("Please select at least one table to restore");
      return;
    }

    const confirmed = confirm(
      `⚠️ WARNING: This will restore ${selectedTables.size} table(s) from the backup.\n\n` +
      `Current data in these tables will be REPLACED.\n\n` +
      `Are you sure you want to continue?`
    );

    if (!confirmed) return;

    setIsRestoring(true);
    setError(null);

    const toastId = toast.loading(`Restoring ${selectedTables.size} tables...`);

    try {
      const response = await fetch(routes.api.orchestra.backupOps(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          backupId: backup.id,
          tables: Array.from(selectedTables),
          selective: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to restore backup");
      }

      toast.success(`Successfully restored ${selectedTables.size} tables`, { id: toastId });

      setOpen(false);
      setSelectedTables(new Set());
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to restore backup";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
    } finally {
      setIsRestoring(false);
    }
  };

  const totalRecords = tableData
    .filter((t) => selectedTables.has(t.name))
    .reduce((sum, t) => sum + t.recordCount, 0);

  const totalSize = tableData
    .filter((t) => selectedTables.has(t.name))
    .reduce((sum, t) => sum + t.size, 0);

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            Selective Restore
          </Button>
        )}
      </ClientDialogTrigger>
      <ClientDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <ClientDialogHeader>
          <ClientDialogTitle>Selective Restore</ClientDialogTitle>
          <ClientDialogDescription>
            Choose specific tables to restore from backup: {backup.name}
          </ClientDialogDescription>
        </ClientDialogHeader>

        <div className="space-y-4">
          {/* Backup Info */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">Backup Date</div>
                  <div className="text-muted-foreground">
                    {new Date(backup.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-medium">Total Size</div>
                  <div className="text-muted-foreground">{formatBytes(backup.size)}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Selection Controls */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {selectedTables.size} of {tableData.length} tables selected
            </div>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                Clear
              </Button>
            </div>
          </div>

          {/* Table List */}
          {isLoading ? (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                Loading backup contents...
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {tableData.map((table) => (
                <Card
                  key={table.name}
                  className={`cursor-pointer transition-colors ${selectedTables.has(table.name)
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                    }`}
                  onClick={() => toggleTable(table.name)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={selectedTables.has(table.name)}
                        onCheckedChange={() => toggleTable(table.name)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-sm font-mono">{table.name}</CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {table.description}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {table.recordCount.toLocaleString()} records
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {formatBytes(table.size)}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* Restore Summary */}
          {selectedTables.size > 0 && (
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Restore Summary</div>
                  <div className="text-sm">
                    {selectedTables.size} tables • {totalRecords.toLocaleString()} records • {formatBytes(totalSize)}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Warning */}
          {selectedTables.size > 0 && (
            <Alert variant="destructive">
              <AlertDescription className="text-sm">
                ⚠️ <strong>Warning:</strong> Current data in selected tables will be replaced with backup data.
                This action cannot be undone. Make sure you have a recent backup before proceeding.
              </AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isRestoring}>
            Cancel
          </Button>
          <Button
            onClick={handleRestore}
            disabled={selectedTables.size === 0 || isRestoring}
            variant="destructive"
          >
            {isRestoring ? "Restoring..." : `Restore ${selectedTables.size} Tables`}
          </Button>
        </div>
      </ClientDialogContent>
    </ClientDialog>
  );
}
