#!/usr/bin/env node

/**
 * Validate .env for MagicFolder, Redis (Upstash), and Cron.
 * Run: node scripts/validate-env-magicfolder-cron.mjs
 */

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, "..")

const colors = { reset: "\x1b[0m", green: "\x1b[32m", red: "\x1b[31m", yellow: "\x1b[33m", cyan: "\x1b[36m", gray: "\x1b[90m" }
function log(msg, c = "reset") {
  console.log(`${colors[c]}${msg}${colors.reset}`)
}

function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return {}
  const text = fs.readFileSync(filePath, "utf8")
  const out = {}
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/)
    if (!m) continue
    const key = m[1]
    let val = m[2].trim()
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'")))
      val = val.slice(1, -1)
    out[key] = val
  }
  return out
}

const envPath = path.join(root, ".env")
const env = parseEnv(envPath)
const _hasEnvFile = fs.existsSync(envPath)

log("\n--- MagicFolder / Redis / Cron env validation ---\n", "cyan")

// REDIS_URL (optional) — Upstash format rediss://default:xxx@xxx.upstash.io:6379
const redisUrl = env.REDIS_URL?.trim()
if (redisUrl) {
  if (redisUrl.startsWith("redis://") || redisUrl.startsWith("rediss://")) {
    log("REDIS_URL: set (BullMQ/ioredis will use it; Upstash compatible)", "green")
  } else {
    log("REDIS_URL: set but expected redis:// or rediss://", "yellow")
  }
} else {
  log("REDIS_URL: not set (MagicFolder uses in-process queue; optional)", "gray")
}

// CRON_SECRET (required for cron routes)
const cronSecret = env.CRON_SECRET?.trim()
if (cronSecret && cronSecret.length >= 16) {
  log("CRON_SECRET: set (cron routes protected)", "green")
} else if (cronSecret) {
  log("CRON_SECRET: set but short (recommend ≥16 chars)", "yellow")
} else {
  log("CRON_SECRET: not set — cron routes will return 401. Set for generate-recurrence, audit-hash, process-magicfolder-queue", "yellow")
}

// TESSERACT_LANG
const tesseractLang = env.TESSERACT_LANG?.trim() || "eng"
log(`TESSERACT_LANG: ${tesseractLang || "eng"}`, "green")

// vercel.json crons
const vercelPath = path.join(root, "vercel.json")
if (fs.existsSync(vercelPath)) {
  const vercel = JSON.parse(fs.readFileSync(vercelPath, "utf8"))
  const crons = vercel.crons || []
  log("\nCrons in vercel.json:", "cyan")
  crons.forEach((c) => log(`  ${c.schedule} → ${c.path}`, "gray"))
  log("")
}

log("Vercel: run `vercel link` then `vercel env ls`; set CRON_SECRET (and REDIS_URL if using BullMQ). See docs/vercel-cron-setup.md.", "gray")
log("FTS (search): run `pnpm db:migrate` or `pnpm db:push` so migration 0011 (magicfolder_object_index_fts) is applied. See docs/magicfolder-pending-validation.md.", "gray")
log("")
