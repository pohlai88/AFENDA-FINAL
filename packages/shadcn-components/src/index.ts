/**
 * @domain shared
 * @layer ui
 * @responsibility Central export point for all shadcn/ui components and custom extensions
 * @owner afenda/shadcn
 * @dependencies
 * - radix-ui (external)
 * - @/lib/utils
 * @exports
 * - All shadcn/ui components
 * - Custom component extensions
 * - shadcn blocks (via ./blocks)
 */

// ============================================================================
// OFFICIAL SHADCN/UI COMPONENTS (Alphabetical)
// ============================================================================

export * from "./accordion"
export * from "./alert"
export * from "./alert-dialog"
export * from "./aspect-ratio"
export * from "./avatar"
export * from "./badge"
export * from "./breadcrumb"
export * from "./button"
export * from "./button-group"
export * from "./calendar"
export * from "./card"
export * from "./carousel"
export * from "./chart"
export * from "./checkbox"
export * from "./collapsible"
export * from "./combobox"
export * from "./command"
export * from "./context-menu"
export * from "./dialog"
export * from "./drawer"
export * from "./dropdown-menu"
export * from "./empty"
export * from "./field"
export * from "./form"
export * from "./hover-card"
export * from "./input"
export * from "./input-group"
export * from "./input-otp"
export * from "./item"
export * from "./kbd"
export * from "./label"
export * from "./menubar"
export * from "./native-select"
export * from "./navigation-menu"
export * from "./pagination"
export * from "./popover"
export * from "./progress"
export * from "./radio-group"
// export * from "./resizable" // Removed - use bento-grid for layout instead
export * from "./scroll-area"
export * from "./select"
export * from "./separator"
export * from "./sheet"
export * from "./sidebar"
export * from "./skeleton"
export * from "./slider"
export * from "./sonner"
export * from "./spinner"
export * from "./switch"
export * from "./table"
export * from "./tabs"
export * from "./textarea"
export * from "./toggle"
export * from "./toggle-group"
export * from "./tooltip"
export * from "./data-table";
export * from "./data-table-column-header";
export * from "./data-table-pagination";
export * from "./data-table-toolbar";
export * from "./data-table-view-options";
export * from "./data-table-faceted-filter";
export * from "./data-table-virtualized";
export * from "./data-table-mobile-card";
export * from "./data-table-export-excel";
export * from "./data-table-export-pdf";
export * from "./data-table-filter-presets";
export * from "./data-table-column-reorder";
export * from "./data-table-column-pinning";
export * from "./accessibility-skip-link";
export * from "./accessibility-focus-trap";

// ============================================================================
// HOOKS & UTILITIES
// ============================================================================

export * from "./hooks"
export * from "./lib"

// ============================================================================
// SSR HYDRATION HELPERS
// Utilities to prevent Radix UI aria-controls hydration mismatches
// ============================================================================

export * from "./client-only"
export * from "./client-radix"

// ============================================================================
// CUSTOM COMPONENTS (Extended/Composed - via barrel)
// ============================================================================

export * from "./custom"

// ============================================================================
// SHADCN BLOCKS (ERP-READY TEMPLATES)
// ============================================================================

// Re-export blocks but exclude DataTable to avoid duplicate export
export {
    // Dashboard & Layout
    AppSidebar,
    SiteHeader,
    SectionCards,
    SidebarLeft,
    SidebarRight,
    SidebarOptInForm,
    SettingsDialog,
    // Navigation
    NavActions,
    NavDocuments,
    NavFavorites,
    NavMain,
    NavProgressBar,
    NavProjects,
    NavSecondary,
    NavUser,
    NavWorkspaces,
    SearchForm,
    TeamSwitcher,
    VersionSwitcher,
    // Authentication
    LoginForm,
    SignupForm,
    OTPForm,
    // Calendars
    Calendar01,
    Calendar02,
    Calendar03,
    Calendar04,
    Calendar05,
    Calendar10,
    Calendar22,
    Calendar23,
    BlocksDatePicker,
    // Charts
    ChartAreaDefault,
    ChartAreaInteractive,
    ChartBarDefault,
    ChartLineDefault,
    ChartPieDonut,
    ChartRadarDefault,
    ChartRadialSimple,
    ChartTooltipAdvanced,
    // Application-specific
    ComponentExample,
    DomainMenu,
    PageAuditHeader,
    PWAInstallPrompt,
    RecurrenceEditor,
    ThemeProvider,
} from "./blocks"

// ============================================================================
// EXAMPLE COMPONENTS (For Documentation/Testing)
// ============================================================================

export * from "./example"
