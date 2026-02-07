/**
 * Generic route building blocks and REST helpers.
 * Prevents drift, enforces consistency across API routes.
 */

import { makeStringEnum } from "./afenda.core.helper";

type RouteSegment = string;

const normalizeSegment = (segment: RouteSegment) => segment.replace(/^\/+|\/+$/g, "");

export const route = (...segments: RouteSegment[]) =>
  `/${segments.map(normalizeSegment).filter(Boolean).join("/")}`;

export const createRestRoutes = (basePath: RouteSegment, idParam = ":id") => {
  const base = route(basePath);
  const byId = route(base, idParam);

  return {
    BASE: base,
    LIST: base,
    CREATE: base,
    BY_ID: byId,
    GET: byId,
    UPDATE: byId,
    PATCH: byId,
    DELETE: byId,
  } as const;
};

/** ---------------------------------------------
 * Standard segments / params
 * --------------------------------------------- */
export const ROUTE_SEGMENTS = {
  API: "api",
  V1: "v1",
  V2: "v2",
  AUTH: "auth",
  HEALTH: "health",
  METRICS: "metrics",
} as const;

export type RouteSegmentValue = (typeof ROUTE_SEGMENTS)[keyof typeof ROUTE_SEGMENTS];

const RouteSegmentEnum = makeStringEnum(ROUTE_SEGMENTS);

export const ROUTE_SEGMENT_LIST = RouteSegmentEnum.list as readonly RouteSegmentValue[];
export const isRouteSegmentValue = RouteSegmentEnum.is;

export function toRouteSegmentValue(
  value: unknown,
  fallback: RouteSegmentValue = ROUTE_SEGMENTS.API
): RouteSegmentValue {
  return RouteSegmentEnum.to(value, fallback) as RouteSegmentValue;
}

export const ROUTE_PARAMS = {
  ID: ":id",
  SLUG: ":slug",
} as const;

export type RouteParam = (typeof ROUTE_PARAMS)[keyof typeof ROUTE_PARAMS];

const RouteParamEnum = makeStringEnum(ROUTE_PARAMS);

export const ROUTE_PARAM_LIST = RouteParamEnum.list as readonly RouteParam[];
export const isRouteParam = RouteParamEnum.is;

export function toRouteParam(value: unknown, fallback: RouteParam = ROUTE_PARAMS.ID): RouteParam {
  return RouteParamEnum.to(value, fallback) as RouteParam;
}

/** ---------------------------------------------
 * Derived API bases
 * --------------------------------------------- */
export const API_BASE = route(ROUTE_SEGMENTS.API);
export const API_V1_BASE = route(ROUTE_SEGMENTS.API, ROUTE_SEGMENTS.V1);
export const API_V2_BASE = route(ROUTE_SEGMENTS.API, ROUTE_SEGMENTS.V2);
export const AUTH_BASE = route(ROUTE_SEGMENTS.API, ROUTE_SEGMENTS.AUTH);

export const API_ROUTES = {
  BASE: API_BASE,
  V1_BASE: API_V1_BASE,
  V2_BASE: API_V2_BASE,
  HEALTH: route(API_BASE, ROUTE_SEGMENTS.HEALTH),
  METRICS: route(API_BASE, ROUTE_SEGMENTS.METRICS),
  AUTH: {
    BASE: AUTH_BASE,
  },
} as const;
