/**
 * Orchestra Kernel NavTree Schema
 * Aggregated navigation tree structure returned by BFF.
 *
 * Zero domain knowledge — pure shape of aggregated nav data.
 */

import { z } from "zod";
import { NavGroupSchema } from "./orchestra.nav-manifest.schema";

/**
 * Service health status for navigation display.
 */
export const NAV_SERVICE_STATUS = {
  HEALTHY: "healthy",
  DEGRADED: "degraded",
  DOWN: "down",
} as const;

export type NavServiceStatus = (typeof NAV_SERVICE_STATUS)[keyof typeof NAV_SERVICE_STATUS];

const NAV_SERVICE_STATUS_VALUES = Object.values(NAV_SERVICE_STATUS) as [NavServiceStatus, ...NavServiceStatus[]];

/**
 * Service entry in the aggregated nav tree.
 * Includes service metadata, health status, and navigation groups.
 */
export const NavTreeServiceSchema = z.object({
  id: z.string(),
  label: z.string(),
  status: z.enum(NAV_SERVICE_STATUS_VALUES),
  error: z.string().optional(),
  groups: z.array(NavGroupSchema),
});

export type NavTreeService = z.infer<typeof NavTreeServiceSchema>;

/**
 * User information for navigation context.
 */
export const NavTreeUserSchema = z.object({
  id: z.string(),
  name: z.string().nullable(),
  email: z.string(),
  avatar: z.string().nullable(),
  capabilities: z.array(z.string()),
});

export type NavTreeUser = z.infer<typeof NavTreeUserSchema>;

/**
 * Tenant information for navigation context.
 */
export const NavTreeTenantSchema = z.object({
  id: z.string(),
  name: z.string(),
  plan: z.string().nullable(),
  entitlements: z.array(z.string()),
});

export type NavTreeTenant = z.infer<typeof NavTreeTenantSchema>;

/**
 * NavTree — Aggregated navigation tree returned by BFF.
 * Contains services with health status, user context, and tenant context.
 */
export const NavTreeSchema = z.object({
  services: z.array(NavTreeServiceSchema),
  user: NavTreeUserSchema.nullable(),
  tenant: NavTreeTenantSchema.nullable(),
  timestamp: z.string().datetime(),
});

export type NavTree = z.infer<typeof NavTreeSchema>;

/**
 * Shell health summary for quick status display.
 */
export const ShellHealthSchema = z.object({
  status: z.enum(NAV_SERVICE_STATUS_VALUES),
  serviceCount: z.number().int().nonnegative(),
  healthyCount: z.number().int().nonnegative(),
  degradedCount: z.number().int().nonnegative(),
  downCount: z.number().int().nonnegative(),
});

export type ShellHealth = z.infer<typeof ShellHealthSchema>;

/**
 * App domain entry — one available product domain for the shell sidebar.
 * Fetched from orchestra_app_domains; sidebar renders from this list.
 */
export const AppDomainEntrySchema = z.object({
  id: z.string(),
  label: z.string(),
  href: z.string(),
  icon: z.string(),
  description: z.string().optional(),
});

export type AppDomainEntry = z.infer<typeof AppDomainEntrySchema>;
