/**
 * Path → (resource, CRUD) derived from route definitions — no hardcoded paths.
 * Single source of truth: routes.ui.admin (and optional extra route fns).
 * REST: path comes from API/route shape; resource/crud align with RBAC.
 */

import { routes } from "./routes";

/** Route key → RBAC resource name. Only for keys that don't match RBAC (e.g. admins → admin_assignments). Paths come from routes. */
const ADMIN_ROUTE_KEY_TO_RESOURCE: Record<string, string> = {
  admins: "admin_assignments",
  services: "service_registry",
  configTemplates: "config",
};

type PathCrudEntry = { path: string; resource: string; crudOp: string };

function buildPathToCrud(): PathCrudEntry[] {
  const entries: PathCrudEntry[] = [];

  // Admin UI: every route in routes.ui.admin (except root) → path from fn(), resource from key, REST default read
  const adminRoutes = routes.ui.admin as Record<string, () => string>;
  for (const [key, pathFn] of Object.entries(adminRoutes)) {
    if (typeof pathFn !== "function" || key === "root") continue;
    const path = pathFn();
    const resource = ADMIN_ROUTE_KEY_TO_RESOURCE[key] ?? key;
    entries.push({ path, resource, crudOp: "read" });
  }

  // Orchestra UI routes that are admin-context (e.g. dashboard = health read)
  const dashboardPath = routes.ui.orchestra.dashboard();
  entries.push({ path: dashboardPath, resource: "health", crudOp: "read" });

  return entries;
}

/** Derived from routes — no hardcoded path list. New admin route = add to routes.ui.admin (+ optional key→resource if alias). */
export const ADMIN_PATH_TO_CRUD: PathCrudEntry[] = buildPathToCrud();

/**
 * Resolve pathname to (resource, crudOp). Longest matching path wins.
 * Uses only paths produced from route definitions.
 */
export function getResourceCrudForPathname(pathname: string): { resource: string; crudOp: string } | null {
  const candidates = ADMIN_PATH_TO_CRUD.filter(
    (p) => pathname === p.path || pathname.startsWith(p.path + "/")
  ).sort((a, b) => b.path.length - a.path.length);
  return candidates[0] ?? null;
}
