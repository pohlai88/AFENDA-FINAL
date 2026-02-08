/**
 * App Shell barrel export.
 * Simplified — layout uses shadcn sidebar-07 directly.
 * Only Command Palette, Onboarding & navigation config remain here.
 *
 * @domain app
 * @layer ui/shell
 */

// Command Palette
export {
  CommandPaletteClient,
  CommandPaletteProvider,
  useCommandPalette,
  type CommandPaletteClientProps,
} from "./CommandPalette.client";

// Onboarding
export { OnboardingWizard } from "./OnboardingWizard.client";
export {
  OnboardingWizardProvider,
  useOnboarding,
} from "./OnboardingWizardProvider.client";

// Contextual Helper
export { ContextualHelper } from "./ContextualHelper.client";

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
