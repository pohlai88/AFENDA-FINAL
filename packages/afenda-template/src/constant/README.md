1. a **Constant-Layer Doctrine** you can paste into `constant/README.md`
2. a **no-drift enforcement** check you can run in CI (and optionally wire into ESLint)

---

## 1) Constant-Layer Doctrine (paste into `constant/README.md`)

````md
# Constants Layer — Doctrine (No-Drift)

This folder contains **pure, deterministic constants** and small helpers that support the entire codebase.

## Core principles
1. **Pure + deterministic**
   - No I/O, no fetch, no file access, no random, no Date.now().
   - No environment branching (except reading from a provided value in a helper).
2. **Single Source of Truth**
   - Values live in one constant object.
   - Types are derived from constants (`as const` + union types).
3. **No drift**
   - Every enum-like constant must provide:
     - `XXX` (const object)
     - `Xxx` (union type derived)
     - `XXX_LIST` (readonly list from values)
     - `isXxx(value)` (runtime guard)
     - `toXxx(value, fallback)` (normalizer)
4. **No circular imports**
   - Constant files must NOT import from `constant/index.ts`.
   - If a helper is needed, import from `./_core.helper`.
5. **No business logic**
   - Constants layer is infrastructure-level truth, not domain rules.

## Standard patterns

### A) Enum-like strings
```ts
export const HTTP_METHODS = { GET: "GET", POST: "POST" } as const;
export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];
export const HTTP_METHOD_LIST = Object.values(HTTP_METHODS) as readonly HttpMethod[];
export function isHttpMethod(v: unknown): v is HttpMethod { ... }
export function toHttpMethod(v: unknown, fallback: HttpMethod = HTTP_METHODS.GET): HttpMethod { ... }
````

### B) Defaults

* Defaults must be:

  * `as const`
  * documented with comments
  * stable and safe across environments

### C) Limits

* Limits must be named `*_LIMITS`
* Provide clamp helpers where applicable:

  * `clampInt(value, min, max, fallback)`

## File naming

* Prefer: `afenda.constant.<topic>.ts`
* Special files:

  * `_core.helper.ts` — generic utilities for all constant files
  * `index.ts` — exports only (no logic)

## Index export rule (recommended)

Prefer namespaced exports:

```ts
export * as API from "./afenda.constant.api";
export * as HTTP from "./afenda.constant.http";
export * as STATUS from "./afenda.constant.status";
```

Usage:

```ts
import { API, STATUS } from "@/constant";
API.API_VERSIONS.V1;
STATUS.isStatus("active");
```

## What is forbidden here

* `process.env` reads directly inside constants (ok in env adapter file only)
* imports from feature folders
* `require()`
* side effects

````

---

## 2) No-drift enforcement (CI check)

This is the simplest robust approach: **a small script** that scans your `constant/` folder and enforces the pattern.

### `scripts/check-constants.ts`

```ts
/* eslint-disable no-console */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const CONSTANT_DIR = path.join(ROOT, "constant");

const IGNORE_FILES = new Set([
  "index.ts",
  "README.md",
  "_core.helper.ts",
]);

function listTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listTsFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

function has(pattern: RegExp, text: string) {
  return pattern.test(text);
}

function rel(p: string) {
  return path.relative(ROOT, p).replaceAll("\\", "/");
}

type Violation = { file: string; reason: string };

const violations: Violation[] = [];

const files = listTsFiles(CONSTANT_DIR).filter((f) => {
  const base = path.basename(f);
  return !IGNORE_FILES.has(base);
});

for (const file of files) {
  const base = path.basename(file);
  const text = fs.readFileSync(file, "utf8");

  // Rule 1: No importing from constant/index.ts (avoids circular dependency)
  if (has(/from\s+["']\.\/index["']/, text) || has(/from\s+["']@\/constant["']/, text)) {
    violations.push({ file: rel(file), reason: "Do not import from constant/index.ts inside constant files. Import from ./_core.helper instead." });
  }

  // Rule 2: No require()
  if (has(/\brequire\(/, text)) {
    violations.push({ file: rel(file), reason: "require() is forbidden. Use ESM imports." });
  }

  // Rule 3: If file declares an enum-like constant, ensure LIST + is + to exist.
  // Heuristic: if it has `as const;` and exports a const object in ALL_CAPS, enforce companions.
  const enumConstMatch = text.match(/export\s+const\s+([A-Z0-9_]+)\s*=\s*{[\s\S]*?}\s*as\s+const\s*;/g);

  if (enumConstMatch) {
    for (const m of enumConstMatch) {
      const name = m.match(/export\s+const\s+([A-Z0-9_]+)/)?.[1];
      if (!name) continue;

      const listName = `${name}_LIST`;

      // LIST required
      if (!has(new RegExp(`export\\s+const\\s+${listName}\\b`), text)) {
        violations.push({ file: rel(file), reason: `Missing ${listName} for ${name}.` });
      }

      // Guard required (isXxx)
      // We can’t perfectly derive Xxx name, so enforce at least one exported `is` function in file.
      if (!has(/export\s+function\s+is[A-Za-z0-9_]+\s*\(/, text)) {
        violations.push({ file: rel(file), reason: `Missing exported guard function (isXxx) for enum-like constants (found ${name}).` });
      }

      // Normalizer required (toXxx)
      if (!has(/export\s+function\s+to[A-Za-z0-9_]+\s*\(/, text)) {
        violations.push({ file: rel(file), reason: `Missing exported normalizer function (toXxx) for enum-like constants (found ${name}).` });
      }
    }
  }

  // Rule 4: No side-effect patterns (basic heuristic)
  if (has(/\bfetch\(/, text) || has(/\bDate\.now\(\)/, text) || has(/\bMath\.random\(\)/, text)) {
    violations.push({ file: rel(file), reason: "Side effects detected (fetch/Date.now/Math.random). Constants must be deterministic." });
  }
}

if (violations.length) {
  console.error("\n❌ Constant-layer check failed:\n");
  for (const v of violations) console.error(`- ${v.file}: ${v.reason}`);
  console.error(`\nTotal violations: ${violations.length}\n`);
  process.exit(1);
}

console.log("✅ Constant-layer check passed.");
````

### Add to `package.json`

```json
{
  "scripts": {
    "check:constants": "tsx scripts/check-constants.ts"
  },
  "devDependencies": {
    "tsx": "^4.0.0"
  }
}
```

### CI usage

Run this in your pipeline before build:

```bash
pnpm check:constants
```

---

## Optional: ESLint guardrail (lightweight)

If you don’t want to write a custom ESLint plugin, you can still block the two biggest drift sources:

### In ESLint config (flat config idea)

* Block `require()`
* Block importing `constant/index` from within `constant/*`

Example rule sketch:

```js
// eslint.config.js (example)
export default [
  {
    files: ["constant/**/*.ts"],
    rules: {
      "no-restricted-syntax": [
        "error",
        { selector: "CallExpression[callee.name='require']", message: "require() is forbidden in constants. Use ESM imports." }
      ],
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            { group: ["./index", "@/constant"], message: "Do not import constant index inside constant files. Import from ./_core.helper or direct file." }
          ]
        }
      ]
    }
  }
];
```

---
