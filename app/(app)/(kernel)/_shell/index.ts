/**
 * App Shell barrel export.
 * Server-first shell with Client Islands.
 *
 * @domain app
 * @layer ui/shell
 */

// Server Components
export { AppShell } from "./AppShell.server";
export { SidebarServer, type SidebarServerProps } from "./Sidebar.server";
export { HeaderServer, type HeaderServerProps } from "./Header.server";

// Client Components
export { SidebarClient, type SidebarClientProps } from "./Sidebar.client";
export { HeaderClient, type HeaderClientProps } from "./Header.client";
export {
  CommandPaletteClient,
  CommandPaletteProvider,
  useCommandPalette,
  type CommandPaletteClientProps,
} from "./CommandPalette.client";
export {
  HealthIndicatorClient,
  type HealthIndicatorClientProps,
} from "./HealthIndicator.client";
export {
  OnboardingWizard,
} from "./OnboardingWizard.client";
export {
  OnboardingWizardProvider,
  useOnboarding,
} from "./OnboardingWizardProvider.client";
export {
  ContextualHelper,
} from "./ContextualHelper.client";
export { BurgerMenu } from "./BurgerMenu.client";

// Navigation Config
export {
  KERNEL_ADMIN_NAV,
  QUICK_ACCESS_NAV,
  getAllNavItems,
  getNavByDomain,
  findNavItemByHref,
  isActiveNavItem,
  type NavItemConfig,
  type NavGroupConfig,
  type DomainNavConfig,
} from "./navigation.config";
