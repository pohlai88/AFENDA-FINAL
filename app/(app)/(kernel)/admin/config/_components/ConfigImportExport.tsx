"use client";

/**
 * Config Import/Export
 * Export configurations to JSON and import with validation and conflict resolution.
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
  Alert,
  AlertDescription,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { toast } from "sonner";

interface ConfigExportData {
  version: string;
  exportedAt: string;
  exportedBy: string;
  configs: Array<{
    key: string;
    value: unknown;
    description?: string;
  }>;
}

interface ImportConflict {
  key: string;
  existingValue: unknown;
  newValue: unknown;
  resolution: "skip" | "overwrite" | "merge";
}

interface ConfigImportExportProps {
  configs?: Array<{ key: string; value: unknown; description?: string | null }>;
  trigger?: React.ReactNode;
}

export function ConfigImportExport({ configs = [], trigger }: ConfigImportExportProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"export" | "import">("export");

  // Export state
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());

  // Import state
  const [importFile, setImportFile] = React.useState<File | null>(null);
  const [importData, setImportData] = React.useState<ConfigExportData | null>(null);
  const [conflicts, setConflicts] = React.useState<ImportConflict[]>([]);
  const [isImporting, setIsImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Export functionality
  const handleExport = () => {
    const selectedConfigs = configs.filter((c) => selectedKeys.has(c.key));

    if (selectedConfigs.length === 0) {
      toast.error("Please select at least one configuration to export");
      return;
    }

    const exportData: ConfigExportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      exportedBy: "current-user", // TODO: Get from auth context
      configs: selectedConfigs.map((c) => ({
        key: c.key,
        value: c.value,
        description: c.description || undefined,
      })),
    };

    // Create and download JSON file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `config-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${selectedConfigs.length} configurations`);
  };

  const toggleKey = (key: string) => {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedKeys(new Set(configs.map((c) => c.key)));
  };

  const clearAll = () => {
    setSelectedKeys(new Set());
  };

  // Import functionality
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFile(file);
    setError(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text) as ConfigExportData;

      // Validate structure
      if (!data.version || !data.configs || !Array.isArray(data.configs)) {
        throw new Error("Invalid config export file format");
      }

      setImportData(data);

      // Detect conflicts
      const detectedConflicts: ImportConflict[] = [];
      for (const importConfig of data.configs) {
        const existing = configs.find((c) => c.key === importConfig.key);
        if (existing) {
          detectedConflicts.push({
            key: importConfig.key,
            existingValue: existing.value,
            newValue: importConfig.value,
            resolution: "skip", // Default to skip
          });
        }
      }

      setConflicts(detectedConflicts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to parse import file";
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const updateConflictResolution = (key: string, resolution: ImportConflict["resolution"]) => {
    setConflicts((prev) =>
      prev.map((c) => (c.key === key ? { ...c, resolution } : c))
    );
  };

  const handleImport = async () => {
    if (!importData) return;

    setIsImporting(true);
    setError(null);

    const toastId = toast.loading("Importing configurations...");

    try {
      let imported = 0;
      let skipped = 0;

      for (const config of importData.configs) {
        const conflict = conflicts.find((c) => c.key === config.key);

        // Skip if conflict and resolution is skip
        if (conflict && conflict.resolution === "skip") {
          skipped++;
          continue;
        }

        // Import the config
        const response = await fetch(routes.api.orchestra.configKey(config.key), {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            value: config.value,
            description: config.description,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message ?? `Failed to import ${config.key}`);
        }

        imported++;
      }

      toast.success(
        `Imported ${imported} configurations${skipped > 0 ? `, skipped ${skipped}` : ""}`,
        { id: toastId }
      );

      // Reset and close
      setImportFile(null);
      setImportData(null);
      setConflicts([]);
      setOpen(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to import configurations";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <ClientDialog open={open} onOpenChange={setOpen}>
      <ClientDialogTrigger asChild>
        {trigger || (
          <Button variant="outline">
            Import/Export
          </Button>
        )}
      </ClientDialogTrigger>
      <ClientDialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <ClientDialogHeader>
          <ClientDialogTitle>Configuration Import/Export</ClientDialogTitle>
          <ClientDialogDescription>
            Export configurations to JSON or import from a file
          </ClientDialogDescription>
        </ClientDialogHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "export" | "import")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="export">Export</TabsTrigger>
            <TabsTrigger value="import">Import</TabsTrigger>
          </TabsList>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Alert>
              <AlertDescription>
                Select configurations to export as a JSON file. You can import this file later to restore or share configurations.
              </AlertDescription>
            </Alert>

            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                {selectedKeys.size} of {configs.length} selected
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

            <div className="space-y-2 max-h-96 overflow-y-auto border rounded-lg p-4">
              {configs.map((config) => (
                <div
                  key={config.key}
                  className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded cursor-pointer"
                  onClick={() => toggleKey(config.key)}
                >
                  <input
                    type="checkbox"
                    checked={selectedKeys.has(config.key)}
                    onChange={() => toggleKey(config.key)}
                    className="cursor-pointer"
                  />
                  <code className="text-sm font-mono flex-1">{config.key}</code>
                </div>
              ))}
            </div>

            <Button onClick={handleExport} disabled={selectedKeys.size === 0} className="w-full">
              Export {selectedKeys.size} Configuration{selectedKeys.size !== 1 ? "s" : ""}
            </Button>
          </TabsContent>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Alert>
              <AlertDescription>
                Upload a JSON export file to import configurations. Conflicts will be detected and you can choose how to resolve them.
              </AlertDescription>
            </Alert>

            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                type="file"
                accept=".json"
                onChange={handleFileSelect}
                className="hidden"
                id="import-file"
              />
              <label htmlFor="import-file" className="cursor-pointer">
                <div className="space-y-2">
                  <div className="text-4xl">📁</div>
                  <div className="text-sm font-medium">
                    {importFile ? importFile.name : "Click to select JSON file"}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    or drag and drop
                  </div>
                </div>
              </label>
            </div>

            {importData && (
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">Import Preview</div>
                      <div className="text-sm text-muted-foreground">
                        {importData.configs.length} configurations found
                      </div>
                    </div>
                    <Badge variant="outline">
                      Version {importData.version}
                    </Badge>
                  </div>

                  {conflicts.length > 0 && (
                    <div className="space-y-3">
                      <div className="font-medium text-sm">
                        Conflicts Detected ({conflicts.length})
                      </div>
                      {conflicts.map((conflict) => (
                        <Card key={conflict.key} className="border-yellow-200 bg-yellow-50/50">
                          <CardContent className="p-4 space-y-2">
                            <code className="text-sm font-mono">{conflict.key}</code>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant={conflict.resolution === "skip" ? "default" : "outline"}
                                onClick={() => updateConflictResolution(conflict.key, "skip")}
                              >
                                Skip
                              </Button>
                              <Button
                                size="sm"
                                variant={conflict.resolution === "overwrite" ? "default" : "outline"}
                                onClick={() => updateConflictResolution(conflict.key, "overwrite")}
                              >
                                Overwrite
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              onClick={handleImport}
              disabled={!importData || isImporting}
              className="w-full"
            >
              {isImporting ? "Importing..." : "Import Configurations"}
            </Button>
          </TabsContent>
        </Tabs>
      </ClientDialogContent>
    </ClientDialog>
  );
}
