/**
 * @domain tenancy
 * @layer zod
 * @responsibility Design system API contract schemas
 */

import { z } from "zod";

export const TenancyBaseColors = z.enum([
  "stone",
  "gray",
  "zinc",
  "slate",
  "neutral",
]);
export type TenancyBaseColor = z.infer<typeof TenancyBaseColors>;

export const TenancyThemeModes = z.enum(["light", "dark", "system"]);
export type TenancyThemeMode = z.infer<typeof TenancyThemeModes>;

export const TenancyFonts = z.enum(["figtree", "inter", "system"]);
export type TenancyFont = z.infer<typeof TenancyFonts>;

export const TenancyBrandColors = z.enum([
  "emerald",
  "blue",
  "violet",
  "rose",
  "orange",
]);
export type TenancyBrandColor = z.infer<typeof TenancyBrandColors>;

export const tenancyDesignSystemSettingsSchema = z.object({
  style: z.string().optional(),
  baseColor: TenancyBaseColors.optional(),
  brandColor: TenancyBrandColors.optional(),
  theme: TenancyThemeModes.optional(),
  menuColor: z.string().optional(),
  menuAccent: z.string().optional(),
  menuColorLight: z.string().optional(),
  menuColorDark: z.string().optional(),
  menuAccentLight: z.string().optional(),
  menuAccentDark: z.string().optional(),
  font: TenancyFonts.optional(),
  radius: z.number().min(0).max(1.5).optional(),
});

export type TenancyDesignSystemSettings = z.infer<
  typeof tenancyDesignSystemSettingsSchema
>;

export const tenancyUpdateDesignSystemRequestSchema =
  tenancyDesignSystemSettingsSchema;

export const tenancyDesignSystemResponseSchema = z.object({
  tenantId: z.string(),
  settings: tenancyDesignSystemSettingsSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TenancyDesignSystemResponse = z.infer<
  typeof tenancyDesignSystemResponseSchema
>;

export const DEFAULT_DESIGN_SYSTEM: TenancyDesignSystemSettings = {
  style: "new-york",
  baseColor: "stone",
  brandColor: "emerald",
  theme: "system",
  font: "figtree",
  radius: 0.625,
};
