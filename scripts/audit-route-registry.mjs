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

function stripQuotes(lit) {
  const trimmed = lit.trim()
  const q = trimmed[0]
  if ((q === `"` || q === `'` || q === "`") && trimmed[trimmed.length - 1] === q) {
    return trimmed.slice(1, -1)
  }
  return trimmed
}

function extractLiteralPathsFromRoutesTs(src) {
  // Note: This is intentionally a simple extractor. Because of the ESLint anti-drift rule,
  // `lib/routes.ts` is expected to be the only place in the codebase with raw "/app" and "/api"
  // literals, so parsing can be tolerant.
  const matches = []

  // "..."
  for (const m of src.matchAll(/"\/[^"\r\n]*"/g)) matches.push(m[0])
  // '...'
  for (const m of src.matchAll(/'\/[^'\r\n]*'/g)) matches.push(m[0])
  // `...`
  for (const m of src.matchAll(/`\/[^`\r\n]*`/g)) matches.push(m[0])

  return matches.map(stripQuotes)
}

function guessParamNameFromExpression(expr) {
  // Pick the last identifier (works well for `${slug}`, `${encodeURIComponent(next)}`, etc.)
  const ids = [...expr.matchAll(/[A-Za-z_][A-Za-z0-9_]*/g)].map((m) => m[0])
  const last = ids[ids.length - 1]
  return last || "param"
}

function normalizeRegistryPath(p) {
  // Convert template parameters to :param placeholders (preserve param name when possible).
  return p.replace(/\$\{([^}]+)\}/g, (_m, expr) => `:${guessParamNameFromExpression(expr)}`)
}

function expandBasePathVariants(p) {
  // Also consider the base path (ignore querystring) as registered.
  // e.g. "/reset-password?token=:token" -> ["/reset-password?token=:token", "/reset-password"]
  const out = new Set([p])
  const qIdx = p.indexOf("?")
  if (qIdx !== -1) out.add(p.slice(0, qIdx))
  return [...out]
}

function canonicalizeShape(p) {
  // Canonicalize patterns so param names don't matter.
  // - "/app/modules/:slug" -> "/app/modules/:"
  // - "/api/auth/*" -> "/api/auth/:*"
  // - "/api/auth/:path*" -> "/api/auth/:*"
  let s = p.trim()
  if (!s.startsWith("/")) return s

  // Remove trailing slash (except root).
  if (s.length > 1 && s.endsWith("/")) s = s.slice(0, -1)

  // Params (star)
  s = s.replace(/:[A-Za-z0-9_]+\*/g, ":*")
  // Params (single)
  s = s.replace(/:[A-Za-z0-9_]+/g, ":")

  // Wildcards (only replace literal '*' wildcards, not our internal ':*' placeholder)
  // Node supports lookbehind; keep this script Node >= 18.
  s = s.replace(/(?<!:)\*/g, ":*")

  return s
}

function toRouteSegment(seg) {
  // Ignore route groups
  if (seg.startsWith("(") && seg.endsWith(")")) return null
  // Ignore private/colocated folders
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
      // Skip build artifacts if present
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
  const _filename = parts.pop()

  const _isApi = parts[0] === "api" || file.includes(`${path.sep}api${path.sep}`)

  const segs = []
  for (const part of parts) {
    const seg = toRouteSegment(part)
    if (!seg) continue
    segs.push(seg)
  }

  // UI: ignore the "api" namespace entirely only for UI pages; API routes keep it.
  // (We already differentiate by route.ts vs page.tsx.)
  const url = `/${segs.join("/")}`
  if (url === "/") return "/"
  return url
}

async function main() {
  const src = await fs.readFile(routesFile, "utf8")
  const literalPaths = extractLiteralPathsFromRoutesTs(src)

  const registrySet = new Set()
  for (const raw of literalPaths) {
    const normalized = normalizeRegistryPath(raw)
    for (const variant of expandBasePathVariants(normalized)) {
      registrySet.add(canonicalizeShape(variant))
    }
  }

  const allFiles = await walk(appDir)

  const discovered = []
  for (const file of allFiles) {
    if (!isPageFile(file) && !isRouteHandlerFile(file)) continue

    const url = computeUrlPatternFromAppFile(file)
    // Only care about routable paths.
    if (!url.startsWith("/")) continue

    discovered.push({ url, file, shape: canonicalizeShape(url) })
  }

  const missing = discovered.filter((d) => !registrySet.has(d.shape))

  if (jsonOutput) {
    process.stdout.write(
      JSON.stringify(
        {
          missingCount: missing.length,
          missing: missing.map((m) => ({ url: m.url, file: path.relative(repoRoot, m.file) })),
        },
        null,
        2
      ) + "\n"
    )
  } else {
    if (missing.length === 0) {
      console.log("OK: all discovered UI + API routes are registered in lib/routes.ts")
    } else {
      console.log(`MISSING: ${missing.length} route(s) not registered in lib/routes.ts`)
      for (const m of missing) {
        console.log(`- ${m.url}  (${path.relative(repoRoot, m.file)})`)
      }
      console.log("")
      console.log("Fix: add the missing path(s) to lib/routes.ts (and then re-run this script).")
    }
  }

  process.exit(missing.length === 0 ? 0 : 1)
}

main().catch((err) => {
  console.error(err)
  process.exit(2)
})

