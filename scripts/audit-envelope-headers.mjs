import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const repoRoot = path.resolve(__dirname, "..")
const appDir = path.join(repoRoot, "app")
const routesFile = path.join(repoRoot, "lib", "routes.ts")

const args = new Set(process.argv.slice(2))
const jsonOutput = args.has("--json")
const writeMode = args.has("--write")
const dryRun = args.has("--dry-run")

function stripQuotes(lit) {
  const trimmed = lit.trim()
  const q = trimmed[0]
  if ((q === `"` || q === `'` || q === "`") && trimmed[trimmed.length - 1] === q) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function extractLiteralPathsFromRoutesTs(src) {
  const matches = []
  for (const m of src.matchAll(/"\/[^"\r\n]*"/g)) matches.push(m[0])
  for (const m of src.matchAll(/'\/[^'\r\n]*'/g)) matches.push(m[0])
  for (const m of src.matchAll(/`\/[^`\r\n]*`/g)) matches.push(m[0])
  return matches.map(stripQuotes)
}

function guessParamNameFromExpression(expr) {
  const ids = [...expr.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)].map((m) => m[0])
  const last = ids[ids.length - 1]
  return last || "param"
}

function normalizeRegistryPath(p) {
  return p.replace(/\$\{([^}]+)\}/g, (_m, expr) => `:${guessParamNameFromExpression(expr)}`)
}

function expandBasePathVariants(p) {
  const out = new Set([p])
  const qIdx = p.indexOf("?")
  if (qIdx !== -1) out.add(p.slice(0, qIdx))
  return [...out]
}

function canonicalizeShape(p) {
  let s = p.trim()
  if (!s.startsWith("/")) return s
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1)

  s = s.replace(/:[A-Za-z0-9_]+\*/g, ":*")
  s = s.replace(/:[A-Za-z0-9_]+/g, ":")

  // Replace literal '*' wildcards, not our ':*' placeholder.
  s = s.replace(/(?<!:)\*/g, ":*")

  return s
}

function toRouteSegment(seg) {
  if (seg.startsWith("(") && seg.endsWith(")")) return null
  if (seg.startsWith("_")) return null

  const catchAll = seg.match(/^\[\.\.\.(.+)\]$/)
  if (catchAll) return `:${catchAll[1]}*`

  const dynamic = seg.match(/^\[(.+)\]$/)
  if (dynamic) return `:${dynamic[1]}`

  return seg
}

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true })
  const files = []
  for (const ent of entries) {
    const full = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      if (ent.name === ".next" || ent.name === "node_modules") continue
      files.push(...(await walk(full)))
    } else if (ent.isFile()) {
      files.push(full)
    }
  }
  return files
}

function isPageFile(file) {
  return /[\\\/]page\.(tsx|ts|jsx|js)$/.test(file)
}

function isRouteHandlerFile(file) {
  return /[\\\/]route\.(tsx|ts|jsx|js)$/.test(file)
}

function computeUrlPatternFromAppFile(file) {
  const rel = path.relative(appDir, file)
  const parts = rel.split(path.sep)
  parts.pop() // remove filename

  const segs = []
  for (const part of parts) {
    const seg = toRouteSegment(part)
    if (!seg) continue
    segs.push(seg)
  }

  return `/${segs.join("/")}` || "/"
}

function detectExpectedOwner(file) {
  const rel = path.relative(repoRoot, file).replaceAll("\\", "/")

  // UI
  if (rel.startsWith("app/(public)/(marketing)/") || rel.startsWith("app/offline/")) {
    return { domain: "marketing", layer: "ui" }
  }
  if (rel.startsWith("app/(public)/(auth)/")) {
    return { domain: "auth", layer: "ui" }
  }
  if (rel.startsWith("app/(app)/app/(orchestra)/")) {
    return { domain: "orchestra", layer: "ui" }
  }
  if (rel.startsWith("app/(app)/app/(magictodo)/")) {
    return { domain: "magictodo", layer: "ui" }
  }
  if (rel.startsWith("app/(app)/app/tenancy/")) {
    return { domain: "tenancy", layer: "ui" }
  }
  if (rel.startsWith("app/(app)/app/settings/")) {
    // Settings is app-shell owned.
    return { domain: "orchestra", layer: "ui" }
  }

  // API
  if (rel.startsWith("app/api/v1/(auth)/")) return { domain: "auth", layer: "api" }
  if (rel.startsWith("app/api/v1/(tenancy)/")) return { domain: "tenancy", layer: "api" }
  if (rel.startsWith("app/api/v1/(magictodo)/")) return { domain: "magictodo", layer: "api" }
  if (rel.startsWith("app/api/auth/(auth)/")) return { domain: "auth", layer: "api" }
  if (rel.startsWith("app/api/(public)/(auth)/")) return { domain: "auth", layer: "api" }
  if (rel.startsWith("app/api/orchestra/(orchestra)/")) return { domain: "orchestra", layer: "api" }
  if (rel.startsWith("app/api/debug/(debug)/")) return { domain: "orchestra", layer: "api" }
  if (rel.startsWith("app/api/admin/")) return { domain: "auth", layer: "api" }
  if (rel.startsWith("app/api/cron/")) return { domain: "orchestra", layer: "api" }
  if (rel.startsWith("app/api/test-env/")) return { domain: "orchestra", layer: "api" }

  return null
}

function parseEnvelopeHeader(src) {
  // Find first JSDoc block at file start (allow leading whitespace).
  const m = src.match(/^\s*\/\*\*[\s\S]*?\*\//)
  if (!m) return null
  const block = m[0]

  const getTag = (tag) => {
    const rx = new RegExp(`@${tag}[^\\S\\r\\n]+([^\\r\\n]*)`)
    const mm = block.match(rx)
    return mm ? mm[1].trim() : null
  }

  const domain = getTag("domain")
  const layer = getTag("layer")
  const responsibility = getTag("responsibility")

  return {
    raw: block,
    domain,
    layer,
    responsibility,
  }
}

function buildHeader({ domain, layer, responsibility }) {
  return (
    `/**\n` +
    ` * @domain ${domain}\n` +
    ` * @layer ${layer}\n` +
    ` * @responsibility ${responsibility}\n` +
    ` */\n\n`
  )
}

function replaceOrInsertHeader(src, newHeader) {
  const existing = src.match(/^\s*\/\*\*[\s\S]*?\*\/\s*\n?/)
  if (existing) {
    return src.replace(existing[0], newHeader)
  }
  return newHeader + src
}

async function main() {
  const routesSrc = await fs.readFile(routesFile, "utf8")
  const literalPaths = extractLiteralPathsFromRoutesTs(routesSrc)

  const registrySet = new Set()
  for (const raw of literalPaths) {
    const normalized = normalizeRegistryPath(raw)
    for (const variant of expandBasePathVariants(normalized)) {
      registrySet.add(canonicalizeShape(variant))
    }
  }

  const allFiles = await walk(appDir)
  const routables = allFiles.filter((f) => isPageFile(f) || isRouteHandlerFile(f))

  const results = []
  const actions = []

  for (const file of routables) {
    const url = computeUrlPatternFromAppFile(file)
    const shape = canonicalizeShape(url)

    // Only enforce headers for routes that are registered.
    if (!registrySet.has(shape)) continue

    const expected = detectExpectedOwner(file)
    if (!expected) continue

    const src = await fs.readFile(file, "utf8")
    const parsed = parseEnvelopeHeader(src)

    const fileRel = path.relative(repoRoot, file)
    const expectedOk =
      parsed &&
      parsed.domain === expected.domain &&
      parsed.layer === expected.layer

    const missing = !parsed
    const mismatch = Boolean(parsed) && !expectedOk

    if (missing || mismatch) {
      const responsibility = isRouteHandlerFile(file)
        ? `API route handler for ${url}`
        : `UI route entrypoint for ${url}`

      const newHeader = buildHeader({
        domain: expected.domain,
        layer: expected.layer,
        responsibility,
      })

      if (dryRun) {
        actions.push({
          file: fileRel,
          url,
          action: missing ? "insert" : "replace",
          expected,
          actual: parsed ? { domain: parsed.domain, layer: parsed.layer } : null,
          headerPreview: newHeader.trimEnd(),
        })
      } else if (writeMode) {
        const nextSrc = replaceOrInsertHeader(src, newHeader)
        if (nextSrc !== src) {
          await fs.writeFile(file, nextSrc, "utf8")
        }

        // Treat this file as fixed for the current run (no need to re-read).
        // This prevents `--write` from exiting non-zero due to pre-write parsing.
        parsed = {
          raw: newHeader,
          domain: expected.domain,
          layer: expected.layer,
          responsibility,
        }
      }
    }

    results.push({
      file: fileRel,
      url,
      expected,
      header: parsed,
    })
  }

  const problems = results.filter((r) => !r.header || r.header.domain !== r.expected.domain || r.header.layer !== r.expected.layer)

  if (jsonOutput) {
    process.stdout.write(
      JSON.stringify(
        {
          checkedCount: results.length,
          problemCount: problems.length,
          actions: dryRun ? actions : undefined,
          problems: problems.map((p) => ({
            file: p.file,
            url: p.url,
            expected: p.expected,
            actual: p.header ? { domain: p.header.domain, layer: p.header.layer } : null,
          })),
        },
        null,
        2
      ) + "\n"
    )
  } else {
    if (problems.length === 0) {
      console.log("OK: envelope headers match expected domain/layer for all registered routable files")
    } else {
      console.log(`MISSING/MISMATCH: ${problems.length} file(s) need envelope headers`)
      for (const p of problems) {
        const actual = p.header ? `${p.header.domain ?? "?"}/${p.header.layer ?? "?"}` : "missing"
        console.log(`- ${p.url}  (${p.file}) expected=${p.expected.domain}/${p.expected.layer} actual=${actual}`)
      }
      if (dryRun) {
        console.log("")
        console.log(`Dry run: would ${actions.length} file(s).`)
      } else if (!writeMode) {
        console.log("")
        console.log("Fix: re-run with `--dry-run` to preview or `--write` to insert/update headers.")
      }
    }
  }

  process.exit(problems.length === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})

