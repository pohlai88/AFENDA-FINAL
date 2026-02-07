/**
 * @domain magicdrive
 * @layer contracts
 * @responsibility Type definitions and validation schemas for magicdrive saved views
 */

import { z } from "zod"

// Base types
export type ViewMode = 'cards' | 'table' | 'board' | 'timeline' | 'relationship' | 'list'
export type SortBy = 'createdAt' | 'title' | 'sizeBytes' | 'updatedAt' | 'relevance'
export type SortOrder = 'asc' | 'desc'

// Smart filter types
export type SmartFilter = {
  status?: 'inbox' | 'active' | 'archived' | 'deleted' | 'all'
  type?: 'invoice' | 'contract' | 'receipt' | 'other'
  tags?: string[]
  /** When true, only include items that have at least one tag */
  hasTags?: boolean
  /** When true, only include items with a set doc type */
  hasType?: boolean
  dateRange?: { from: string; to: string }
  searchQuery?: string
  isStarred?: boolean
  isPinned?: boolean
  sharedWithMe?: boolean
  sharedByMe?: boolean
}

// Saved view types
export interface SavedView {
  id: string
  tenantId: string
  userId: string
  name: string
  description?: string
  filters: SmartFilter
  viewMode: ViewMode
  sortBy: SortBy
  sortOrder: SortOrder
  isPublic: boolean
  isDefault: boolean
  createdAt: string
  updatedAt: string
}

// User preferences types
export interface UserPreferences {
  id: string
  tenantId: string
  userId: string
  defaultView: ViewMode
  itemsPerPage: 10 | 20 | 50 | 100
  defaultSort: string
  showFileExtensions: boolean
  showThumbnails: boolean
  compactMode: boolean
  quickSettings: Record<string, any>
  createdAt: string
  updatedAt: string
}

// Tenant settings types
export interface TenantSettings {
  id: string
  tenantId: string
  documentTypes: Array<{
    value: string
    label: string
    enabled: boolean
  }>
  statusWorkflow: Array<{
    value: string
    label: string
    color: string
    enabled: boolean
  }>
  enableAiSuggestions: boolean
  enablePublicShares: boolean
  maxFileSizeMb: number
  allowedFileTypes: string[]
  createdAt: string
  updatedAt: string
}

// Validation schemas
export const CreateSavedViewSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  filters: z.object({
    status: z.enum(['inbox', 'active', 'archived', 'deleted', 'all']).optional(),
    type: z.enum(['invoice', 'contract', 'receipt', 'other']).optional(),
    tags: z.array(z.string()).optional(),
    dateRange: z.object({
      from: z.string(),
      to: z.string(),
    }).optional(),
    searchQuery: z.string().optional(),
    isStarred: z.boolean().optional(),
    isPinned: z.boolean().optional(),
    sharedWithMe: z.boolean().optional(),
    sharedByMe: z.boolean().optional(),
  }).default({}),
  viewMode: z.enum(['cards', 'table', 'board', 'timeline', 'relationship']).default('cards'),
  sortBy: z.enum(['createdAt', 'title', 'sizeBytes', 'updatedAt', 'relevance']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
})

export const UpdateSavedViewSchema = CreateSavedViewSchema.partial()

export const SavedViewListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  search: z.string().optional(),
  isPublic: z.coerce.boolean().optional(),
  viewMode: z.enum(['cards', 'table', 'board', 'timeline', 'relationship']).optional(),
})

export const UpdateUserPreferencesSchema = z.object({
  defaultView: z.enum(['cards', 'table', 'board', 'timeline', 'relationship']).optional(),
  itemsPerPage: z.enum(['10', '20', '50', '100']).transform(val => Number(val)).optional(),
  defaultSort: z.string().optional(),
  showFileExtensions: z.boolean().optional(),
  showThumbnails: z.boolean().optional(),
  compactMode: z.boolean().optional(),
  quickSettings: z.record(z.string(), z.any()).optional(),
})

export const UpdateTenantSettingsSchema = z.object({
  documentTypes: z.array(z.object({
    value: z.string(),
    label: z.string(),
    enabled: z.boolean(),
  })).optional(),
  statusWorkflow: z.array(z.object({
    value: z.string(),
    label: z.string(),
    color: z.string(),
    enabled: z.boolean(),
  })).optional(),
  enableAiSuggestions: z.boolean().optional(),
  enablePublicShares: z.boolean().optional(),
  maxFileSizeMb: z.number().min(1).max(1000).optional(),
  allowedFileTypes: z.array(z.string()).optional(),
})

// API response types
export interface SavedViewListResponse {
  items: SavedView[]
  total: number
  limit: number
  offset: number
}

export interface SavedViewResponse {
  savedView: SavedView
}

export interface UserPreferencesResponse {
  preferences: UserPreferences
}

export interface TenantSettingsResponse {
  settings: TenantSettings
}
