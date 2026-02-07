/**
 * @domain tenancy
 * @layer zod
 * @responsibility Design system API contract schemas
 */

import { z } from "zod"

// ============ Available Options ============
export const TenancyBaseColors = z.enum(["stone", "gray", "zinc", "slate", "neutral"])
export type TenancyBaseColor = z.infer<typeof TenancyBaseColors>

export const TenancyThemeModes = z.enum(["light", "dark", "system"])
export type TenancyThemeMode = z.infer<typeof TenancyThemeModes>

export const TenancyFonts = z.enum(["figtree", "inter", "system"])
export type TenancyFont = z.infer<typeof TenancyFonts>

export const TenancyBrandColors = z.enum(["emerald", "blue", "violet", "rose", "orange"])
export type TenancyBrandColor = z.infer<typeof TenancyBrandColors>

// ============ Design System Settings ============
export const tenancyDesignSystemSettingsSchema = z.object({
  style: z.string().optional().describe("shadcn style variant (e.g., 'new-york')"),
  baseColor: TenancyBaseColors.optional().describe("Base neutral color palette"),
  brandColor: TenancyBrandColors.optional().describe("Brand (primary) color palette"),
  theme: TenancyThemeModes.optional().describe("Theme mode preference"),
  // Back-compat (applies to both modes)
  menuColor: z.string().optional().describe("Custom menu background color (OKLCH)"),
  menuAccent: z.string().optional().describe("Custom menu accent color (OKLCH)"),
  // Per-mode overrides (take precedence over menuColor/menuAccent)
  menuColorLight: z.string().optional().describe("Light mode menu background color (OKLCH)"),
  menuColorDark: z.string().optional().describe("Dark mode menu background color (OKLCH)"),
  menuAccentLight: z.string().optional().describe("Light mode menu accent color (OKLCH)"),
  menuAccentDark: z.string().optional().describe("Dark mode menu accent color (OKLCH)"),
  font: TenancyFonts.optional().describe("Primary font family"),
  radius: z.number().min(0).max(1.5).optional().describe("Border radius scale (rem)"),
})

export type TenancyDesignSystemSettings = z.infer<typeof tenancyDesignSystemSettingsSchema>

// ============ Request/Response Schemas ============
export const tenancyUpdateDesignSystemRequestSchema = tenancyDesignSystemSettingsSchema

export type TenancyUpdateDesignSystemRequest = z.infer<typeof tenancyUpdateDesignSystemRequestSchema>

export const tenancyDesignSystemResponseSchema = z.object({
  tenantId: z.string(),
  settings: tenancyDesignSystemSettingsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export type TenancyDesignSystemResponse = z.infer<typeof tenancyDesignSystemResponseSchema>

// ============ Defaults ============
export const DEFAULT_DESIGN_SYSTEM: TenancyDesignSystemSettings = {
  style: "new-york",
  baseColor: "stone",
  brandColor: "emerald",
  theme: "system",
  font: "figtree",
  radius: 0.625,
}
