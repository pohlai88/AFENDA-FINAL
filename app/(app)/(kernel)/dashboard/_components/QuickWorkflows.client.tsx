"use client";

import { ContextualMiniWorkflow } from "./ContextualMiniWorkflow";
import { createConfigBackupWorkflow, createServiceRestartWorkflow } from "./ContextualMiniWorkflow";

interface QuickWorkflowsProps {
  hasDownServices: boolean;
}

export function QuickWorkflows({ hasDownServices }: QuickWorkflowsProps) {
  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-4">Quick Workflows</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ContextualMiniWorkflow
          workflow={createConfigBackupWorkflow()}
          compact={true}
        />
        {hasDownServices && (
          <ContextualMiniWorkflow
            workflow={createServiceRestartWorkflow("Degraded Service")}
            compact={true}
          />
        )}
      </div>
    </div>
  );
}
