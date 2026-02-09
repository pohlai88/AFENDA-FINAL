/**
 * ESLint flat config (Next.js 16+).
 * Structure: nextVitals → nextTs → globalIgnores → rule overrides.
 * See: https://nextjs.org/docs/app/api-reference/config/eslint
 *
 * ESLint 9 compatibility: eslint-plugin-react is patched (patches/eslint-plugin-react.patch)
 * so context.filename is used when context.getFilename is not available (flat config API).
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

/** Ignore intentionally unused vars/args (convention: prefix with _). */
const unusedVarsIgnorePattern = {
  argsIgnorePattern: "^_",
  varsIgnorePattern: "^_",
  caughtErrorsIgnorePattern: "^_",
};

/** Radix components that require Client* wrappers to avoid hydration mismatches. See .dev-note/HYDRATION-RADIX.md */
const RADIX_COMPONENTS_REQUIRE_CLIENT = [
  "Dialog",
  "DialogTrigger",
  "DialogContent",
  "DialogHeader",
  "DialogTitle",
  "DialogDescription",
  "DialogFooter",
  "DialogClose",
  "Select",
  "SelectTrigger",
  "SelectContent",
  "SelectItem",
  "SelectValue",
  "DropdownMenu",
  "DropdownMenuTrigger",
  "DropdownMenuContent",
  "DropdownMenuItem",
  "DropdownMenuSeparator",
  "Sheet",
  "SheetTrigger",
  "SheetContent",
  "SheetHeader",
  "SheetTitle",
  "SheetDescription",
  "SheetFooter",
  "Popover",
  "PopoverTrigger",
  "PopoverContent",
  "Tooltip",
  "TooltipTrigger",
  "TooltipContent",
  "TooltipProvider",
  "AlertDialog",
  "AlertDialogTrigger",
  "AlertDialogContent",
  "AlertDialogHeader",
  "AlertDialogTitle",
  "AlertDialogDescription",
  "AlertDialogFooter",
  "AlertDialogAction",
  "AlertDialogCancel",
];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  // Linter options (see https://eslint.org/docs/latest/use/configure/configuration-files#configure-linter-options)
  // - reportUnusedDisableDirectives: warn on obsolete eslint-disable/enable comments
  // - reportUnusedInlineConfigs: warn when inline rule overrides are redundant with config
  {
    linterOptions: {
      reportUnusedDisableDirectives: "warn",
      reportUnusedInlineConfigs: "warn",
    },
  },

  // Override default ignores of eslint-config-next (per Next.js docs)
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "public/sw.js",
    ".afenda-legacy/**",
    ".afenda.backup/**",
    ".components.backup/**",
    "packages/afenda-template/**",
  ]),

  // Ignore _-prefixed identifiers in no-unused-vars (intentionally unused: API params, fixtures, stubs).
  // Only override the TypeScript rule options; do not enable core no-unused-vars (would duplicate warnings).
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs}"],
    rules: {
      "@typescript-eslint/no-unused-vars": ["warn", unusedVarsIgnorePattern],
    },
  },

  // ---- Drift-prevention rules (new standard) ----
  // 1) Server-only: use `import "server-only"` directly. Root lib/ is legacy per 01-AGENT.
  //    Forbid legacy @/lib/server/only; use the server-only package.
  {
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@/lib/server/only",
              message: "Root lib/ is legacy. Use `import \"server-only\"` instead.",
            },
          ],
        },
      ],
    },
  },
  // Compile-time type tests: allow "unused" symbols (they're assertions).
  {
    files: ["**/_type-tests.ts"],
    rules: {
      "@typescript-eslint/no-unused-vars": "off",
      "no-unused-vars": "off",
    },
  },

  // 2) Client/shared modules must not import server-only code.
  {
    files: [
      "components/**/*.{ts,tsx,js,jsx}",
      "hooks/**/*.{ts,tsx,js,jsx}",
      "lib/client/**/*.{ts,tsx,js,jsx}",
      "lib/api/**/*.{ts,tsx,js,jsx}",
      "lib/shared/**/*.{ts,tsx,js,jsx}",
      "lib/contracts/**/*.{ts,tsx,js,jsx}",
      "lib/constants/**/*.{ts,tsx,js,jsx}",
      "lib/config/**/*.{ts,tsx,js,jsx}",
      "lib/env/public.{ts,js}",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/lib/server/**"],
              message:
                "Do not import server-only modules from client/shared code. Move logic to lib/shared or call via API.",
            },
            {
              group: ["@/lib/env/server", "server-only"],
              message:
                "Do not import server env or server-only guards from client/shared code.",
            },
          ],
        },
      ],
    },
  },

  // 3) Route handlers must not define schemas or touch DB internals directly.
  //    Import contracts from packages/<domain>/zod and domain server modules.
  {
    files: ["app/**/route.ts", "app/**/route.tsx"],
    rules: {
      "no-restricted-modules": [
        "error",
        {
          paths: [
            {
              name: "zod",
              message:
                "Do not import zod in route handlers. Use schemas from packages/<domain>/zod.",
            },
            {
              name: "drizzle-orm",
              message:
                "Do not import Drizzle in route handlers. Use domain server modules.",
            },
            {
              name: "drizzle-zod",
              message:
                "Do not import drizzle-zod in route handlers. Use domain contracts.",
            },
            {
              name: "postgres",
              message:
                "Do not create DB clients in route handlers. Use domain server modules.",
            },
            {
              name: "@/lib/server/db/client",
              message:
                "Route handlers must not import DB client directly. Use domain server modules.",
            },
            {
              name: "@/lib/server/db/zod",
              message:
                "Route handlers must not import DB zod. Use domain contracts.",
            },
            {
              name: "@/lib/server/db/schema",
              message:
                "Route handlers must not import DB schema. Use domain server modules.",
            },
            {
              name: "@/lib/server/db/schema/index",
              message:
                "Route handlers must not import DB schema. Use domain server modules.",
            },
          ],
          patterns: ["drizzle-orm/*"],
        },
      ],
    },
  },

  // 3b) API governance: enforce standard patterns in `app/api/**/route.*`
  // - No console usage (use package logger, e.g. from @afenda/shared or domain packages)
  // - Use envelope helpers: ok()/fail() from @afenda/shared/server or kernelOk/kernelFail from @afenda/orchestra
  {
    files: ["app/api/**/route.ts", "app/api/**/route.tsx"],
    rules: {
      "no-console": "error",
      "no-restricted-properties": [
        "error",
        {
          object: "NextResponse",
          property: "json",
          message:
            "Do not call `NextResponse.json()` directly. Use ok()/fail() from @afenda/shared/server or kernelOk/kernelFail from @afenda/orchestra.",
        },
        {
          object: "Response",
          property: "json",
          message:
            "Do not call `Response.json()` directly. Use ok()/fail() from @afenda/shared/server or kernelOk/kernelFail from @afenda/orchestra.",
        },
      ],
    },
  },
  // Exception: Neon Auth proxy route must preserve Neon SDK semantics and may return custom JSON payloads.
  {
    // NOTE: brackets in the filename require escaping for glob matching.
    files: ["app/api/auth/(auth)/\\[...path\\]/route.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
  // Exception: Orchestra kernel API routes use their own envelope pattern (kernelOk/kernelFail from @afenda/orchestra).
  {
    files: ["app/api/orchestra/**/route.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
  // Exception: Magicdrive API routes use kernelOk/kernelFail envelope from @afenda/orchestra.
  {
    files: ["app/api/magicdrive/**/route.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
  // Exception: Magictodo API routes use kernelOk/kernelFail envelope from @afenda/orchestra.
  {
    files: ["app/api/magictodo/**/route.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },
  // Exception: Tenancy API routes use kernelOk/kernelFail envelope from @afenda/orchestra.
  {
    files: ["app/api/tenancy/**/route.ts"],
    rules: {
      "no-restricted-properties": "off",
    },
  },

  // 4) Anti-drift: forbid raw "/app" and "/api" strings outside shared constants.
  //    Use `routes.ui.*` and `routes.api.*` from `@afenda/shared/constants` instead.
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: [
      // Route classification registry & request proxy need to match by prefix.
      "lib/api/meta.ts",
      "proxy.ts",
      // Non-module runtime assets (cannot import routes)
      "public/**",
      // Shared constants package (defines routes)
      "packages/shared/src/constants/routes.ts",
      "packages/shared/src/constants/routes-base.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Literal[value=/^\\/(app|api)(\\/|$)/]",
          message:
            "Do not hardcode '/app' or '/api' paths. Import from `@afenda/shared/constants` (routes.ui.* / routes.api.*).",
        },
        {
          selector: "TemplateElement[value.raw=/^\\/(app|api)(\\/|$)/]",
          message:
            "Do not hardcode '/app' or '/api' paths in template literals. Import from `@afenda/shared/constants` (routes.ui.* / routes.api.*).",
        },
      ],
    },
  },

  // 4b) Shadcn package: use relative imports only (no packages/shadcn-components/src/...).
  //     See .dev-note/SHADCN-DRIFT.md.
  {
    files: ["packages/shadcn-components/**/*.{ts,tsx,js,jsx,mjs}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["packages/shadcn-components/**"],
              message:
                "Use relative imports within @afenda/shadcn (e.g. ./lib/utils, ./button). See .dev-note/SHADCN-DRIFT.md.",
            },
          ],
        },
      ],
    },
  },

  // 5) Radix UI: Use Client* components only in app and packages (avoid hydration)
  //    See .dev-note/HYDRATION-RADIX.md. packages/shadcn-components is exempt (defines Client*).
  {
    files: ["app/**/*.{ts,tsx}", "packages/**/*.{ts,tsx}"],
    ignores: ["packages/shadcn-components/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@afenda/shadcn",
              importNames: RADIX_COMPONENTS_REQUIRE_CLIENT,
              message:
                "Use Client* components (e.g. ClientDialog, ClientSelect) from @afenda/shadcn to avoid hydration mismatches. See .dev-note/HYDRATION-RADIX.md.",
            },
          ],
        },
      ],
    },
  },

  // 6) Radix Client* only (no icon constraint)
  {
    files: ["**/*.{ts,tsx,js,jsx}"],
    ignores: [
      "app/(app)/(kernel)/_shell/**",
      "app/(app)/(kernel)/admin/**",
      "app/(app)/(kernel)/dashboard/**",
      "app/(app)/**/error.tsx",
      "app/(app)/**/not-found.tsx",
      "app/(app)/**/global-error.tsx",
      "app/(public)/**/error.tsx",
      "app/(public)/**/not-found.tsx",
      "app/(public)/**/global-error.tsx",
      "app/(public)/(marketing)/status/**",
      "app/(public)/(marketing)/security/**",
      "app/(public)/(marketing)/privacy/**",
      "app/(public)/(marketing)/pdpa/**",
      "app/(public)/(marketing)/(offline)/**",
      "app/(public)/(marketing)/api-docs/**",
      "packages/marketing/src/component/client/afenda-icon.tsx",
      "packages/shadcn-components/**",
      "packages/shared/**",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "@afenda/shadcn",
              importNames: RADIX_COMPONENTS_REQUIRE_CLIENT,
              message:
                "Use Client* components (e.g. ClientDialog, ClientSelect) from @afenda/shadcn to avoid hydration mismatches. See .dev-note/HYDRATION-RADIX.md.",
            },
          ],
        },
      ],
    },
  },

  // 7) Tenancy columns: use tenancyColumns spread from @afenda/tenancy/drizzle.
  //    Block inline text("tenant_id") / text("legacy_tenant_id") / text("organization_id") / text("team_id") in schema files.
  //    tenancy-columns.ts and tenancy.schema.ts are exempt (source of truth for tenancy domain).
  {
    files: ["packages/*/src/drizzle/**/*.ts"],
    ignores: [
      "packages/tenancy/src/drizzle/tenancy-columns.ts",
      "packages/tenancy/src/drizzle/tenancy.schema.ts",
    ],
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector:
            'CallExpression[callee.name="text"] > Literal[value="tenant_id"]',
          message:
            "Use `...tenancyColumns.withTenancy` from @afenda/tenancy/drizzle. Do not define tenant columns inline. See 02-ARCHITECTURE.md § 3.3.",
        },
        {
          selector:
            'CallExpression[callee.name="text"] > Literal[value="legacy_tenant_id"]',
          message:
            "Use `...tenancyColumns.withLegacy` from @afenda/tenancy/drizzle (legacy). Prefer tenancyColumns.withTenancy for new tables. See 02-ARCHITECTURE.md § 3.3.",
        },
        {
          selector:
            'CallExpression[callee.name="text"] > Literal[value="organization_id"]',
          message:
            "Use `...tenancyColumns.withTenancy` or `.standard` / `.withLegacy` from @afenda/tenancy/drizzle. Do not define tenant columns inline. See 02-ARCHITECTURE.md § 3.3.",
        },
        {
          selector:
            'CallExpression[callee.name="text"] > Literal[value="team_id"]',
          message:
            "Use `...tenancyColumns.withTenancy` or `.standard` / `.withLegacy` from @afenda/tenancy/drizzle. Do not define tenant columns inline. See 02-ARCHITECTURE.md § 3.3.",
        },
      ],
    },
  },
]);

export default eslintConfig;
