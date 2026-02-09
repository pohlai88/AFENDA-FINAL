# @afenda/marketing

Marketing domain package for AFENDA — Enterprise workflow orchestration platform.

## Overview

This package contains all marketing-related components, utilities, and configurations for the AFENDA public-facing website. It follows domain-driven design principles with clear separation between client and server components.

## Package Structure

```
packages/marketing/
├── src/
│   ├── component/
│   │   ├── client/          # Client-side interactive components
│   │   │   ├── afenda-icon.tsx
│   │   │   ├── marketing-header.tsx
│   │   │   ├── marketing-site-logo.tsx
│   │   │   ├── mobile-menu.tsx
│   │   │   └── index.ts
│   │   └── server/          # Server-rendered components
│   │       ├── marketing-cta.tsx
│   │       ├── marketing-features.tsx
│   │       ├── marketing-footer.tsx
│   │       ├── marketing-hero.tsx
│   │       └── index.ts
│   ├── constant/            # Domain constants (routes, config)
│   │   ├── marketing.routes.ts
│   │   ├── marketing.site-config.ts
│   │   └── index.ts
│   ├── lib/                 # Utilities
│   │   ├── marketing.cn.ts
│   │   └── index.ts
│   └── marketing.index.ts   # Main barrel export
├── package.json
├── tsconfig.json
└── README.md
```

## Installation

This is an internal workspace package. Import from the barrel:

```tsx
import { MarketingHeader, MarketingFooter, marketingRoutes } from "@afenda/marketing";
```

## Exports

| Path | Purpose |
|------|---------|
| `@afenda/marketing` | Main barrel (all public exports) |
| `@afenda/marketing/constant` | Routes and site configuration |
| `@afenda/marketing/lib` | Utility functions (`cn`) |
| `@afenda/marketing/component/client` | Client components |
| `@afenda/marketing/component/server` | Server components |

## Components

### Client Components (`src/component/client/`)

Interactive components requiring client-side JavaScript — all use `"use client"` directive.

#### `MarketingHeader`

Sticky header with navigation, theme toggle, and CTA buttons.

- Responsive navigation with mobile menu (dynamic import)
- `AnimatedThemeToggler` integration
- Consistent responsive padding (`px-4 sm:px-6 lg:px-8`)
- Accessibility-compliant with ARIA labels

```tsx
import { MarketingHeader } from "@afenda/marketing";

export default function Layout({ children }) {
  return (
    <>
      <MarketingHeader />
      {children}
    </>
  );
}
```

#### `AfendaIcon`

Official AFENDA brand icon: triangle compass with morphic E (NexusCanon · AXIS brand).

- SVG-based, uses `currentColor` for theme-aware rendering
- Accepts `className` for sizing via Tailwind

```tsx
import { AfendaIcon } from "@afenda/marketing";

<AfendaIcon className="size-6" />
```

#### `MarketingSiteLogo`

Brand logo component with link to homepage. Wraps `AfendaIcon` with site name.

#### `MobileMenu` (internal)

Responsive mobile navigation drawer. Dynamically imported by `MarketingHeader` — not exported from barrel.

### Server Components (`src/component/server/`)

Static components rendered on the server — no `"use client"` directive.

#### `MarketingHero`

Homepage hero section with headline, description, and CTA buttons.

- Centered layout with responsive typography
- Badge showing "Powered by NexusCanon Infrastructure Fabric"
- Feature indicators (Multi-tenant, RLS, PDPA Compliant)

```tsx
import { MarketingHero } from "@afenda/marketing";

export default function HomePage() {
  return <MarketingHero />;
}
```

#### `MarketingFeatures`

Feature showcase section with 6 enterprise-grade feature cards (3-column responsive grid).

#### `MarketingCta`

Call-to-action section for conversions with gradient card background.

#### `MarketingFooter`

Site footer with 6-column responsive grid, link groups, and branding.

```tsx
import { MarketingFooter } from "@afenda/marketing";

export default function Layout({ children }) {
  return (
    <>
      {children}
      <MarketingFooter />
    </>
  );
}
```

## Constants

### `marketingRoutes`

Type-safe route helpers for navigation.

```tsx
import { marketingRoutes } from "@afenda/marketing";

// UI routes (marketing-owned)
marketingRoutes.ui.home()           // "/"
marketingRoutes.ui.about()          // "/about"
marketingRoutes.ui.contact()        // "/contact"
marketingRoutes.ui.infrastructure() // "/infrastructure"
marketingRoutes.ui.docs()           // "/docs"
marketingRoutes.ui.apiDocs()        // "/api-docs"
marketingRoutes.ui.security()       // "/security"
marketingRoutes.ui.privacy()        // "/privacy"
marketingRoutes.ui.terms()          // "/terms"
marketingRoutes.ui.pdpa()           // "/pdpa"
marketingRoutes.ui.status()         // "/status"
marketingRoutes.ui.offline()        // "/offline"

// External routes (owned by other domains, referenced by marketing)
marketingRoutes.external.auth.login()     // "/login"
marketingRoutes.external.auth.register()  // "/register"
marketingRoutes.external.orchestra.root() // "/dashboard"

// API tiers (reserved paths)
marketingRoutes.api.bff  // "/api/bff/marketing"
marketingRoutes.api.v1   // "/api/v1/marketing"
marketingRoutes.api.ops  // "/api/ops/marketing"
```

### `marketingSiteConfig`

Centralized configuration for site metadata and navigation.

```tsx
import { marketingSiteConfig } from "@afenda/marketing";

marketingSiteConfig.name           // "AFENDA" (env: NEXT_PUBLIC_SITE_NAME)
marketingSiteConfig.description    // Enterprise description
marketingSiteConfig.tagline        // "MACHINA VITAE | NexusCanon"
marketingSiteConfig.appUrl         // App URL (env: NEXT_PUBLIC_APP_URL)
marketingSiteConfig.supportEmail   // "legal@nexuscanon.com"
marketingSiteConfig.navLinks       // Nav link array
marketingSiteConfig.ctaLinks       // { signIn, getStarted }
marketingSiteConfig.footerLinks    // { product, company, legal, resources }
marketingSiteConfig.social         // { twitter?, github?, linkedin? }
```

## Utilities

### `cn`

Tailwind CSS class merging utility using `clsx` + `tailwind-merge`.

```tsx
import { cn } from "@afenda/marketing";

<div className={cn("base-class", isActive && "active-class")} />
```

## Design System

### Responsive Padding

All components use consistent responsive horizontal padding:

- **Mobile** (default): `px-4` (16px)
- **Small screens** (640px+): `sm:px-6` (24px)
- **Large screens** (1024px+): `lg:px-8` (32px)

### Typography Scale

- **Hero**: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`
- **Section Heading**: `text-3xl sm:text-4xl md:text-5xl`
- **Card Title**: `text-xl`
- **Body**: `text-base` or `text-sm`
- **Caption**: `text-xs`

### Theme Support

- Full dark/light mode via `next-themes`
- Animated theme transitions using View Transition API
- `AfendaIcon` uses `currentColor` for automatic theme adaptation

## Dependencies

### Direct

- `clsx` — Class name utility
- `tailwind-merge` — Tailwind class merging

### Peer

- `next` >=14.0.0
- `react` ^19.0.0
- `react-dom` ^19.0.0

### Internal

- `@afenda/shadcn` — UI component library (Card, Button, Badge, Sheet, etc.)

## Architecture Rules

- **Brand icons**: Use `AfendaIcon` — never import from `lucide-react` in marketing pages
- **Hydration safety**: Uses `ClientSheet*` wrappers from `@afenda/shadcn` (no raw Radix)
- **No business logic**: Marketing is UI-only; all data comes from props
- **Server components by default**: Use `"use client"` only when interactivity required
- **Import from barrel**: `@afenda/marketing` — never reach into `src/`

## Contributing

When adding new components:

1. Client components -> `src/component/client/`
2. Server components -> `src/component/server/`
3. Constants -> `src/constant/`
4. Export from respective `index.ts` barrel files
5. Update this README
6. Follow `Marketing*` prefix naming convention
7. Validate: `pnpm lint && pnpm typecheck`

---

**Part of AFENDA** — Enterprise Workflow Orchestration Platform
**Powered by** NexusCanon Infrastructure Fabric
