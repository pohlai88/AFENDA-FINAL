# @afenda/shadcn

> ⚠️ **READ-ONLY PACKAGE** — Do not edit files in this directory directly.

## Overview

Central UI component library built on [shadcn/ui](https://ui.shadcn.com/). This package serves as the **single source of truth** for all UI primitives, hooks, and block templates consumed by the Afenda application.

## ⛔ Important: No Direct Edits

This package is **locked for direct modification**. All components are:
- Pre-configured and battle-tested
- Kept in sync with upstream shadcn/ui
- Automatically optimized for tree-shaking

**To update components**, use the shadcn CLI from the workspace root:
```bash
npx shadcn@latest diff <component>  # Check for updates
npx shadcn@latest add <component>   # Add new components
```

## Component Registry

A machine-readable `component-registry.json` is auto-generated on every `pnpm install`. This enables:
- IDE autocomplete and import suggestions
- Documentation generation
- Component browser tooling

**Manual sync:**
```bash
pnpm run sync:registry
```

The registry includes metadata for all 500+ exports across primitives, hooks, custom components, and blocks.

## Drift checks

To detect UI/component drift (custom CSS or patterns that diverge from official shadcn and Next.js/React conventions):

- **Lint:** ESLint forbids internal path imports (`packages/shadcn-components/...`) within this package; use relative imports. The app must use `Client*` Radix components only (see 01-AGENT § 6.10).
- **Audit script:** From the repo root run `pnpm run check:shadcn-drift` (or `node scripts/audit-shadcn-drift.mjs`). Checks: forbidden imports, direct colors (hex/rgb/hsl), Tailwind palette utilities (e.g. `bg-red-500`), inline styles; warn-only for missing `"use client"`. Use `--json` for CI, `--max=N` to cap output.
- **Pragmas:** Per-line `// shadcn-drift:ignore-color`, `// shadcn-drift:ignore-tw-color`, `// shadcn-drift:ignore-style`, etc. to allow exceptions (see .dev-note).
- **Upstream:** `npx shadcn@latest diff <component>` for primitives.

See **.dev-note/SHADCN-DRIFT.md** for the full baseline, governance, semantic token canon, and pragmas.

## Installation

This package is internal to the monorepo. No separate installation needed.

## Usage

```typescript
// Import everything from the master barrel
import { 
  Button, 
  Card, 
  Dialog,
  cn,
  useIsMobile,
  useDebounce,
  BentoGrid,
  DataTable,
  LoginForm 
} from "@afenda/shadcn"

// Or use selective subpath imports (tree-shakeable)
import { useLocalStorage } from "@afenda/shadcn/hooks"
import { cn } from "@afenda/shadcn/lib"
import { BentoGrid } from "@afenda/shadcn/custom"
import { DataTable } from "@afenda/shadcn/blocks"
```

## Package Structure

```
src/
├── index.ts          # Master barrel export
├── *.tsx             # Core shadcn/ui primitives (52 components)
├── hooks/            # React hooks (useIsMobile, useDebounce, etc.)
│   └── index.ts
├── lib/              # Utilities (cn, etc.)
│   └── index.ts
├── custom/           # Extended components (BentoGrid, Kanban, etc.)
│   └── index.ts
└── blocks/           # ERP-ready templates (DataTable, LoginForm, etc.)
    └── index.ts
```

## Exports

| Subpath | Description | Example |
|---------|-------------|---------|
| `@afenda/shadcn` | Everything | `Button`, `Card`, `useIsMobile` |
| `@afenda/shadcn/hooks` | React hooks | `useDebounce`, `useLocalStorage` |
| `@afenda/shadcn/lib` | Utilities | `cn` |
| `@afenda/shadcn/custom` | Extended components | `BentoGrid`, `Kanban` |
| `@afenda/shadcn/blocks` | Block templates | `DataTable`, `LoginForm` |

## Component Categories

### Core Primitives (52)
Accordion, Alert, AlertDialog, AspectRatio, Avatar, Badge, Breadcrumb, Button, ButtonGroup, Calendar, Card, Carousel, Chart, Checkbox, Collapsible, Combobox, Command, ContextMenu, Dialog, Drawer, DropdownMenu, Empty, Field, Form, HoverCard, Input, InputGroup, InputOTP, Item, Kbd, Label, Menubar, NativeSelect, NavigationMenu, Pagination, Popover, Progress, RadioGroup, ScrollArea, Select, Separator, Sheet, Sidebar, Skeleton, Slider, Sonner, Spinner, Switch, Table, Tabs, Textarea, Toggle, ToggleGroup, Tooltip

### Hooks (5)
- `useIsMobile` — Mobile viewport detection
- `useMediaQuery` — Generic media query matching
- `useDebounce` / `useDebouncedCallback` — Value/callback debouncing
- `useLocalStorage` — Persistent state with cross-tab sync
- `useCopyToClipboard` — Clipboard operations with feedback

### Custom Components (10)
AnimatedThemeToggler, BentoGrid, BorderBeam, DatePicker, DotPattern, Kanban, NumberTicker, PasswordInput, RetroGrid, ShimmerButton

### Block Templates (40+)
Dashboard layouts, navigation blocks, auth forms, data tables, calendar variants, chart components, and more.

## Configuration

**package.json exports:**
```json
{
  "exports": {
    ".": "./src/index.ts",
    "./blocks": "./src/blocks/index.ts",
    "./custom": "./src/custom/index.ts",
    "./hooks": "./src/hooks/index.ts",
    "./lib": "./src/lib/index.ts",
    "./lib/utils": "./src/lib/utils.ts"
  },
  "sideEffects": false
}
```

## License

Internal use only — Part of Afenda monorepo.
