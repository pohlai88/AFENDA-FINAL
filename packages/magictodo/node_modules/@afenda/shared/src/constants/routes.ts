/**
 * Route constants.
 * Centralized route definitions — no magic strings in code.
 * Uses function pattern for type-safety and dynamic segments.
 */

import { routesBase } from "./routes-base"

const magicdriveV1 = {
  root: () => "/api/magicdrive/v1" as const,
  list: () => "/api/magicdrive/v1" as const,
  duplicateGroups: () => "/api/magicdrive/v1/duplicate-groups" as const,
  health: () => "/api/magicdrive/v1/health" as const,
  ingest: () => "/api/magicdrive/v1/ingest" as const,
  upload: () => "/api/magicdrive/v1/presign" as const,
  bulk: () => "/api/magicdrive/v1/bulk" as const,
  preferences: () => "/api/magicdrive/v1/preferences" as const,
  tags: () => "/api/magicdrive/v1/tags" as const,
  savedViews: () => "/api/magicdrive/v1/saved-views" as const,
  savedViewById: (id: string) => `/api/magicdrive/v1/saved-views/${id}` as const,
  objectById: (id: string) => `/api/magicdrive/v1/objects/${id}` as const,
  objectSourceUrl: (id: string) => `/api/magicdrive/v1/objects/${id}/source-url` as const,
  objectThumbUrl: (id: string) => `/api/magicdrive/v1/objects/${id}/thumb-url` as const,
  objectDuplicate: (id: string) => `/api/magicdrive/v1/objects/${id}/duplicate` as const,
  objectExport: (id: string) => `/api/magicdrive/v1/objects/${id}/export` as const,
} as const

export const routes = {
  ...routesBase,
  api: {
    ...routesBase.api,
    v1: {
      magicdrive: magicdriveV1,
    },
  },
} as const

export type Routes = typeof routes
