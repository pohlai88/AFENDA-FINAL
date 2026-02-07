/**
 * Cookie names and configuration defaults.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Names
 * --------------------------------------------- */
export const COOKIE_NAMES = {
  SESSION: "session_id",
  REFRESH: "refresh_token",
  CSRF: "csrf_token",
  LOCALE: "locale",
  THEME: "theme",
  TENANT: "tenant_id",
} as const;

export type CookieName = (typeof COOKIE_NAMES)[keyof typeof COOKIE_NAMES];

const CookieNameEnum = makeStringEnum(COOKIE_NAMES);

export const COOKIE_NAME_LIST = CookieNameEnum.list as readonly CookieName[];
export const isCookieName = CookieNameEnum.is;

export function toCookieName(value: unknown, fallback: CookieName = COOKIE_NAMES.SESSION): CookieName {
  return CookieNameEnum.to(value, fallback) as CookieName;
}

/** ---------------------------------------------
 * Defaults
 * --------------------------------------------- */
export const COOKIE_DEFAULTS = {
  PATH: "/",
  SAME_SITE: "lax",
  SECURE: true,
  HTTP_ONLY: true,
} as const;
