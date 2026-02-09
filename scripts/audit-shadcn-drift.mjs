#!/usr/bin/env node
/**
 * @file audit-shadcn-drift.mjs
 * @description Audit packages/shadcn-components for drift:
 *   - internal/absolute path imports (any specifier containing packages/shadcn-components)
 *   - direct colors (hex/rgb/hsl)
 *   - raw Tailwind color utilities (bg-red-500 etc.) — prefer semantic tokens
 *   - inline styles (style={{ ... }})
 *   - optional (warn-only): client-only usage without "use client"
 *
 * @usage pnpm run check:shadcn-drift [--json] [--max=200] [--path=app/_components]
 * @see .dev-note/SHADCN-DRIFT.md
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, "..")
const SHADCN_SRC = path.join(REPO_ROOT, "packages", "shadcn-components", "src")

const rawArgs = process.argv.slice(2)
const args = new Set(rawArgs.filter((a) => !a.startsWith("--max=") && !a.startsWith("--path=")))
const jsonOutput = args.has("--json")
const pathArg = (() => {
  const p = rawArgs.find((a) => a.startsWith("--path="))
  if (!p) return null
  const v = p.slice("--path=".length).trim()
  return v || null
})()
const SCAN_DIR = pathArg ? path.join(REPO_ROOT, pathArg) : SHADCN_SRC

const maxOut = (() => {
  const m = rawArgs.find((a) => a.startsWith("--max="))
  if (!m) return 250
  const n = Number(m.split("=")[1])
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 250
})()

/**
 * Allowlist files (or path segments) that may contain direct colors, Tailwind palette utilities, or inline styles.
 * Prefer inline pragmas (e.g. // shadcn-drift:ignore-color) over growing this list.
 */
const COLOR_ALLOWLIST = [
  "data-table-export-pdf.tsx",
  "chart.tsx",
  "blocks/chart.tsx",
  "custom/shimmer-button.tsx",
  "custom/border-beam.tsx",
]

const STYLE_ALLOWLIST = [
  "custom/shimmer-button.tsx",
  "custom/border-beam.tsx",
]

function normalizeRel(p) {
  return p.replace(/\\/g, "/")
}

function isAllowlisted(relativePath, list) {
  const normalized = normalizeRel(relativePath)
  return list.some((allow) => normalized === allow || normalized.endsWith("/" + allow))
}

/** Inline ignore pragmas (per-line). See .dev-note/SHADCN-DRIFT.md */
const IGNORE_COLOR = /shadcn-drift:ignore-color/
const IGNORE_IMPORT = /shadcn-drift:ignore-import/
const IGNORE_TW_COLOR = /shadcn-drift:ignore-tw-color/
const IGNORE_STYLE = /shadcn-drift:ignore-style/
const IGNORE_USE_CLIENT = /shadcn-drift:ignore-use-client/

function hasUseClient(content) {
  const head = content.split("\n").slice(0, 8).join("\n")
  return /(^|\n)\s*["']use client["']\s*;?\s*(\n|$)/.test(head)
}

/** Heuristic: client-only usage. Returns reason string for reporting. */
function getClientOnlyReason(content) {
  if (/\b(useState|useEffect|useLayoutEffect)\s*\(/.test(content)) return "hooks (useState/useEffect)"
  if (/\b(useContext|useRef|useMemo|useCallback)\s*\(/.test(content)) return "hooks (context/ref/memo)"
  if (/from\s+["']@radix-ui\//.test(content) || /from\s+["']radix-ui["']/.test(content)) return "radix-ui"
  if (/\bwindow\b|\bdocument\b|\bnavigator\b/.test(content)) return "browser API"
  return "client-only"
}

function usesClientOnly(content) {
  return (
    /\b(useState|useEffect|useLayoutEffect|useContext|useRef|useMemo|useCallback)\s*\(/.test(content) ||
    /from\s+["']@radix-ui\//.test(content) ||
    /from\s+["']radix-ui["']/.test(content) ||
    /\bwindow\b|\bdocument\b|\bnavigator\b/.test(content)
  )
}

async function walkDir(dir, baseDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === "node_modules") continue
      files.push(...(await walkDir(full, baseDir)))
    } else if (ent.isFile() && /\.(tsx?|jsx?|mjs)$/.test(ent.name)) {
      files.push(full)
    }
  }
  return files
}

function relativeToScanDir(fullPath) {
  return normalizeRel(path.relative(SCAN_DIR, fullPath))
}

function groupByFile(rows) {
  const out = {}
  for (const r of rows) {
    out[r.file] ??= []
    out[r.file].push(r)
  }
  return out
}

function printGrouped(title, rows, formatter) {
  if (!rows.length) return
  console.error(title)

  const byFile = groupByFile(rows)
  const files = Object.keys(byFile).sort()

  let printed = 0
  for (const f of files) {
    for (const r of byFile[f]) {
      if (printed >= maxOut) {
        console.error(`  ... (+${rows.length - printed} more)`)
        console.error("")
        return
      }
      console.error(formatter(r))
      printed++
    }
  }
  console.error("")
}

async function run() {
  const importViolations = []
  const colorViolations = []
  const twColorViolations = []
  const styleViolations = []
  const useClientViolations = []

  const files = await walkDir(SCAN_DIR)

  // Import specifiers: from "x", import("x")
  const importSpecRegex = /\b(?:from\s+|import\s*\()\s*["']([^"']+)["']\s*\)?/g

  // Any specifier containing these is forbidden (broader than exact prefix)
  const forbiddenImportSubstrings = ["packages/shadcn-components"]

  // Direct colors: hex, rgb, rgba, hsl, hsla
  const directColorRegex = /#([0-9a-fA-F]{3,8})\b|rgba?\s*\(|hsla?\s*\(/g

  // Raw Tailwind palette utilities (prefer semantic: bg-background, text-foreground, text-muted-foreground, border-border, etc.)
  const twColorUtilityRegex =
    /\b(?:bg|text|border|ring|fill|stroke|from|via|to)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|black|white)(?:-\d{1,3})?\b/g

  const inlineStyleRegex = /\bstyle\s*=\s*\{\s*\{/g

  for (const filePath of files) {
    const rel = relativeToScanDir(filePath)
    const content = await fs.readFile(filePath, "utf-8")
    const lines = content.split("\n")

    // 1) Import drift: any specifier containing packages/shadcn-components (or @/packages/..., ~/..., etc.)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      if (IGNORE_IMPORT.test(line)) continue

      importSpecRegex.lastIndex = 0
      let m
      while ((m = importSpecRegex.exec(line)) !== null) {
        const spec = m[1]
        if (forbiddenImportSubstrings.some((s) => spec.includes(s))) {
          importViolations.push({ file: rel, line: i + 1, snippet: line.trim(), spec })
        }
      }
    }

    // 2) Direct colors
    if (!isAllowlisted(rel, COLOR_ALLOWLIST)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (IGNORE_COLOR.test(line)) continue

        directColorRegex.lastIndex = 0
        let m
        while ((m = directColorRegex.exec(line)) !== null) {
          colorViolations.push({
            file: rel,
            line: i + 1,
            snippet: line.trim(),
            match: m[0],
          })
        }
      }
    }

    // 3) Tailwind raw palette utilities
    if (!isAllowlisted(rel, COLOR_ALLOWLIST)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (IGNORE_TW_COLOR.test(line)) continue

        twColorUtilityRegex.lastIndex = 0
        let m
        while ((m = twColorUtilityRegex.exec(line)) !== null) {
          twColorViolations.push({
            file: rel,
            line: i + 1,
            snippet: line.trim(),
            match: m[0],
          })
        }
      }
    }

    // 4) Inline style drift
    if (!isAllowlisted(rel, STYLE_ALLOWLIST)) {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        if (IGNORE_STYLE.test(line)) continue
        inlineStyleRegex.lastIndex = 0
        if (inlineStyleRegex.test(line)) {
          styleViolations.push({ file: rel, line: i + 1, snippet: line.trim() })
        }
      }
    }

    // 5) Optional (warn-only): "use client" when file uses client-only features
    if (usesClientOnly(content) && !hasUseClient(content)) {
      const hasIgnore = lines.some((l) => IGNORE_USE_CLIENT.test(l))
      if (!hasIgnore) {
        const reason = getClientOnlyReason(content)
        useClientViolations.push({ file: rel, reason })
      }
    }
  }

  // Fail CI only on hard drift; "use client" is warn-only
  const failed =
    importViolations.length > 0 ||
    colorViolations.length > 0 ||
    twColorViolations.length > 0 ||
    styleViolations.length > 0

  if (jsonOutput) {
    const out = {
      scanPath: pathArg ?? "packages/shadcn-components/src",
      ok: !failed,
      importViolations: importViolations.length,
      colorViolations: colorViolations.length,
      twColorViolations: twColorViolations.length,
      styleViolations: styleViolations.length,
      useClientViolations: useClientViolations.length,
      details: {
        import: importViolations,
        color: colorViolations,
        twColor: twColorViolations,
        style: styleViolations,
        useClient: useClientViolations,
      },
    }
    console.log(JSON.stringify(out, null, 2))
  } else {
    if (pathArg) {
      console.error(`Scanning: ${pathArg}\n`)
    }
    printGrouped(
      "Shadcn drift: forbidden imports (use relative imports or @afenda/shadcn; spec must not contain packages/shadcn-components)",
      importViolations,
      ({ file, line, spec, snippet }) => `  ${file}:${line}  ${spec}  ${snippet}`
    )

    printGrouped(
      "Shadcn drift: direct colors (hex/rgb/hsl) — use semantic tokens or // shadcn-drift:ignore-color",
      colorViolations,
      ({ file, line, match, snippet }) => `  ${file}:${line}  ${match}  ${snippet}`
    )

    printGrouped(
      "Shadcn drift: Tailwind palette utilities (e.g. bg-red-500) — prefer semantic tokens (bg-background, text-foreground, text-muted-foreground) or // shadcn-drift:ignore-tw-color",
      twColorViolations,
      ({ file, line, match, snippet }) => `  ${file}:${line}  ${match}  ${snippet}`
    )

    printGrouped(
      "Shadcn drift: inline styles (style={{...}}) — prefer className + tokens or // shadcn-drift:ignore-style",
      styleViolations,
      ({ file, line, snippet }) => `  ${file}:${line}  ${snippet}`
    )

    if (useClientViolations.length) {
      console.error('Shadcn drift (warn-only): client-only usage without "use client" — add directive or // shadcn-drift:ignore-use-client')
      useClientViolations.slice(0, maxOut).forEach(({ file, reason }) =>
        console.error(`  ${file}  (${reason})`)
      )
      if (useClientViolations.length > maxOut) {
        console.error(`  ... (+${useClientViolations.length - maxOut} more)`)
      }
      console.error("")
    }

    if (!failed) {
      console.log("check:shadcn-drift — no violations.")
      if (useClientViolations.length) {
        console.log('(Warn: add "use client" to listed files if they are imported into Server Components.)')
      }
    }
  }

  process.exit(failed ? 1 : 0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
