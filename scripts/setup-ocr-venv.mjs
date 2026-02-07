#!/usr/bin/env node
/**
 * Create a project-local Python venv and install OCR fallback deps (PaddleOCR + EasyOCR).
 * Run from project root: node scripts/setup-ocr-venv.mjs
 * Then set OCR_PYTHON_EXE to .venv/Scripts/python (Windows) or .venv/bin/python (Unix).
 */
import { spawn } from "node:child_process"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { fileURLToPath } from "node:url"

const root = join(fileURLToPath(import.meta.url), "..", "..")
const venvDir = join(root, ".venv")
const isWin = process.platform === "win32"
const venvPython = join(venvDir, isWin ? "Scripts" : "bin", "python")
const requirements = join(root, "scripts", "requirements-ocr.txt")

function run(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    const c = spawn(cmd, args, { stdio: "inherit", cwd: root, ...opts })
    c.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`exit ${code}`))))
    c.on("error", reject)
  })
}

async function main() {
  console.log("Creating virtual environment at .venv ...")
  if (existsSync(venvPython)) {
    console.log(".venv already exists. Installing/updating OCR packages ...")
  } else {
    await run("python", ["-m", "venv", ".venv"]).catch(() => {
      throw new Error("Failed to create venv. Ensure Python 3.8+ is on PATH (try 'python' or 'python3').")
    })
  }
  console.log("Installing packages from scripts/requirements-ocr.txt (this may take several minutes) ...")
  await run(venvPython, ["-m", "pip", "install", "-r", requirements]).catch(() => {
    throw new Error("pip install failed. Check that the venv was created and you have network access.")
  })
  console.log("Done. Use this Python for OCR fallback:")
  console.log("  OCR_PYTHON_EXE=" + (isWin ? ".venv\\\\Scripts\\\\python.exe" : ".venv/bin/python"))
}

main().catch((err) => {
  console.error(err.message)
  process.exit(1)
})
