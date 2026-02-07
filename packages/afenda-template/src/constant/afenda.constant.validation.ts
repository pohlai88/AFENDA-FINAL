/**
 * Validation thresholds and security rules.
 */
export const VALIDATION_LIMITS = {
  MIN_PASSWORD_LENGTH: 12,
  MAX_PASSWORD_LENGTH: 128,
  MIN_NAME_LENGTH: 2,
  MAX_NAME_LENGTH: 120,
  MAX_DESCRIPTION_LENGTH: 500,
} as const;

export const PASSWORD_RULES = {
  REQUIRE_UPPER: true,
  REQUIRE_LOWER: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SYMBOL: true,
} as const;
