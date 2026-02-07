#!/usr/bin/env node
/**
 * Domain Generator Script
 * 
 * Creates a new domain package with all required folders, files, and prefixed structure.
 * 
 * Usage:
 *   pnpm tsx scripts/create-domain.ts <domain-name>
 *   
 * Example:
 *   pnpm tsx scripts/create-domain.ts billing
 *   
 * This will create:
 *   - packages/<domain>/          (domain package)
 *   - app/<domain>/               (domain pages)
 *   - app/api/bff/<domain>/       (BFF API routes)
 *   - app/api/v1/<domain>/        (Public API routes)
 *   - app/api/ops/<domain>/       (Ops/internal API routes)
 */

import * as fs from "fs";
import * as path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const AFENDA_ROOT = path.resolve(__dirname, "..");
const PACKAGES_DIR = path.join(AFENDA_ROOT, "packages");
const APP_DIR = path.join(AFENDA_ROOT, "app");

// ============================================================================
// TEMPLATE GENERATORS
// ============================================================================

function generatePackageJson(domain: string): string {
  return `{
  "name": "@afenda/${domain}",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "exports": {
    ".": "./src/${domain}.index.ts",
    "./drizzle": "./src/drizzle/index.ts",
    "./zod": "./src/zod/index.ts",
    "./zustand": "./src/zustand/index.ts",
    "./server": "./src/server/index.ts",
    "./pino": "./src/pino/index.ts",
    "./constant": "./src/constant/index.ts",
    "./hooks": "./src/hooks/index.ts",
    "./query": "./src/query/index.ts",
    "./storage": "./src/storage/index.ts",
    "./component/client": "./src/component/client/index.ts",
    "./component/server": "./src/component/server/index.ts"
  }
}
`;
}

function generateTsConfig(): string {
  return `{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
`;
}

function generateDomainIndex(domain: string): string {
  return `// ${domain} domain barrel exports
// Import from "@afenda/${domain}" to get all domain exports

export * from "./drizzle/${domain}.schema";
export * from "./zod/${domain}.contract";
export * from "./server/${domain}.service";
export * from "./constant";
`;
}

// --- Drizzle ---

function generateDrizzleSchema(domain: string): string {
  const tablePrefix = domain.replace(/-/g, "_");
  return `import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * ${domain} domain tables (authoritative DB schema slice).
 * Prefix all tables with "${tablePrefix}_" to avoid conflicts.
 */

// Example table - customize for your domain
export const ${tablePrefix}Items = pgTable(
  "${tablePrefix}_items",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true, mode: "date" }).defaultNow(),
  }
);
`;
}

function generateDrizzleIndex(domain: string): string {
  return `// Drizzle stage barrel exports
export * from "./${domain}.schema";
`;
}

// --- Zod ---

function generateZodContract(domain: string): string {
  const pascalDomain = toPascalCase(domain);
  return `import { z } from "zod";

/**
 * ${domain} domain contracts (Zod schemas for API validation).
 */

export const ${pascalDomain}ItemSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  status: z.enum(["active", "inactive", "archived"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type ${pascalDomain}Item = z.infer<typeof ${pascalDomain}ItemSchema>;

export const ${pascalDomain}CreateRequestSchema = z.object({
  name: z.string().min(1).max(255),
});

export type ${pascalDomain}CreateRequest = z.infer<typeof ${pascalDomain}CreateRequestSchema>;

export const ${pascalDomain}ListQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  query: z.string().optional(),
});

export type ${pascalDomain}ListQuery = z.infer<typeof ${pascalDomain}ListQuerySchema>;
`;
}

function generateZodIndex(domain: string): string {
  return `// Zod stage barrel exports
export * from "./${domain}.contract";
`;
}

// --- Zustand ---

function generateZustandStore(domain: string): string {
  const pascalDomain = toPascalCase(domain);
  return `"use client";

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";

/**
 * ${domain} domain store (client-side state management).
 */

interface ${pascalDomain}State {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  isLoading: false,
  error: null,
};

export const use${pascalDomain}Store = create<${pascalDomain}State>()(
  devtools(
    persist(
      (set) => ({
        ...initialState,
        setLoading: (loading) => set({ isLoading: loading }),
        setError: (error) => set({ error }),
        reset: () => set(initialState),
      }),
      { name: "${domain}-store" }
    ),
    { name: "${pascalDomain}Store" }
  )
);
`;
}

function generateZustandIndex(domain: string): string {
  return `// Zustand stage barrel exports
export * from "./${domain}.store";
`;
}

// --- Server ---

function generateServerService(domain: string): string {
  const pascalDomain = toPascalCase(domain);
  return `/**
 * ${domain} domain service (server-side business logic).
 */

export const ${domain}ServiceVersion = "0.1.0";

export class ${pascalDomain}Service {
  async initialize() {
    const readyAt = new Date().toISOString();
    return {
      ok: true,
      data: {
        status: "initialized",
        version: ${domain}ServiceVersion,
        readyAt,
      },
    };
  }

  async list(query: { page?: number; limit?: number }) {
    // TODO: Implement list logic
    return {
      ok: true,
      data: {
        items: [],
        total: 0,
        page: query.page ?? 1,
        limit: query.limit ?? 20,
      },
    };
  }

  async create(input: { name: string }) {
    // TODO: Implement create logic
    return {
      ok: true,
      data: {
        id: crypto.randomUUID(),
        name: input.name,
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }
}

export const ${domain}Service = new ${pascalDomain}Service();
`;
}

function generateServerEnvelope(domain: string): string {
  return `/**
 * ${domain} domain API envelope helpers.
 */

export type ApiMeta = Record<string, unknown>;

export type ApiOk<T> = {
  ok: true;
  data: T;
  message?: string;
  meta?: ApiMeta;
  traceId?: string;
};

export type ApiFail<E = unknown> = {
  ok: false;
  error: E;
  message?: string;
  meta?: ApiMeta;
  traceId?: string;
};

export type ApiEnvelope<T, E = unknown> = ApiOk<T> | ApiFail<E>;

export function apiOk<T>(data: T, opts?: { message?: string; meta?: ApiMeta; traceId?: string }): ApiOk<T> {
  return {
    ok: true,
    data,
    ...(opts?.message && { message: opts.message }),
    ...(opts?.meta && { meta: opts.meta }),
    ...(opts?.traceId && { traceId: opts.traceId }),
  };
}

export function apiFail<E>(
  error: E,
  opts?: { message?: string; meta?: ApiMeta; traceId?: string }
): ApiFail<E> {
  return {
    ok: false,
    error,
    ...(opts?.message && { message: opts.message }),
    ...(opts?.meta && { meta: opts.meta }),
    ...(opts?.traceId && { traceId: opts.traceId }),
  };
}
`;
}

function generateServerIndex(domain: string): string {
  return `// Server stage barrel exports
export * from "./${domain}.envelope";
export * from "./${domain}.service";
`;
}

// --- Pino ---

function generatePinoLogger(domain: string): string {
  return `/**
 * ${domain} domain logger (pino configuration).
 */

import pino from "pino";

export const ${domain}Logger = pino({
  name: "${domain}",
  level: process.env.LOG_LEVEL ?? "info",
});

export function createLogger(context: string) {
  return ${domain}Logger.child({ context });
}
`;
}

function generatePinoIndex(domain: string): string {
  return `// Pino stage barrel exports
export * from "./${domain}.pino";
`;
}

// --- Constant ---

function generateConstantRoutes(domain: string): string {
  return `/**
 * ${domain} domain route constants.
 */

export const ${domain.toUpperCase().replace(/-/g, "_")}_ROUTES = {
  // UI routes
  ui: {
    root: "/${domain}",
    list: "/${domain}/list",
    detail: (id: string) => \`/${domain}/\${id}\`,
    create: "/${domain}/create",
    edit: (id: string) => \`/${domain}/\${id}/edit\`,
  },
  
  // API routes
  api: {
    bff: "/api/bff/${domain}",
    v1: "/api/v1/${domain}",
    ops: "/api/ops/${domain}",
  },
} as const;
`;
}

function generateConstantIndex(domain: string): string {
  return `// Constant stage barrel exports
export * from "./${domain}.constant.routes";
`;
}

// --- Hooks ---

function generateHooksNavigation(domain: string): string {
  const pascalDomain = toPascalCase(domain);
  return `"use client";

import { useRouter, usePathname } from "next/navigation";
import { ${domain.toUpperCase().replace(/-/g, "_")}_ROUTES } from "../constant/${domain}.constant.routes";

/**
 * ${domain} domain navigation hook.
 */
export function use${pascalDomain}Navigation() {
  const router = useRouter();
  const pathname = usePathname();

  return {
    pathname,
    routes: ${domain.toUpperCase().replace(/-/g, "_")}_ROUTES.ui,
    
    goToList: () => router.push(${domain.toUpperCase().replace(/-/g, "_")}_ROUTES.ui.list),
    goToDetail: (id: string) => router.push(${domain.toUpperCase().replace(/-/g, "_")}_ROUTES.ui.detail(id)),
    goToCreate: () => router.push(${domain.toUpperCase().replace(/-/g, "_")}_ROUTES.ui.create),
    goToEdit: (id: string) => router.push(${domain.toUpperCase().replace(/-/g, "_")}_ROUTES.ui.edit(id)),
  };
}
`;
}

function generateHooksIndex(domain: string): string {
  return `// Hooks stage barrel exports
export * from "./${domain}.use-navigation";
`;
}

// --- Query (TanStack Query) ---

function generateQueryHooks(domain: string): string {
  const pascalDomain = toPascalCase(domain);
  return `"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ${domain.toUpperCase().replace(/-/g, "_")}_QUERY_KEYS } from "./${domain}.query-keys";

/**
 * ${domain} domain TanStack Query hooks.
 */

export function use${pascalDomain}List(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ${domain.toUpperCase().replace(/-/g, "_")}_QUERY_KEYS.list(params),
    queryFn: async () => {
      // TODO: Implement API fetch
      return { items: [], total: 0 };
    },
  });
}

export function use${pascalDomain}ById(id: string) {
  return useQuery({
    queryKey: ${domain.toUpperCase().replace(/-/g, "_")}_QUERY_KEYS.byId(id),
    queryFn: async () => {
      // TODO: Implement API fetch
      return null;
    },
    enabled: !!id,
  });
}

export function use${pascalDomain}Create() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { name: string }) => {
      // TODO: Implement API call
      return { id: "", ...data };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ${domain.toUpperCase().replace(/-/g, "_")}_QUERY_KEYS.all });
    },
  });
}
`;
}

function generateQueryKeys(domain: string): string {
  const upperDomain = domain.toUpperCase().replace(/-/g, "_");
  return `/**
 * ${domain} domain query keys for TanStack Query.
 * Centralized query key factory for cache invalidation and prefetching.
 */

export const ${upperDomain}_QUERY_KEYS = {
  all: ["${domain}"] as const,
  lists: () => [...${upperDomain}_QUERY_KEYS.all, "list"] as const,
  list: (params?: { page?: number; limit?: number }) => 
    [...${upperDomain}_QUERY_KEYS.lists(), params] as const,
  details: () => [...${upperDomain}_QUERY_KEYS.all, "detail"] as const,
  byId: (id: string) => [...${upperDomain}_QUERY_KEYS.details(), id] as const,
};
`;
}

function generateQueryIndex(domain: string): string {
  return `// Query stage barrel exports
export * from "./${domain}.query";
export * from "./${domain}.query-keys";
`;
}

// --- Storage (IndexedDB/localStorage) ---

function generateStorageAdapter(domain: string): string {
  return `/**
 * ${domain} domain storage adapters.
 * Handles IndexedDB and localStorage operations for offline support.
 */

const STORAGE_PREFIX = "${domain}:";

// localStorage adapter
export const ${domain}LocalStorage = {
  get<T>(key: string): T | null {
    if (typeof window === "undefined") return null;
    try {
      const item = localStorage.getItem(STORAGE_PREFIX + key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },
  
  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
    } catch {
      console.error("Failed to save to localStorage:", key);
    }
  },
  
  remove(key: string): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(STORAGE_PREFIX + key);
  },
  
  clear(): void {
    if (typeof window === "undefined") return;
    const keys = Object.keys(localStorage).filter(k => k.startsWith(STORAGE_PREFIX));
    keys.forEach(k => localStorage.removeItem(k));
  },
};

// IndexedDB adapter (stub - customize as needed)
export const ${domain}IndexedDB = {
  DB_NAME: "${domain}-db",
  DB_VERSION: 1,
  
  async open(): Promise<IDBDatabase | null> {
    if (typeof window === "undefined" || !("indexedDB" in window)) return null;
    
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        // Create object stores here
        if (!db.objectStoreNames.contains("items")) {
          db.createObjectStore("items", { keyPath: "id" });
        }
      };
    });
  },
};
`;
}

function generateStorageIndex(domain: string): string {
  return `// Storage stage barrel exports
export * from "./${domain}.storage";
`;
}

// --- Components ---

function generateComponentClientExample(domain: string): string {
  const pascalDomain = toPascalCase(domain);
  return `"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@afenda/shadcn";

/**
 * ${domain} domain client component example.
 * Uses shadcn primitives, adds domain-specific UI.
 */
export function ${pascalDomain}Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export function ${pascalDomain}CardExample() {
  return (
    <${pascalDomain}Card title="${pascalDomain} Domain">
      <p>This is a ${domain} domain component.</p>
    </${pascalDomain}Card>
  );
}
`;
}

function generateComponentClientIndex(domain: string): string {
  return `// Client component barrel exports
export * from "./${domain}-card";
`;
}

function generateComponentServerExample(domain: string): string {
  const pascalDomain = toPascalCase(domain);
  return `/**
 * ${domain} domain server component example.
 * RSC - no browser APIs, render-only.
 */
export async function ${pascalDomain}ServerCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  // Can fetch data here (server-side)
  return (
    <div className="rounded-lg border p-4">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="mt-2">{children}</div>
    </div>
  );
}
`;
}

function generateComponentServerIndex(domain: string): string {
  return `// Server component barrel exports
export * from "./${domain}-server-card";
`;
}

function generateComponentReadme(domain: string): string {
  return `# ${toPascalCase(domain)} Components (UI Only)

## OBJECTIVE
- UI rendering only.
- No business logic.

## LOCATION
- Client UI: \`component/client/\` (must include "use client").
- Server UI: \`component/server/\` (no browser APIs).

## RULES
- PREFIX: Every file/folder starts with \`${domain}\`.
- UI ONLY: Components render UI, nothing else.
- CLIENT: Hooks, zustand, DOM APIs allowed.
- SERVER: No browser APIs; render-only.

## ALLOWED
- Presentational UI (buttons, cards, layouts).
- Local UI state (client-only).
- Shadcn primitives from \`@afenda/shadcn\`.

## FORBIDDEN 🚫
- Database access.
- Auth/session logic.
- API handlers.
- Business logic or orchestration.
- Zod or Drizzle definitions.
`;
}

// --- API Routes ---

function generateApiBffRoute(domain: string): string {
  return `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: { message: "${toPascalCase(domain)} BFF" }, error: null });
}
`;
}

function generateApiV1Route(domain: string): string {
  return `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: { message: "${toPascalCase(domain)} v1 API" }, error: null });
}
`;
}

function generateApiOpsRoute(_domain: string): string {
  return `import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ data: { status: "healthy" }, error: null });
}
`;
}

// --- App Page ---

function generateAppPage(domain: string): string {
  const pascalDomain = toPascalCase(domain);
  return `import { ${pascalDomain}CardExample } from "@afenda/${domain}/component/client";

export default function ${pascalDomain}Page() {
  return (
    <main>
      <h1>${pascalDomain} Domain</h1>
      <${pascalDomain}CardExample />
    </main>
  );
}
`;
}

// ============================================================================
// UTILITIES
// ============================================================================

function toPascalCase(str: string): string {
  return str
    .split(/[-_]/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join("");
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`  📁 Created: ${path.relative(AFENDA_ROOT, dir)}`);
  }
}

function writeFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content);
  console.log(`  📄 Created: ${path.relative(AFENDA_ROOT, filePath)}`);
}

function validateDomainName(name: string): boolean {
  // Domain name must be lowercase, alphanumeric with hyphens
  return /^[a-z][a-z0-9-]*[a-z0-9]$/.test(name) && !name.includes("--");
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
    console.log(`
Usage: pnpm tsx scripts/create-domain.ts <domain-name>

Example:
  pnpm tsx scripts/create-domain.ts billing
  pnpm tsx scripts/create-domain.ts inventory-management

This script creates:
  - packages/<domain>/          (domain package with all tool folders)
  - app/<domain>/               (domain page)
  - app/api/bff/<domain>/       (BFF API route)
  - app/api/v1/<domain>/        (Public API route)
  - app/api/ops/<domain>/       (Ops/internal API route)
`);
    process.exit(0);
  }

  const domain = args[0].toLowerCase();

  if (!validateDomainName(domain)) {
    console.error(`❌ Invalid domain name: "${domain}"`);
    console.error("   Domain name must be lowercase, start with a letter,");
    console.error("   contain only letters, numbers, and hyphens (no double hyphens).");
    process.exit(1);
  }

  if (domain === "shadcn" || domain === "shadcn-components") {
    console.error(`❌ Cannot create domain named "${domain}" - reserved for shared components.`);
    process.exit(1);
  }

  const packageDir = path.join(PACKAGES_DIR, domain);
  if (fs.existsSync(packageDir)) {
    console.error(`❌ Domain "${domain}" already exists at ${packageDir}`);
    process.exit(1);
  }

  console.log(`\n🚀 Creating domain: ${domain}\n`);

  // --- Package structure ---
  console.log("📦 Creating package structure...");
  const srcDir = path.join(packageDir, "src");
  
  ensureDir(packageDir);
  ensureDir(srcDir);
  
  writeFile(path.join(packageDir, "package.json"), generatePackageJson(domain));
  writeFile(path.join(packageDir, "tsconfig.json"), generateTsConfig());
  writeFile(path.join(srcDir, `${domain}.index.ts`), generateDomainIndex(domain));

  // Drizzle
  const drizzleDir = path.join(srcDir, "drizzle");
  ensureDir(drizzleDir);
  writeFile(path.join(drizzleDir, `${domain}.schema.ts`), generateDrizzleSchema(domain));
  writeFile(path.join(drizzleDir, "index.ts"), generateDrizzleIndex(domain));

  // Zod
  const zodDir = path.join(srcDir, "zod");
  ensureDir(zodDir);
  writeFile(path.join(zodDir, `${domain}.contract.ts`), generateZodContract(domain));
  writeFile(path.join(zodDir, "index.ts"), generateZodIndex(domain));

  // Zustand
  const zustandDir = path.join(srcDir, "zustand");
  ensureDir(zustandDir);
  writeFile(path.join(zustandDir, `${domain}.store.ts`), generateZustandStore(domain));
  writeFile(path.join(zustandDir, "index.ts"), generateZustandIndex(domain));

  // Server
  const serverDir = path.join(srcDir, "server");
  ensureDir(serverDir);
  writeFile(path.join(serverDir, `${domain}.envelope.ts`), generateServerEnvelope(domain));
  writeFile(path.join(serverDir, `${domain}.service.ts`), generateServerService(domain));
  writeFile(path.join(serverDir, "index.ts"), generateServerIndex(domain));

  // Pino
  const pinoDir = path.join(srcDir, "pino");
  ensureDir(pinoDir);
  writeFile(path.join(pinoDir, `${domain}.pino.ts`), generatePinoLogger(domain));
  writeFile(path.join(pinoDir, "index.ts"), generatePinoIndex(domain));

  // Constant
  const constantDir = path.join(srcDir, "constant");
  ensureDir(constantDir);
  writeFile(path.join(constantDir, `${domain}.constant.routes.ts`), generateConstantRoutes(domain));
  writeFile(path.join(constantDir, "index.ts"), generateConstantIndex(domain));

  // Hooks
  const hooksDir = path.join(srcDir, "hooks");
  ensureDir(hooksDir);
  writeFile(path.join(hooksDir, `${domain}.use-navigation.ts`), generateHooksNavigation(domain));
  writeFile(path.join(hooksDir, "index.ts"), generateHooksIndex(domain));

  // Query (TanStack Query)
  const queryDir = path.join(srcDir, "query");
  ensureDir(queryDir);
  writeFile(path.join(queryDir, `${domain}.query.ts`), generateQueryHooks(domain));
  writeFile(path.join(queryDir, `${domain}.query-keys.ts`), generateQueryKeys(domain));
  writeFile(path.join(queryDir, "index.ts"), generateQueryIndex(domain));

  // Storage (IndexedDB/localStorage)
  const storageDir = path.join(srcDir, "storage");
  ensureDir(storageDir);
  writeFile(path.join(storageDir, `${domain}.storage.ts`), generateStorageAdapter(domain));
  writeFile(path.join(storageDir, "index.ts"), generateStorageIndex(domain));

  // Components
  const componentDir = path.join(srcDir, "component");
  const componentClientDir = path.join(componentDir, "client");
  const componentServerDir = path.join(componentDir, "server");
  ensureDir(componentDir);
  ensureDir(componentClientDir);
  ensureDir(componentServerDir);
  writeFile(path.join(componentDir, "README.md"), generateComponentReadme(domain));
  writeFile(path.join(componentClientDir, `${domain}-card.tsx`), generateComponentClientExample(domain));
  writeFile(path.join(componentClientDir, "index.ts"), generateComponentClientIndex(domain));
  writeFile(path.join(componentServerDir, `${domain}-server-card.tsx`), generateComponentServerExample(domain));
  writeFile(path.join(componentServerDir, "index.ts"), generateComponentServerIndex(domain));

  // --- App routes ---
  console.log("\n🌐 Creating app routes...");
  
  const appDomainDir = path.join(APP_DIR, domain);
  ensureDir(appDomainDir);
  writeFile(path.join(appDomainDir, "page.tsx"), generateAppPage(domain));

  // API routes
  const apiBffDir = path.join(APP_DIR, "api", "bff", domain);
  const apiV1Dir = path.join(APP_DIR, "api", "v1", domain);
  const apiOpsDir = path.join(APP_DIR, "api", "ops", domain);
  
  ensureDir(apiBffDir);
  ensureDir(apiV1Dir);
  ensureDir(apiOpsDir);
  
  writeFile(path.join(apiBffDir, "route.ts"), generateApiBffRoute(domain));
  writeFile(path.join(apiV1Dir, "route.ts"), generateApiV1Route(domain));
  writeFile(path.join(apiOpsDir, "route.ts"), generateApiOpsRoute(domain));

  console.log(`
✅ Domain "${domain}" created successfully!

📋 Next steps:
1. Run: pnpm install (to update workspace)
2. Import from "@afenda/${domain}" in your code
3. Customize the generated templates for your domain

📁 Structure created (10-folder standard):
   packages/${domain}/
   ├── src/
   │   ├── ${domain}.index.ts     (barrel export)
   │   ├── drizzle/               (DB schema)
   │   ├── zod/                   (contracts)
   │   ├── zustand/               (client state)
   │   ├── server/                (services)
   │   ├── pino/                  (logging)
   │   ├── constant/              (constants)
   │   ├── hooks/                 (React hooks)
   │   ├── query/                 (TanStack Query)
   │   ├── storage/               (IndexedDB/localStorage)
   │   └── component/
   │       ├── client/            (client components)
   │       └── server/            (server components)
   ├── package.json
   └── tsconfig.json
   
   app/${domain}/page.tsx
   app/api/bff/${domain}/route.ts
   app/api/v1/${domain}/route.ts
   app/api/ops/${domain}/route.ts
`);
}

main();
