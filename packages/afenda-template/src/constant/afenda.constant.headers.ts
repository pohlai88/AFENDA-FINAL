/**
 * Standard request/response header names and values.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Names
 * --------------------------------------------- */
export const HEADER_NAMES = {
  ACCEPT: "accept",
  ACCEPT_LANGUAGE: "accept-language",
  AUTHORIZATION: "authorization",
  CACHE_CONTROL: "cache-control",
  CONTENT_TYPE: "content-type",
  REQUEST_ID: "x-request-id",
  TRACE_ID: "x-trace-id",
  USER_AGENT: "user-agent",
  FORWARDED_FOR: "x-forwarded-for",
} as const;

export type HeaderName = (typeof HEADER_NAMES)[keyof typeof HEADER_NAMES];

const HeaderNameEnum = makeStringEnum(HEADER_NAMES);

export const HEADER_NAME_LIST = HeaderNameEnum.list as readonly HeaderName[];
export const isHeaderName = HeaderNameEnum.is;

export function toHeaderName(value: unknown, fallback: HeaderName = HEADER_NAMES.CONTENT_TYPE): HeaderName {
  return HeaderNameEnum.to(value, fallback) as HeaderName;
}

/** ---------------------------------------------
 * Common values
 * --------------------------------------------- */
export const HEADER_VALUES = {
  NO_CACHE: "no-store, no-cache, must-revalidate",
  JSON: "application/json",
} as const;

export type HeaderValue = (typeof HEADER_VALUES)[keyof typeof HEADER_VALUES];

const HeaderValueEnum = makeStringEnum(HEADER_VALUES);

export const HEADER_VALUE_LIST = HeaderValueEnum.list as readonly HeaderValue[];
export const isHeaderValue = HeaderValueEnum.is;

export function toHeaderValue(value: unknown, fallback: HeaderValue = HEADER_VALUES.JSON): HeaderValue {
  return HeaderValueEnum.to(value, fallback) as HeaderValue;
}
