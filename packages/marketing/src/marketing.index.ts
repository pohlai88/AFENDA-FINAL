// marketing domain barrel exports
// Import from "@afenda/marketing" to get all domain exports

// Constants (routes, config)
export { marketingRoutes } from "./constant/marketing.routes";
export { marketingSiteConfig } from "./constant/marketing.site-config";
export type { NavLink, SiteConfig } from "./constant/marketing.site-config";

// Lib utilities
export { cn } from "./lib/marketing.cn";

// Client components
export { AfendaIcon } from "./component/client/afenda-icon";
export { MarketingHeader } from "./component/client/marketing-header";
export { MarketingSiteLogo } from "./component/client/marketing-site-logo";

// Server components
export { MarketingCta } from "./component/server/marketing-cta";
export { MarketingFeatures } from "./component/server/marketing-features";
export { MarketingFooter } from "./component/server/marketing-footer";
export { MarketingHero } from "./component/server/marketing-hero";
