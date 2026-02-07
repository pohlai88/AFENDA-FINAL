#!/usr/bin/env node
/**
 * Backup .env to .env.backup before any operation that might overwrite it.
 * Run: pnpm env:backup
 * .env.backup is gitignored.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const envPath = path.join(root, ".env");
const backupPath = path.join(root, ".env.backup");

if (!fs.existsSync(envPath)) {
  console.warn("No .env file found; nothing to backup.");
  process.exit(0);
}

try {
  const content = fs.readFileSync(envPath, "utf-8");
  fs.writeFileSync(backupPath, content, "utf-8");
  console.log(".env backed up to .env.backup");
} catch (err) {
  console.error("Backup failed:", err.message);
  process.exit(1);
}
