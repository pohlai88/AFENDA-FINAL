#!/usr/bin/env node
/**
 * Restore .env from .env.backup (e.g. after accidental overwrite).
 * Run: pnpm env:restore
 *
 * If you recovered an old .env from Windows Previous Versions / File History,
 * save that file as .env.backup in the project root, then run: pnpm env:restore
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const backupPath = path.join(root, ".env.backup");

if (!fs.existsSync(backupPath)) {
  console.error("No .env.backup found. Create one with: pnpm env:backup");
  process.exit(1);
}

try {
  const content = fs.readFileSync(backupPath, "utf-8");
  fs.writeFileSync(envPath, content, "utf-8");
  console.log(".env restored from .env.backup");
} catch (err) {
  console.error("Restore failed:", err.message);
  process.exit(1);
}
