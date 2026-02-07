/**
 * @deprecated Use @afenda/tenancy/zod instead
 * This file is a shim for backward compatibility during migration.
 */
export {
  // Enums
  TenancyBaseColors as BaseColors,
  TenancyThemeModes as ThemeModes,
  TenancyFonts as Fonts,
  TenancyBrandColors as BrandColors,
  // Schemas
  tenancyDesignSystemSettingsSchema as designSystemSettingsSchema,
  tenancyUpdateDesignSystemRequestSchema as updateDesignSystemRequestSchema,
  tenancyDesignSystemResponseSchema as designSystemResponseSchema,
  // Defaults
  DEFAULT_DESIGN_SYSTEM,
  // Types
  type TenancyBaseColor as BaseColor,
  type TenancyThemeMode as ThemeMode,
  type TenancyFont as Font,
  type TenancyBrandColor as BrandColor,
  type TenancyDesignSystemSettings as DesignSystemSettings,
  type TenancyUpdateDesignSystemRequest as UpdateDesignSystemRequest,
  type TenancyDesignSystemResponse as DesignSystemResponse,
} from "@afenda/tenancy/zod"
