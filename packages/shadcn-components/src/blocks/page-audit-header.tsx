/**
 * @domain ui
 * @layer component
 * @responsibility Visual indicator for HITL audit - shows page connection status
 * 
 * NOTE: This is a development/audit component. Remove in production.
 */

"use client"

import { Badge } from "../badge"
import { CheckCircle2, Circle, AlertCircle } from "lucide-react"

export type PageStatus = "connected" | "partial" | "standalone"
export type ShellType = "app-shell" | "public" | "auth" | "account" | "none"

interface PageAuditHeaderProps {
  pageName: string
  route: string
  status: PageStatus
  shellType: ShellType
  features?: string[]
  notes?: string
}

const statusConfig = {
  connected: {
    icon: CheckCircle2,
    label: "Connected",
    variant: "default" as const,
    color: "text-green-600 dark:text-green-400",
  },
  partial: {
    icon: AlertCircle,
    label: "Partial",
    variant: "secondary" as const,
    color: "text-yellow-600 dark:text-yellow-400",
  },
  standalone: {
    icon: Circle,
    label: "Standalone",
    variant: "outline" as const,
    color: "text-gray-600 dark:text-gray-400",
  },
}

const shellConfig = {
  "app-shell": {
    label: "App Shell",
    description: "Sidebar + Header + Auth Protected",
  },
  public: {
    label: "Public Layout",
    description: "Public marketing pages",
  },
  auth: {
    label: "Auth Layout",
    description: "Authentication pages",
  },
  account: {
    label: "Account Layout",
    description: "Account settings pages",
  },
  none: {
    label: "No Shell",
    description: "Standalone page",
  },
}

export function PageAuditHeader({
  pageName,
  route,
  status,
  shellType,
  features = [],
  notes,
}: PageAuditHeaderProps) {
  const statusInfo = statusConfig[status]
  const shellInfo = shellConfig[shellType]
  const StatusIcon = statusInfo.icon

  return (
    <div className="border-b border-dashed border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20 p-3 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-3">
            <StatusIcon className={`h-5 w-5 ${statusInfo.color}`} />
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-sm">{pageName}</span>
              <Badge variant={statusInfo.variant} className="text-xs">
                {statusInfo.label}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {shellInfo.label}
              </Badge>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground space-y-1 pl-8">
            <div><strong>Route:</strong> {route}</div>
            <div><strong>Shell:</strong> {shellInfo.description}</div>
            
            {features.length > 0 && (
              <div>
                <strong>Features:</strong> {features.join(", ")}
              </div>
            )}
            
            {notes && (
              <div className="text-yellow-700 dark:text-yellow-300">
                <strong>Notes:</strong> {notes}
              </div>
            )}
          </div>
        </div>

        <div className="text-xs text-muted-foreground text-right">
          <div>HITL Audit</div>
          <div className="font-mono">{new Date().toISOString().split('T')[0]}</div>
        </div>
      </div>
    </div>
  )
}
