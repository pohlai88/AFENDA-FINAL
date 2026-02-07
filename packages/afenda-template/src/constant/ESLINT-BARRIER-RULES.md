/**
 * ESLint configuration snippet to enforce constant barrier imports.
 * 
 * ADD THIS TO YOUR .eslintrc.json TO PREVENT DRIFT:
 * 
 * {
 *   "rules": {
 *     "no-restricted-imports": [
 *       "error",
 *       {
 *         "patterns": [
 *           {
 *             "group": ["@/afenda/src/constant/afenda.constant.*"],
 *             "message": "❌ Deep imports from individual constant files are forbidden. Import only from '@/afenda' or '@/afenda/src/constant' (the barrier)."
 *           }
 *         ]
 *       }
 *     ]
 *   }
 * }
 * 
 * USAGE:
 * ✅ Allowed:
 *   import { HTTP_STATUS, CACHE_TTL, route } from "@/afenda";
 *   import { isHttpStatus, validatePageSize } from "@/afenda/src/constant";
 * 
 * ❌ Forbidden:
 *   import { HTTP_STATUS } from "@/afenda/src/constant/afenda.constant.http";
 *   import { CACHE_TTL } from "@/afenda/src/constant/afenda.constant.cache";
 * 
 * This ensures:
 * 1. Single source of truth (barrier control)
 * 2. Easy refactoring (move constants without breaking imports)
 * 3. Prevents accidental deep coupling
 * 4. Enforces consistency across codebase
 */
