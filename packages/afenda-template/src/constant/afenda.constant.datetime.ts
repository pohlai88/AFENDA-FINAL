/**
 * Date, time, and duration constants.
 */
export const DATE_FORMATS = {
  ISO_DATE: "YYYY-MM-DD",
  ISO_DATETIME: "YYYY-MM-DDTHH:mm:ssZ",
  DISPLAY_DATE: "MMM D, YYYY",
  DISPLAY_DATETIME: "MMM D, YYYY h:mm A",
} as const;

export const TIME_FORMATS = {
  HOURS_MINUTES: "HH:mm",
  HOURS_MINUTES_SECONDS: "HH:mm:ss",
} as const;

export const DURATION_MS = {
  SECOND: 1000,
  MINUTE: 60 * 1000,
  HOUR: 60 * 60 * 1000,
  DAY: 24 * 60 * 60 * 1000,
  WEEK: 7 * 24 * 60 * 60 * 1000,
} as const;

export const TIME_ZONES = {
  UTC: "UTC",
  LOCAL: "local",
} as const;
