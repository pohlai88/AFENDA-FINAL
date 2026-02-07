/**
 * Environment names and keys.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Environment names
 * --------------------------------------------- */
export const ENVIRONMENTS = {
  DEVELOPMENT: "development",
  TEST: "test",
  STAGING: "staging",
  PRODUCTION: "production",
} as const;

export type EnvironmentName = (typeof ENVIRONMENTS)[keyof typeof ENVIRONMENTS];

const EnvironmentEnum = makeStringEnum(ENVIRONMENTS);

export const ENVIRONMENT_LIST = EnvironmentEnum.list as readonly EnvironmentName[];
export const isEnvironment = EnvironmentEnum.is;

export function toEnvironment(
  value: unknown,
  fallback: EnvironmentName = ENVIRONMENTS.DEVELOPMENT
): EnvironmentName {
  return EnvironmentEnum.to(value, fallback) as EnvironmentName;
}

/** ---------------------------------------------
 * Environment keys
 * --------------------------------------------- */
export const ENV_KEYS = {
  NODE_ENV: "NODE_ENV",
  LOG_LEVEL: "LOG_LEVEL",
  APP_URL: "APP_URL",
  API_URL: "API_URL",
  DATABASE_URL: "DATABASE_URL",
} as const;

export type EnvKey = (typeof ENV_KEYS)[keyof typeof ENV_KEYS];

const EnvKeyEnum = makeStringEnum(ENV_KEYS);

export const ENV_KEY_LIST = EnvKeyEnum.list as readonly EnvKey[];
export const isEnvKey = EnvKeyEnum.is;

export function toEnvKey(value: unknown, fallback: EnvKey = ENV_KEYS.NODE_ENV): EnvKey {
  return EnvKeyEnum.to(value, fallback) as EnvKey;
}
