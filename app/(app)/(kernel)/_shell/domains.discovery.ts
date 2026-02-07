/**
 * Domain discovery from app/(app)/ route segments.
 * No hardcoding: reads filesystem and optional domain.config.json per domain.
 *
 * @domain app
 * @layer shell
 */

import "server-only";

import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

import type { AppDomainEntry } from "@afenda/orchestra";

/** Per-domain config (optional file: domain.config.json in each segment folder). */
export interface DomainConfig {
  label: string;
  icon: string;
  description?: string;
  /** Sort order (lower first). Default from discovery order. */
  order?: number;
}

const APP_APP_SEGMENT = "(app)";
const DOMAIN_CONFIG_FILE = "domain.config.json";

/** Segments that are not product domains (admin is sidebar-only; no (kernel) after move). */
const NON_DOMAIN_SEGMENTS = new Set(["admin"]);

/**
 * Derive a display label from a route segment (e.g. magictodo → MagicTodo).
 */
function segmentToLabel(segment: string): string {
  return segment
    .split(/[-_]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

/**
 * Default icon for known segments; otherwise "file".
 */
function segmentToIcon(segment: string): string {
  const lower = segment.toLowerCase();
  if (lower === "dashboard") return "dashboard";
  if (lower === "magictodo") return "checklist";
  if (lower === "magicfolder") return "folder";
  if (lower === "magicdrive") return "folder";
  if (lower === "tenancy") return "folder";
  return "file";
}

/**
 * Read domain.config.json from a directory. Returns null if missing or invalid.
 */
function readDomainConfig(dirPath: string): DomainConfig | null {
  const configPath = join(dirPath, DOMAIN_CONFIG_FILE);
  if (!existsSync(configPath)) return null;
  try {
    const raw = readFileSync(configPath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    if (typeof parsed !== "object" || parsed === null) return null;
    const o = parsed as Record<string, unknown>;
    if (typeof o.label !== "string" || typeof o.icon !== "string") return null;
    return {
      label: o.label,
      icon: o.icon,
      description: typeof o.description === "string" ? o.description : undefined,
      order: typeof o.order === "number" ? o.order : undefined,
    };
  } catch {
    return null;
  }
}

/**
 * Get available domains by scanning app/(app)/ directories.
 * Each direct child that is a directory is a domain; (kernel) maps to /dashboard.
 * Optional domain.config.json in each folder supplies label, icon, order.
 */
export function getAvailableDomainsFromApp(): AppDomainEntry[] {
  const appAppPath = join(process.cwd(), "app", APP_APP_SEGMENT);
  if (!existsSync(appAppPath)) return [];

  const entries = readdirSync(appAppPath, { withFileTypes: true });
  const domains: AppDomainEntry[] = [];
  const orderMap = new Map<string, number>();

  for (const dirent of entries) {
    if (!dirent.isDirectory()) continue;
    const segment = dirent.name;
    // Skip private, non-route, or non-domain segments (admin is sidebar-only)
    if (segment.startsWith("_") || segment === "not-found" || NON_DOMAIN_SEGMENTS.has(segment)) continue;

    const dirPath = join(appAppPath, segment);
    const config = readDomainConfig(dirPath);

    const id = segment === "dashboard" ? "system" : segment;
    const href = `/${segment}`;
    const label = config?.label ?? segmentToLabel(segment);
    const icon = config?.icon ?? segmentToIcon(segment);
    const description = config?.description;

    domains.push({ id, label, href, icon, ...(description && { description }) });
    if (typeof config?.order === "number") orderMap.set(id, config.order);
  }

  // Sort: explicit order first, then by id
  domains.sort((a, b) => {
    const orderA = orderMap.get(a.id) ?? 999;
    const orderB = orderMap.get(b.id) ?? 999;
    if (orderA !== orderB) return orderA - orderB;
    return a.id.localeCompare(b.id);
  });

  return domains;
}
