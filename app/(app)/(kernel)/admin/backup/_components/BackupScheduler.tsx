"use client";

/**
 * Backup Scheduler Component
 * Schedule automated backups with visual cron expression builder.
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
  CardHeader,
  CardTitle,
  Label,
  Input,
  ClientSelect,
  ClientSelectContent,
  ClientSelectItem,
  ClientSelectTrigger,
  ClientSelectValue,
  Badge,
  Alert,
  AlertDescription,
} from "@afenda/shadcn";
import { routes } from "@afenda/shared/constants";
import { toast } from "sonner";

interface CronSchedule {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

interface BackupSchedule {
  id: string;
  name: string;
  cronExpression: string;
  enabled: boolean;
  lastRun?: Date | string;
  nextRun?: Date | string;
}

interface BackupSchedulerProps {
  schedules?: BackupSchedule[];
  trigger?: React.ReactNode;
}

/**
 * Parse cron expression into components.
 */
function parseCronExpression(cron: string): CronSchedule {
  const parts = cron.split(" ");
  return {
    minute: parts[0] || "*",
    hour: parts[1] || "*",
    dayOfMonth: parts[2] || "*",
    month: parts[3] || "*",
    dayOfWeek: parts[4] || "*",
  };
}

/**
 * Get human-readable description of cron schedule.
 */
function describeCronSchedule(cron: string): string {
  const schedule = parseCronExpression(cron);

  // Common patterns
  if (cron === "0 0 * * *") return "Daily at midnight";
  if (cron === "0 2 * * *") return "Daily at 2:00 AM";
  if (cron === "0 0 * * 0") return "Weekly on Sunday at midnight";
  if (cron === "0 0 1 * *") return "Monthly on the 1st at midnight";
  if (cron === "0 */6 * * *") return "Every 6 hours";
  if (cron === "0 */12 * * *") return "Every 12 hours";

  // Build description
  let description = "At ";

  // Hour and minute
  if (schedule.hour === "*" && schedule.minute === "*") {
    description = "Every minute";
  } else if (schedule.hour === "*") {
    description += `minute ${schedule.minute} of every hour`;
  } else if (schedule.minute === "0") {
    description += `${schedule.hour}:00`;
  } else {
    description += `${schedule.hour}:${schedule.minute}`;
  }

  // Day of week
  if (schedule.dayOfWeek !== "*") {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    description += ` on ${days[parseInt(schedule.dayOfWeek)] || schedule.dayOfWeek}`;
  }

  // Day of month
  if (schedule.dayOfMonth !== "*") {
    description += ` on day ${schedule.dayOfMonth}`;
  }

  // Month
  if (schedule.month !== "*") {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    description += ` in ${months[parseInt(schedule.month) - 1] || schedule.month}`;
  }

  return description;
}

export function BackupScheduler({ schedules = [], trigger }: BackupSchedulerProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [scheduleName, setScheduleName] = React.useState("");
  const [preset, setPreset] = React.useState("daily");
  const [customCron, setCustomCron] = React.useState("0 0 * * *");
  const [isCustom, setIsCustom] = React.useState(false);
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const presets = {
    daily: "0 0 * * *",
    "daily-2am": "0 2 * * *",
    "every-6h": "0 */6 * * *",
    "every-12h": "0 */12 * * *",
    weekly: "0 0 * * 0",
    monthly: "0 0 1 * *",
  };

  const currentCron = isCustom ? customCron : presets[preset as keyof typeof presets];

  const handleCreateSchedule = async () => {
    if (!scheduleName.trim()) {
      setError("Please enter a schedule name");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const toastId = toast.loading("Creating backup schedule...");

    try {
      const response = await fetch(routes.api.orchestra.backupOps(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: scheduleName,
          cronExpression: currentCron,
          enabled: true,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to create schedule");
      }

      toast.success(`Schedule "${scheduleName}" created successfully`, { id: toastId });

      // Reset form
      setScheduleName("");
      setPreset("daily");
      setIsCustom(false);
      setOpen(false);
      router.refresh();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to create schedule";
      toast.error(errorMessage, { id: toastId });
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSchedule = async (scheduleId: string, enabled: boolean) => {
    const toastId = toast.loading(`${enabled ? "Enabling" : "Disabling"} schedule...`);

    try {
      const response = await fetch(`${routes.api.orchestra.backupOps()}/schedule/${scheduleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled }),
      });

      if (!response.ok) {
        throw new Error("Failed to update schedule");
      }

      toast.success(`Schedule ${enabled ? "enabled" : "disabled"}`, { id: toastId });
      router.refresh();
    } catch (_err) {
      toast.error("Failed to update schedule", { id: toastId });
    }
  };

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;

    const toastId = toast.loading("Deleting schedule...");

    try {
      const response = await fetch(`${routes.api.orchestra.backupOps()}/schedule/${scheduleId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error?.message ?? "Failed to delete schedule");
      }

      toast.success("Schedule deleted", { id: toastId });
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete schedule", { id: toastId });
    }
  };

  return (
    <div className="space-y-4">
      {/* Existing Schedules */}
      {schedules.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">Backup Schedules</h3>
          {schedules.map((schedule) => (
            <Card key={schedule.id}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base flex items-center gap-2">
                      {schedule.name}
                      <Badge variant={schedule.enabled ? "default" : "secondary"}>
                        {schedule.enabled ? "Active" : "Disabled"}
                      </Badge>
                    </CardTitle>
                    <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                      <div>{describeCronSchedule(schedule.cronExpression)}</div>
                      <div className="font-mono text-xs">{schedule.cronExpression}</div>
                      {schedule.nextRun && (
                        <div className="text-xs">
                          Next run: {new Date(schedule.nextRun).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleToggleSchedule(schedule.id, !schedule.enabled)}
                    >
                      {schedule.enabled ? "Disable" : "Enable"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteSchedule(schedule.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

      {/* Create Schedule Dialog */}
      <ClientDialog open={open} onOpenChange={setOpen}>
        <ClientDialogTrigger asChild>
          {trigger || (
            <Button>
              Create Backup Schedule
            </Button>
          )}
        </ClientDialogTrigger>
        <ClientDialogContent className="max-w-2xl">
          <ClientDialogHeader>
            <ClientDialogTitle>Create Backup Schedule</ClientDialogTitle>
            <ClientDialogDescription>
              Schedule automated backups using cron expressions
            </ClientDialogDescription>
          </ClientDialogHeader>

          <div className="space-y-6">
            {/* Schedule Name */}
            <div className="space-y-2">
              <Label htmlFor="name">Schedule Name</Label>
              <Input
                id="name"
                value={scheduleName}
                onChange={(e) => setScheduleName(e.target.value)}
                placeholder="e.g., Daily Production Backup"
              />
            </div>

            {/* Preset or Custom */}
            <div className="space-y-2">
              <Label>Schedule Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={!isCustom ? "default" : "outline"}
                  onClick={() => setIsCustom(false)}
                  className="flex-1"
                >
                  Preset
                </Button>
                <Button
                  variant={isCustom ? "default" : "outline"}
                  onClick={() => setIsCustom(true)}
                  className="flex-1"
                >
                  Custom Cron
                </Button>
              </div>
            </div>

            {/* Preset Selection */}
            {!isCustom && (
              <div className="space-y-2">
                <Label>Frequency</Label>
                <ClientSelect value={preset} onValueChange={setPreset}>
                  <ClientSelectTrigger>
                    <ClientSelectValue />
                  </ClientSelectTrigger>
                  <ClientSelectContent>
                    <ClientSelectItem value="daily">Daily at midnight</ClientSelectItem>
                    <ClientSelectItem value="daily-2am">Daily at 2:00 AM</ClientSelectItem>
                    <ClientSelectItem value="every-6h">Every 6 hours</ClientSelectItem>
                    <ClientSelectItem value="every-12h">Every 12 hours</ClientSelectItem>
                    <ClientSelectItem value="weekly">Weekly (Sunday)</ClientSelectItem>
                    <ClientSelectItem value="monthly">Monthly (1st day)</ClientSelectItem>
                  </ClientSelectContent>
                </ClientSelect>
              </div>
            )}

            {/* Custom Cron */}
            {isCustom && (
              <div className="space-y-2">
                <Label htmlFor="cron">Cron Expression</Label>
                <Input
                  id="cron"
                  value={customCron}
                  onChange={(e) => setCustomCron(e.target.value)}
                  placeholder="0 0 * * *"
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Format: minute hour day month day-of-week
                </p>
              </div>
            )}

            {/* Preview */}
            <Alert>
              <AlertDescription>
                <div className="space-y-1">
                  <div className="font-medium">Schedule Preview</div>
                  <div className="text-sm">{describeCronSchedule(currentCron)}</div>
                  <div className="text-xs font-mono text-muted-foreground">
                    {currentCron}
                  </div>
                </div>
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSchedule} disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Schedule"}
            </Button>
          </div>
        </ClientDialogContent>
      </ClientDialog>
    </div>
  );
}
