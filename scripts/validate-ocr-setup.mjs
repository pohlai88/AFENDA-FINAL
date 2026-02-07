#!/usr/bin/env node
/**
 * Validate MagicFolder OCR setup: script presence, Python/venv, and conflicts.
 * Run from project root: node scripts/validate-ocr-setup.mjs
 */
import { access } from "node:fs/promises"
import { constants } from "node:fs"
import { spawn } from "node:child_process"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(fileURLToPath(import.meta.url), "..", "..")
const scriptPath = join(root, "scripts", "ocr-fallback.py")
const requirementsPath = join(root, "scripts", "requirements-ocr.txt")
const venvDir = join(root, ".venv")
const isWin = process.platform === "win32"
const _venvPython = join(venvDir, isWin ? "Scripts" : "bin", "python")

const env = { ...process.env }
const ocrPythonFallback = (env.OCR_PYTHON_FALLBACK || "").toLowerCase()
const fallbackEnabled = ["1", "true", "yes"].includes(ocrPythonFallback)
const ocrPythonExe = env.OCR_PYTHON_EXE?.trim() || "python3"

function log(msg, type = "info") {
  const prefix = type === "ok" ? "\x1b[32m✓" : type === "warn" ? "\x1b[33m!" : type === "err" ? "\x1b[31m✗" : "\x1b[36m·"
  console.log(`${prefix}\x1b[0m ${msg}`)
}

function run(cmd, args) {
  return new Promise((resolve) => {
    const c = spawn(cmd, args, { stdio: "pipe", shell: true })
    let out = ""
    let err = ""
    c.stdout?.on("data", (d) => { out += d })
    c.stderr?.on("data", (d) => { err += d })
    c.on("close", (code) => resolve({ code, out: out.trim(), err: err.trim() }))
    c.on("error", () => resolve({ code: -1, out: "", err: "spawn failed" }))
  })
}

async function main() {
  console.log("MagicFolder OCR setup validation\n")

  let hasError = false
  let hasWarn = false

  // 1. Script exists
  try {
    await access(scriptPath, constants.R_OK)
    log(`Script found: scripts/ocr-fallback.py`, "ok")
  } catch {
    log(`Script missing or not readable: scripts/ocr-fallback.py`, "err")
    hasError = true
  }

  // 2. requirements-ocr.txt
  try {
    await access(requirementsPath, constants.R_OK)
    log(`Requirements file found: scripts/requirements-ocr.txt`, "ok")
  } catch {
    log(`Requirements file missing: scripts/requirements-ocr.txt`, "warn")
    hasWarn = true
  }

  // 3. Python executable (resolve .venv relative path from project root)
  const isAbsolute = ocrPythonExe.startsWith("/") || ocrPythonExe.startsWith("\\") || /^[A-Za-z]:/.test(ocrPythonExe)
  const isRelativeVenv = ocrPythonExe.includes(".venv") || ocrPythonExe.includes("venv")
  const resolvedPython = !isAbsolute && isRelativeVenv ? join(root, ocrPythonExe) : ocrPythonExe
  const pythonForRun = resolvedPython

  const { code: versionCode } = await run(pythonForRun, ["--version"])
  if (versionCode === 0) {
    log(`Python executable OK: ${ocrPythonExe}`, "ok")
  } else {
    if (fallbackEnabled) {
      log(`Python not runnable (OCR_PYTHON_EXE=${ocrPythonExe}). Fallback will fail at runtime.`, "err")
      hasError = true
    } else {
      log(`Python not runnable (OCR_PYTHON_EXE=${ocrPythonExe}). Set OCR_PYTHON_EXE if using fallback.`, "warn")
      hasWarn = true
    }
  }

  // 4. Contract check (--contract prints version)
  if (versionCode === 0) {
    const { code: contractCode, out: contractOut } = await run(pythonForRun, [scriptPath, "--contract"])
    if (contractCode === 0 && contractOut && contractOut.trim() === "1") {
      log(`ocr-fallback.py contract version 1.`, "ok")
    } else {
      log(`ocr-fallback.py --contract failed (code ${contractCode}). Script may be outdated or broken.`, "warn")
      hasWarn = true
    }
  }
  // 5. Quick script run (no image -> exit 1 is expected)
  if (versionCode === 0) {
    const { code: scriptCode } = await run(pythonForRun, [scriptPath, "__nonexistent__.jpg"])
    if (scriptCode === 1) {
      log(`ocr-fallback.py runs and exits 1 when given missing file (expected).`, "ok")
    } else if (scriptCode === 0) {
      log(`ocr-fallback.py exited 0 with missing file (unexpected).`, "warn")
      hasWarn = true
    } else {
      log(`ocr-fallback.py may be missing deps (exit ${scriptCode}). Run: pip install -r scripts/requirements-ocr.txt or node scripts/setup-ocr-venv.mjs`, "warn")
      hasWarn = true
    }
  }

  // 6. Env consistency
  log(`OCR_PYTHON_FALLBACK: ${env.OCR_PYTHON_FALLBACK ?? "(not set)"} → ${fallbackEnabled ? "enabled" : "disabled"}`, "info")
  log(`OCR_PYTHON_EXE: ${ocrPythonExe}`, "info")
  if (fallbackEnabled && hasError) {
    console.log("")
    log("Fix errors above before using OCR_PYTHON_FALLBACK=1.", "err")
  }
  if (!fallbackEnabled && !hasError) {
    log("Python fallback is disabled. Set OCR_PYTHON_FALLBACK=1 to enable.", "info")
  }

  console.log("")
  if (hasError) process.exit(1)
  if (hasWarn) process.exit(0) // warnings only
  log("No conflicts detected. OCR setup is valid.", "ok")
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
