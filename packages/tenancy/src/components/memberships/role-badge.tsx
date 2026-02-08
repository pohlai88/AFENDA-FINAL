/**
 * @domain tenancy
 * @layer components
 * @responsibility Display role badge with color coding
 */

"use client";

import * as React from "react";
import { Badge } from "@afenda/shadcn";

export interface RoleBadgeProps {
  role: string;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  const roleNormalized = role.toLowerCase();
  
  const variant = 
    roleNormalized === "owner" ? "default" :
    roleNormalized === "admin" ? "secondary" :
    "outline";

  const roleDisplay = 
    roleNormalized === "owner" ? "Owner" :
    roleNormalized === "admin" ? "Admin" :
    roleNormalized === "member" ? "Member" :
    role;

  return (
    <Badge variant={variant} className={className}>
      {roleDisplay}
    </Badge>
  );
}
