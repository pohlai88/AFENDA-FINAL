/**
 * HTTP methods and status codes.
 *
 * Pattern:
 * CONST OBJECT → TYPE UNION → LIST → isX / toX
 */

import { makeNumberEnum, makeStringEnum } from "./afenda.core.helper";

/** ---------------------------------------------
 * Methods
 * --------------------------------------------- */
export const HTTP_METHODS = {
  GET: "GET",
  POST: "POST",
  PUT: "PUT",
  PATCH: "PATCH",
  DELETE: "DELETE",
  OPTIONS: "OPTIONS",
  HEAD: "HEAD",
} as const;

export type HttpMethod = (typeof HTTP_METHODS)[keyof typeof HTTP_METHODS];

const HttpMethodEnum = makeStringEnum(HTTP_METHODS);

export const HTTP_METHOD_LIST = HttpMethodEnum.list as readonly HttpMethod[];
export const isHttpMethod = HttpMethodEnum.is;

export function toHttpMethod(value: unknown, fallback: HttpMethod = HTTP_METHODS.GET): HttpMethod {
  return HttpMethodEnum.to(value, fallback) as HttpMethod;
}

/** ---------------------------------------------
 * Status codes
 * --------------------------------------------- */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,

  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  TOO_MANY_REQUESTS: 429,

  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
} as const;

export type HttpStatus = (typeof HTTP_STATUS)[keyof typeof HTTP_STATUS];

const HttpStatusEnum = makeNumberEnum(HTTP_STATUS);

export const HTTP_STATUS_LIST = HttpStatusEnum.list as readonly HttpStatus[];
export const isHttpStatus = HttpStatusEnum.is;

export function toHttpStatus(value: unknown, fallback: HttpStatus = HTTP_STATUS.OK): HttpStatus {
  return HttpStatusEnum.to(value, fallback) as HttpStatus;
}
