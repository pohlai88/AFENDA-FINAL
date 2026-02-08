/**
 * @domain tenancy
 * @layer components
 * @responsibility Display invitation status badge
 */

"use client";

import * as React from "react";
import { Badge } from "@afenda/shadcn";
import { 
  IconMailCheck, 
  IconMailCancel, 
  IconMailOff, 
  IconClock,
  IconCheck,
} from "@tabler/icons-react";

export interface InvitationStatusBadgeProps {
  status: string;
  className?: string;
  showIcon?: boolean;
}

export function InvitationStatusBadge({ 
  status, 
  className,
  showIcon = true,
}: InvitationStatusBadgeProps) {
  const statusNormalized = status.toLowerCase();
  
  const variant = 
    statusNormalized === "accepted" ? "default" :
    statusNormalized === "pending" ? "secondary" :
    statusNormalized === "expired" ? "destructive" :
    statusNormalized === "cancelled" ? "outline" :
    "outline";

  const statusDisplay = 
    statusNormalized === "pending" ? "Pending" :
    statusNormalized === "accepted" ? "Accepted" :
    statusNormalized === "declined" ? "Declined" :
    statusNormalized === "cancelled" ? "Cancelled" :
    statusNormalized === "expired" ? "Expired" :
    status;

  const Icon = 
    statusNormalized === "accepted" ? IconCheck :
    statusNormalized === "pending" ? IconClock :
    statusNormalized === "expired" ? IconMailOff :
    statusNormalized === "cancelled" ? IconMailCancel :
    statusNormalized === "declined" ? IconMailCancel :
    IconMailCheck;

  return (
    <Badge variant={variant} className={className}>
      {showIcon && <Icon className="mr-1 h-3 w-3" />}
      {statusDisplay}
    </Badge>
  );
}
