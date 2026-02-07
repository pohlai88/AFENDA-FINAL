/**
 * @domain shared
 * @layer ui
 * @responsibility Central export point for shadcn block templates
 * @owner afenda/shadcn
 * @dependencies
 * - shadcn/ui primitives (internal via local copies)
 * @exports
 * - ERP-ready shadcn blocks (dashboards, sidebars, auth, charts, calendars)
 * @note
 * - Internal primitives (button, input, sidebar, etc.) are NOT exported
 * - These are local dependencies for blocks to remain self-contained
 * - Use parent-level exports from ../index.ts for primitives
 */

// ============================================================================
// DASHBOARD & LAYOUT BLOCKS
// ============================================================================

export * from "./app-sidebar"
export * from "./site-header"
export * from "./section-cards"
export * from "./sidebar-left"
export * from "./sidebar-right"
export * from "./sidebar-opt-in-form"
export * from "./settings-dialog"

// ============================================================================
// NAVIGATION BLOCKS
// ============================================================================

export * from "./nav-actions"
export * from "./nav-documents"
export * from "./nav-favorites"
export * from "./nav-main"
export * from "./nav-progress-bar"
export * from "./nav-projects"
export * from "./nav-secondary"
export * from "./nav-user"
export * from "./nav-workspaces"
export * from "./search-form"
export * from "./team-switcher"
export * from "./version-switcher"

// ============================================================================
// AUTHENTICATION BLOCKS
// ============================================================================

export * from "./login-form"
export * from "./signup-form"
export * from "./otp-form"

// ============================================================================
// DATA & TABLE BLOCKS
// ============================================================================

export * from "./data-table"

// ============================================================================
// CALENDAR BLOCKS (Default Export Re-exports)
// ============================================================================

export { default as Calendar01 } from "./calendar-01"
export { default as Calendar02 } from "./calendar-02"
export { default as Calendar03 } from "./calendar-03"
export { default as Calendar04 } from "./calendar-04"
export { default as Calendar05 } from "./calendar-05"
export { default as Calendar10 } from "./calendar-10"
export { default as Calendar22 } from "./calendar-22"
export { default as Calendar23 } from "./calendar-23"
export * from "./calendars"
export { DatePicker as BlocksDatePicker } from "./date-picker"

// ============================================================================
// CHART BLOCKS (Explicit exports to avoid description const conflicts)
// ============================================================================

export { ChartAreaDefault } from "./chart-area-default"
export { ChartAreaInteractive } from "./chart-area-interactive"
export { ChartBarDefault } from "./chart-bar-default"
export { ChartLineDefault } from "./chart-line-default"
export { ChartPieDonut } from "./chart-pie-donut"
export { ChartRadarDefault } from "./chart-radar-default"
export { ChartRadialSimple } from "./chart-radial-simple"
export { ChartTooltipAdvanced } from "./chart-tooltip-advanced"

// ============================================================================
// APPLICATION-SPECIFIC BLOCKS
// ============================================================================

export * from "./component-example"
export * from "./domain-menu"
export * from "./page-audit-header"
export * from "./pwa-install-prompt"
export * from "./recurrence-editor"
export * from "./theme-provider"