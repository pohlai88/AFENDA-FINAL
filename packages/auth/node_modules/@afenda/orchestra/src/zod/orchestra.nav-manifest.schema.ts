/**
 * Orchestra Kernel NavManifest Schema
 * Contract for service navigation manifests.
 *
 * Zero domain knowledge — services declare their nav structure,
 * kernel validates and aggregates.
 */

import { z } from "zod";

/**
 * Navigation item badge configuration.
 * Supports dot indicators or count badges with optional polling source.
 */
export const NavBadgeSchema = z.object({
  type: z.enum(["dot", "count"]),
  source: z.string().optional(), // endpoint to poll for count
});

export type NavBadge = z.infer<typeof NavBadgeSchema>;

/**
 * Single navigation item within a group.
 */
export const NavItemSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  href: z.string().min(1),
  icon: z.string().optional(), // icon name from @tabler/icons-react
  capability: z.string().optional(), // required capability to see this item
  badge: NavBadgeSchema.optional(),
});

export type NavItem = z.infer<typeof NavItemSchema>;

/**
 * Navigation group containing related items.
 */
export const NavGroupSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  items: z.array(NavItemSchema),
});

export type NavGroup = z.infer<typeof NavGroupSchema>;

/**
 * NavManifestV1 — Service navigation manifest contract.
 * Each domain service exposes this at their manifest endpoint.
 * BFF aggregates and validates these into a unified nav tree.
 */
export const NavManifestV1Schema = z.object({
  serviceId: z.string().min(1),
  version: z.literal("v1"),
  groups: z.array(NavGroupSchema),
});

export type NavManifestV1 = z.infer<typeof NavManifestV1Schema>;

/**
 * Validate a manifest against the V1 schema.
 * Returns parsed data on success, throws ZodError on failure.
 */
export function parseNavManifest(data: unknown): NavManifestV1 {
  return NavManifestV1Schema.parse(data);
}

/**
 * Safe validate a manifest against the V1 schema.
 * Returns result object with success flag.
 */
export function safeParseNavManifest(data: unknown) {
  return NavManifestV1Schema.safeParse(data);
}
