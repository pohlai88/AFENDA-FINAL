/**
 * Workflow Definitions
 * Predefined workflows for common administrative tasks.
 */

import { IconServer, IconDatabase, IconShield, IconSettings, IconActivity } from "@tabler/icons-react";
import { ADMIN_PATH_TO_CRUD } from "@afenda/shared/constants";
import type { Workflow } from "./SOSWorkflowVisualizer";

export const ADMIN_WORKFLOWS: Workflow[] = [
  {
    id: "troubleshoot-degraded-service",
    name: "Troubleshoot Degraded Service",
    description: "Step-by-step guide to diagnose and fix service degradation issues",
    icon: IconActivity,
    progress: 0,
    priority: "high",
    isActive: false,
    steps: [
      {
        id: "open-help",
        title: "Open the Help menu",
        description: "Click the help button to open Where am I?, Magic Tour, and quick actions.",
        status: "pending",
        targetSelector: "[data-magic-tour=help-fab]",
        actionHint: "click",
      },
      {
        id: "identify-service",
        title: "Identify Affected Service",
        description: "Locate the service showing degraded performance in the health dashboard",
        status: "pending",
        actionUrl: "/admin/health",
        resource: "health",
        crudOp: "read",
        estimatedTime: "2 min",
      },
      {
        id: "check-logs",
        title: "Review Service Logs",
        description: "Examine recent logs for error patterns or warnings",
        status: "pending",
        actionUrl: "/admin/audit",
        resource: "audit",
        crudOp: "read",
        estimatedTime: "5 min",
      },
      {
        id: "check-metrics",
        title: "Analyze Performance Metrics",
        description: "Review CPU, memory, and response time metrics",
        status: "pending",
        actionUrl: "/admin/health",
        resource: "health",
        crudOp: "read",
        estimatedTime: "3 min",
      },
      {
        id: "restart-service",
        title: "Restart Service if Needed",
        description: "Perform graceful service restart to clear temporary issues",
        status: "pending",
        estimatedTime: "1 min",
      },
      {
        id: "verify-fix",
        title: "Verify Resolution",
        description: "Confirm service health returns to normal status",
        status: "pending",
        actionUrl: "/admin/health",
        resource: "health",
        crudOp: "read",
        estimatedTime: "2 min",
      },
    ],
    nextSteps: [
      { fromStepId: "open-help", toStepId: "identify-service" },
      { fromStepId: "identify-service", toStepId: "check-logs" },
      { fromStepId: "check-logs", toStepId: "check-metrics" },
      { fromStepId: "check-metrics", toStepId: "restart-service", label: "Restart service" },
      { fromStepId: "check-metrics", toStepId: "verify-fix", label: "Skip to verify" },
      { fromStepId: "restart-service", toStepId: "verify-fix" },
    ],
  },
  {
    id: "backup-creation",
    name: "Create System Backup",
    description: "Complete workflow to create and verify system backups",
    icon: IconDatabase,
    progress: 0,
    priority: "medium",
    isActive: false,
    steps: [
      {
        id: "check-schedule",
        title: "Review Backup Schedule",
        description: "Ensure no conflicting backups are running",
        status: "pending",
        actionUrl: "/admin/backup",
        resource: "backup",
        crudOp: "read",
        estimatedTime: "1 min",
      },
      {
        id: "verify-storage",
        title: "Check Available Storage",
        description: "Confirm sufficient disk space for backup creation",
        status: "pending",
        estimatedTime: "2 min",
      },
      {
        id: "create-backup",
        title: "Initiate Backup Process",
        description: "Start full system backup with verification",
        status: "pending",
        actionUrl: "/admin/backup",
        resource: "backup",
        crudOp: "create",
        estimatedTime: "15 min",
      },
      {
        id: "verify-integrity",
        title: "Verify Backup Integrity",
        description: "Run integrity checks on created backup",
        status: "pending",
        estimatedTime: "5 min",
      },
      {
        id: "document-backup",
        title: "Document Backup Details",
        description: "Record backup ID and location for recovery",
        status: "pending",
        estimatedTime: "2 min",
      },
    ],
  },
  {
    id: "security-audit",
    name: "Security Audit Checklist",
    description: "Comprehensive security review and audit workflow",
    icon: IconShield,
    progress: 0,
    priority: "high",
    isActive: false,
    steps: [
      {
        id: "review-access-logs",
        title: "Review Access Logs",
        description: "Check for unusual login patterns or failed attempts",
        status: "pending",
        actionUrl: "/admin/audit",
        resource: "audit",
        crudOp: "read",
        estimatedTime: "10 min",
      },
      {
        id: "verify-permissions",
        title: "Verify User Permissions",
        description: "Ensure user roles and permissions are appropriate",
        status: "pending",
        actionUrl: "/admin/config",
        resource: "admin_assignments",
        crudOp: "read",
        estimatedTime: "15 min",
      },
      {
        id: "check-certificates",
        title: "Check SSL Certificates",
        description: "Verify SSL certificates are valid and not expiring soon",
        status: "pending",
        estimatedTime: "5 min",
      },
      {
        id: "scan-vulnerabilities",
        title: "Run Vulnerability Scan",
        description: "Execute security vulnerability assessment",
        status: "pending",
        estimatedTime: "20 min",
      },
      {
        id: "generate-report",
        title: "Generate Security Report",
        description: "Create comprehensive security audit report",
        status: "pending",
        actionUrl: "/admin/audit",
        resource: "audit",
        crudOp: "read",
        estimatedTime: "10 min",
      },
    ],
  },
  {
    id: "config-deployment",
    name: "Configuration Deployment",
    description: "Safe configuration changes deployment workflow",
    icon: IconSettings,
    progress: 0,
    priority: "medium",
    isActive: false,
    steps: [
      {
        id: "backup-current",
        title: "Backup Current Configuration",
        description: "Create snapshot of current configuration before changes",
        status: "pending",
        actionUrl: "/admin/config",
        resource: "config",
        crudOp: "read",
        estimatedTime: "3 min",
      },
      {
        id: "test-changes",
        title: "Test Configuration Changes",
        description: "Apply changes to staging environment for testing",
        status: "pending",
        actionUrl: "/admin/config/templates",
        resource: "config",
        crudOp: "read",
        estimatedTime: "10 min",
      },
      {
        id: "schedule-deployment",
        title: "Schedule Deployment Window",
        description: "Choose optimal time for production deployment",
        status: "pending",
        estimatedTime: "5 min",
      },
      {
        id: "deploy-changes",
        title: "Deploy to Production",
        description: "Apply configuration changes to production environment",
        status: "pending",
        actionUrl: "/admin/config",
        resource: "config",
        crudOp: "update",
        estimatedTime: "15 min",
      },
      {
        id: "monitor-impact",
        title: "Monitor System Impact",
        description: "Watch system health for 30 minutes post-deployment",
        status: "pending",
        actionUrl: "/admin/health",
        resource: "health",
        crudOp: "read",
        estimatedTime: "30 min",
      },
    ],
  },
  {
    id: "service-maintenance",
    name: "Service Maintenance Mode",
    description: "Put services in maintenance mode for updates",
    icon: IconServer,
    progress: 0,
    priority: "low",
    isActive: false,
    steps: [
      {
        id: "notify-users",
        title: "Notify Users of Maintenance",
        description: "Send maintenance notification to all users",
        status: "pending",
        estimatedTime: "5 min",
      },
      {
        id: "enable-maintenance",
        title: "Enable Maintenance Mode",
        description: "Put services in maintenance mode gracefully",
        status: "pending",
        actionUrl: "/admin/health",
        resource: "health",
        crudOp: "read",
        estimatedTime: "2 min",
      },
      {
        id: "perform-maintenance",
        title: "Perform Maintenance Tasks",
        description: "Execute planned maintenance activities",
        status: "pending",
        estimatedTime: "30 min",
      },
      {
        id: "disable-maintenance",
        title: "Disable Maintenance Mode",
        description: "Restore services to normal operation",
        status: "pending",
        actionUrl: "/admin/health",
        resource: "health",
        crudOp: "read",
        estimatedTime: "2 min",
      },
      {
        id: "verify-services",
        title: "Verify All Services",
        description: "Confirm all services are running correctly",
        status: "pending",
        actionUrl: "/admin/health",
        resource: "health",
        crudOp: "read",
        estimatedTime: "5 min",
      },
    ],
  },
];

/**
 * Get workflow by ID
 */
export function getWorkflowById(id: string): Workflow | undefined {
  return ADMIN_WORKFLOWS.find(w => w.id === id);
}

type PathStepEntry = { path: string; workflowId: string; stepId: string };

/**
 * Explicit path → workflow/step overrides when CRUD + actionUrl don't cover a path.
 * /admin/admins and /dashboard are covered by CRUD (admin_assignments/read, health/read).
 */
const PATH_TO_WORKFLOW_STEP_OVERRIDES: PathStepEntry[] = [];

/**
 * Build path → workflow/step map from (1) CRUD API, (2) step actionUrl, (3) overrides.
 * Formula: path → (resource, crudOp) from ADMIN_PATH_TO_CRUD; match steps with same resource/crudOp.
 */
function buildPathToWorkflowStep(): PathStepEntry[] {
  const entries: PathStepEntry[] = [];

  // 1) CRUD-derived: path → (resource, crudOp) → all steps that have that resource + crudOp
  for (const { path, resource, crudOp } of ADMIN_PATH_TO_CRUD) {
    for (const w of ADMIN_WORKFLOWS) {
      for (const step of w.steps) {
        if (step.resource === resource && step.crudOp === crudOp) {
          entries.push({ path, workflowId: w.id, stepId: step.id });
        }
      }
    }
  }

  // 2) actionUrl-derived: each step's actionUrl → that workflow/step
  for (const w of ADMIN_WORKFLOWS) {
    for (const step of w.steps) {
      if (step.actionUrl) {
        entries.push({ path: step.actionUrl, workflowId: w.id, stepId: step.id });
      }
    }
  }

  // 3) Overrides
  entries.push(...PATH_TO_WORKFLOW_STEP_OVERRIDES);

  // Dedupe by path + (workflowId, stepId)
  const byPath = new Map<string, PathStepEntry[]>();
  const seen = new Set<string>();
  for (const e of entries) {
    const key = `${e.path}:${e.workflowId}:${e.stepId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const list = byPath.get(e.path) ?? [];
    list.push(e);
    byPath.set(e.path, list);
  }
  const result: PathStepEntry[] = [];
  byPath.forEach(list => result.push(...list));
  return result;
}

const PATH_TO_WORKFLOW_STEP = buildPathToWorkflowStep();

/**
 * Build a workflow with the given step marked as current and progress computed.
 */
function workflowWithCurrentStep(workflow: Workflow, currentStepId: string): Workflow {
  const steps = workflow.steps.map((step, index) => {
    const stepIndex = workflow.steps.findIndex(s => s.id === currentStepId);
    let status: Workflow["steps"][0]["status"] = "pending";
    if (step.id === currentStepId) status = "current";
    else if (stepIndex >= 0 && index < stepIndex) status = "completed";
    return { ...step, status };
  });
  const completedCount = steps.filter(s => s.status === "completed").length;
  const currentIndex = steps.findIndex(s => s.status === "current");
  const progress = currentIndex >= 0 || completedCount > 0
    ? Math.round(((completedCount + (currentIndex >= 0 ? 0.5 : 0)) / steps.length) * 100)
    : 0;
  return {
    ...workflow,
    steps,
    progress: Math.min(100, progress),
    isActive: true,
  };
}

/**
 * Get workflows contextualized for the current pathname (for "Where am I?").
 * Returns workflows that include the current path as a step, with that step marked current.
 */
export function getWorkflowsForPathname(pathname: string): {
  workflows: Workflow[];
  currentWorkflowId: string | null;
} {
  const matches = PATH_TO_WORKFLOW_STEP.filter(
    m => pathname === m.path || pathname.startsWith(m.path + "/")
  );
  if (matches.length === 0) {
    return { workflows: [...ADMIN_WORKFLOWS], currentWorkflowId: null };
  }
  const seen = new Set<string>();
  const workflows: Workflow[] = [];
  const currentWorkflowId: string | null = matches[0].workflowId;
  for (const m of matches) {
    const w = getWorkflowById(m.workflowId);
    if (!w || seen.has(m.workflowId)) continue;
    seen.add(m.workflowId);
    workflows.push(workflowWithCurrentStep(w, m.stepId));
  }
  // Append any workflow that wasn't matched so "Available Workflows" still shows
  for (const w of ADMIN_WORKFLOWS) {
    if (!seen.has(w.id)) workflows.push({ ...w, isActive: false });
  }
  return { workflows, currentWorkflowId };
}

/**
 * Get active workflows based on system state (for backward compatibility).
 */
export function getActiveWorkflows(systemHealth: {
  summary?: {
    degraded?: number;
    down?: number;
  };
  status?: string;
} | null): Workflow[] {
  const active: Workflow[] = [];

  if (systemHealth?.summary && systemHealth.summary.degraded && systemHealth.summary.degraded > 0) {
    const workflow = getWorkflowById("troubleshoot-degraded-service");
    if (workflow) {
      active.push({ ...workflow, isActive: true, priority: "high" });
    }
  }

  const hasSecurityEvents = false;
  if (hasSecurityEvents) {
    const workflow = getWorkflowById("security-audit");
    if (workflow) {
      active.push({ ...workflow, isActive: true, priority: "high" });
    }
  }

  return active;
}
