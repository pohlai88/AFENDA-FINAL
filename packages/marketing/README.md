# @afenda/marketing

Marketing domain package for AFENDA - Enterprise workflow orchestration platform.

## Overview

This package contains all marketing-related components, utilities, and configurations for the AFENDA public-facing website. It follows domain-driven design principles with clear separation between client and server components.

## Package Structure

```
packages/marketing/
├── src/
│   ├── component/
│   │   ├── client/          # Client-side React components
│   │   └── server/          # Server-side React components
│   ├── lib/                 # Utilities and configurations
│   └── marketing.index.ts   # Main barrel export
├── package.json
└── README.md
```

## Installation

This is an internal workspace package. Import it in your Next.js app:

```tsx
import { MarketingHeader, MarketingFooter } from "@afenda/marketing";
```

## Components

### Client Components

Located in `src/component/client/` - Interactive components requiring client-side JavaScript.

#### `MarketingHeader`
Sticky header with navigation, theme toggle, and CTA buttons.

**Features:**
- Responsive navigation with mobile menu
- Animated theme switcher (View Transition API)
- Optimized horizontal padding (16px mobile, 24px tablet, 32px desktop)
- Accessibility-compliant with ARIA labels

**Usage:**
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

#### `MarketingSiteLogo`
Brand logo component with link to homepage.

#### `AfendaIcon`
SVG icon component for the AFENDA brand mark.

#### `MobileMenu`
Responsive mobile navigation drawer (dynamically imported).

#### `MarketingCard`
Reusable card component for marketing content.

### Server Components

Located in `src/component/server/` - Static components rendered on the server.

#### `MarketingHero`
Homepage hero section with headline, description, and CTA buttons.

**Features:**
- Centered layout with responsive typography
- Badge showing "Powered by NexusCanon Infrastructure Fabric"
- Feature indicators (Multi-tenant, RLS, PDPA Compliant)
- Responsive padding (16px/24px/32px)

**Usage:**
```tsx
import { MarketingHero } from "@afenda/marketing";

export default function HomePage() {
  return <MarketingHero />;
}
```

#### `MarketingFeatures`
Feature showcase section with icon cards.

**Features:**
- 6 enterprise-grade features
- 3-column grid layout (responsive)
- Icon-based visual hierarchy
- Hover effects with shadow transitions

**Usage:**
```tsx
import { MarketingFeatures } from "@afenda/marketing";

export default function HomePage() {
  return <MarketingFeatures className="bg-muted/30" />;
}
```

#### `MarketingCta`
Call-to-action section for conversions.

**Features:**
- Prominent CTA buttons (Start Free Trial, Contact Sales)
- Card-based layout with gradient background
- Trust indicators

#### `MarketingFooter`
Site footer with navigation links and branding.

**Features:**
- 6-column responsive grid layout
- Link groups: Product, Company, Legal, Resources
- Copyright and brand tagline
- Optimized horizontal padding (16px/24px/32px)

**Usage:**
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

## Utilities

### `cn` - Class Name Utility
Tailwind CSS class merging utility using `clsx` and `tailwind-merge`.

```tsx
import { cn } from "@afenda/marketing";

<div className={cn("base-class", isActive && "active-class")} />
```

### `marketingRoutes` - Route Configuration
Type-safe route helpers for navigation.

```tsx
import { marketingRoutes } from "@afenda/marketing";

// UI routes
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

// External routes
marketingRoutes.external.auth.login()    // "/auth/login"
marketingRoutes.external.auth.register() // "/auth/register"
marketingRoutes.external.orchestra.root() // "/orchestra"
```

### `marketingSiteConfig` - Site Configuration
Centralized configuration for site metadata and navigation.

```tsx
import { marketingSiteConfig } from "@afenda/marketing";

marketingSiteConfig.name           // "AFENDA"
marketingSiteConfig.description    // Site description
marketingSiteConfig.tagline        // "Enterprise Workflow Orchestration"
marketingSiteConfig.supportEmail   // Support email address
marketingSiteConfig.navLinks       // Navigation links array
marketingSiteConfig.footerLinks    // Footer links object
marketingSiteConfig.ctaLinks       // CTA button links
```

## Design System

### Responsive Padding
All components use consistent responsive horizontal padding:

- **Mobile** (default): `px-4` (16px)
- **Small screens** (640px+): `sm:px-6` (24px)
- **Large screens** (1024px+): `lg:px-8` (32px)

### Theme Support
- Full dark/light mode support via `next-themes`
- Animated theme transitions using View Transition API
- Graceful fallback for unsupported browsers

### Typography Scale
- **Hero**: `text-4xl sm:text-5xl md:text-6xl lg:text-7xl`
- **Section Heading**: `text-3xl sm:text-4xl md:text-5xl`
- **Card Title**: `text-xl` or `text-base`
- **Body**: `text-base` or `text-sm`
- **Caption**: `text-xs`

## Dependencies

### Direct Dependencies
- `clsx` - Class name utility
- `tailwind-merge` - Tailwind class merging

### Peer Dependencies
- `next` ≥14.0.0
- `react` ^19.0.0
- `react-dom` ^19.0.0
- `lucide-react` ≥0.400.0

### Internal Dependencies
- `@afenda/shadcn` - UI component library

## Architecture

### Domain Ownership
This package follows the **domain-driven architecture** principle:
- Marketing domain owns all marketing-related UI components
- No cross-domain component imports (use composition)
- Clear separation between client and server components

### Component Guidelines
1. **Server Components by Default** - Use server components unless interactivity is required
2. **Client Components** - Mark with `"use client"` directive only when needed
3. **Accessibility** - All components include proper ARIA labels and semantic HTML
4. **Responsive Design** - Mobile-first approach with progressive enhancement
5. **Type Safety** - Full TypeScript support with proper prop types

## Best Practices

### Importing Components
```tsx
// ✅ Good - Import from barrel export
import { MarketingHeader, MarketingFooter } from "@afenda/marketing";

// ❌ Bad - Direct file imports
import { MarketingHeader } from "@afenda/marketing/src/component/client/marketing-header";
```

### Using Routes
```tsx
// ✅ Good - Type-safe route helpers
import { marketingRoutes } from "@afenda/marketing";
<Link href={marketingRoutes.ui.about()}>About</Link>

// ❌ Bad - Hardcoded strings
<Link href="/about">About</Link>
```

### Styling Components
```tsx
// ✅ Good - Use cn utility for conditional classes
import { cn } from "@afenda/marketing";
<div className={cn("base-class", isActive && "active-class")} />

// ❌ Bad - String concatenation
<div className={`base-class ${isActive ? "active-class" : ""}`} />
```

## Recent Updates

### v0.1.0 (February 2026)
- ✨ Added `AnimatedThemeToggler` with View Transition API support
- 🎨 Optimized responsive horizontal padding across all components
- ♿ Enhanced accessibility with proper ARIA labels
- 📱 Improved mobile navigation experience
- 🔧 Simplified component architecture (removed manual theme state management)

## Contributing

When adding new components:
1. Place client components in `src/component/client/`
2. Place server components in `src/component/server/`
3. Export from respective `index.ts` files
4. Update this README with component documentation
5. Follow existing naming conventions (`Marketing*` prefix)

## License

Private - Internal use only within AFENDA project.

---

**Part of AFENDA** - Enterprise Workflow Orchestration Platform  
**Powered by** NexusCanon Infrastructure Fabric
