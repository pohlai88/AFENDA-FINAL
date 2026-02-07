import { z } from "zod"
import { taskResponseSchema } from "./magictodo.contract"

/**
 * @domain contracts
 * @layer schema
 * @responsibility Hierarchy tree view contracts and types
 */

// ============ Visibility Levels ============
export const VISIBILITY = {
  PRIVATE: "private",
  TEAM: "team",
  ORG: "org",
  PUBLIC: "public",
} as const

export const Visibility = z.enum([
  VISIBILITY.PRIVATE,
  VISIBILITY.TEAM,
  VISIBILITY.ORG,
  VISIBILITY.PUBLIC,
])
export type Visibility = z.infer<typeof Visibility>

// ============ Tree Node Schema ============
/**
 * Represents a task node in the hierarchy tree
 * Extends task response with children and expansion state
 */
export const treeNodeSchema = taskResponseSchema.extend({
  children: z.array(z.any()).optional().default([]),
  childCount: z.number().optional().describe("Total descendant count"),
  hasChildren: z.boolean().optional().describe("Whether node has children"),
})

// Manual recursive type definition (z.infer doesn't handle z.lazy well)
export interface TreeNode extends z.infer<typeof taskResponseSchema> {
  children?: TreeNode[]
  childCount?: number
  hasChildren?: boolean
}

// ============ Flat Node (for virtualized lists) ============
export const flatNodeSchema = taskResponseSchema.extend({
  depth: z.number().describe("Indentation level (same as level)"),
  isExpanded: z.boolean().describe("Whether children are visible"),
  hasChildren: z.boolean().describe("Whether node has children"),
  isLoading: z.boolean().optional().describe("Loading children"),
})

export type FlatNode = z.infer<typeof flatNodeSchema>

// ============ Breadcrumb Item ============
/** Compatible with HierarchyBreadcrumb from zustand */
export const breadcrumbItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  hierarchyCode: z.string().optional(),
  level: z.number().default(0),
})

export type BreadcrumbItem = z.infer<typeof breadcrumbItemSchema>

// ============ Tree View Query ============
export const treeQuerySchema = z.object({
  rootId: z.string().optional().describe("Start from specific task (drill-down)"),
  maxDepth: z.coerce.number().int().min(1).max(10).optional().default(3),
  includeCompleted: z.coerce.boolean().optional().default(false),
  projectId: z.string().optional(),
})

export type TreeQuery = z.infer<typeof treeQuerySchema>

// ============ Hierarchy Operations ============
export const moveTaskRequestSchema = z.object({
  newParentId: z.string().nullable().describe("New parent ID, null for root"),
  insertAfter: z.string().optional().describe("Sibling ID to insert after"),
})

export type MoveTaskRequest = z.infer<typeof moveTaskRequestSchema>

export const promoteTaskRequestSchema = z.object({
  taskId: z.string(),
})

export type PromoteTaskRequest = z.infer<typeof promoteTaskRequestSchema>

// ============ Ancestor/Descendant Query ============
export const ancestorQuerySchema = z.object({
  taskId: z.string(),
  includeSelf: z.coerce.boolean().optional().default(false),
})

export type AncestorQuery = z.infer<typeof ancestorQuerySchema>

export const descendantQuerySchema = z.object({
  taskId: z.string(),
  maxDepth: z.coerce.number().int().min(1).max(10).optional().default(10),
  includeSelf: z.coerce.boolean().optional().default(false),
})

export type DescendantQuery = z.infer<typeof descendantQuerySchema>

// ============ Hierarchy Code Utils ============
/**
 * Parse a hierarchy code into its components
 * Format: {TENANT}-{PREFIX}{SEQ}[-{LEVEL}...]
 * Example: "AX7-T1001-01-01" → { tenantCode: "AX7", prefix: "T", rootSeq: 1001, levels: [1, 1] }
 */
export function parseHierarchyCode(code: string | null | undefined): {
  tenantCode: string
  prefix: string
  rootSeq: number
  levels: number[]
} | null {
  if (!code) return null
  
  const parts = code.split("-")
  if (parts.length < 2) return null
  
  const tenantCode = parts[0]
  const rootPart = parts[1]
  
  // Extract prefix (first char) and sequence (rest as number)
  const prefix = rootPart.charAt(0)
  const rootSeq = parseInt(rootPart.slice(1), 10)
  
  if (isNaN(rootSeq)) return null
  
  // Parse level parts (everything after first two parts)
  const levels = parts.slice(2).map(p => parseInt(p, 10)).filter(n => !isNaN(n))
  
  return { tenantCode, prefix, rootSeq, levels }
}

/**
 * Check if a hierarchy code is from a different tenant
 */
export function isExternalTask(
  hierarchyCode: string | null | undefined,
  currentTenantCode: string
): boolean {
  const parsed = parseHierarchyCode(hierarchyCode)
  if (!parsed) return false
  return parsed.tenantCode !== currentTenantCode
}

/**
 * Get the tenant code portion from a hierarchy code
 */
export function getTenantFromCode(hierarchyCode: string | null | undefined): string | null {
  const parsed = parseHierarchyCode(hierarchyCode)
  return parsed?.tenantCode ?? null
}

/**
 * Get the depth level from a hierarchy code
 */
export function getDepthFromCode(hierarchyCode: string | null | undefined): number {
  const parsed = parseHierarchyCode(hierarchyCode)
  if (!parsed) return 0
  return parsed.levels.length
}

// ============ Tree Building Utils ============
/**
 * Build a tree structure from a flat list of tasks
 */
export function buildTree<T extends { id: string; parentTaskId?: string | null }>(
  tasks: T[]
): (T & { children: T[] })[] {
  const taskMap = new Map<string, T & { children: T[] }>()
  const roots: (T & { children: T[] })[] = []
  
  // First pass: create map with children arrays
  for (const task of tasks) {
    taskMap.set(task.id, { ...task, children: [] })
  }
  
  // Second pass: build parent-child relationships
  for (const task of tasks) {
    const node = taskMap.get(task.id)!
    if (task.parentTaskId && taskMap.has(task.parentTaskId)) {
      taskMap.get(task.parentTaskId)!.children.push(node)
    } else {
      roots.push(node)
    }
  }
  
  return roots
}

/**
 * Flatten a tree into a list with depth info (for virtualized rendering)
 */
export function flattenTree<T extends { id: string; children?: T[] }>(
  nodes: T[],
  expandedIds: Set<string>,
  depth = 0
): (T & { depth: number; isExpanded: boolean; hasChildren: boolean })[] {
  const result: (T & { depth: number; isExpanded: boolean; hasChildren: boolean })[] = []
  
  for (const node of nodes) {
    const hasChildren = (node.children?.length ?? 0) > 0
    const isExpanded = expandedIds.has(node.id)
    
    result.push({
      ...node,
      depth,
      isExpanded,
      hasChildren,
    })
    
    if (hasChildren && isExpanded) {
      result.push(...flattenTree(node.children!, expandedIds, depth + 1))
    }
  }
  
  return result
}

/**
 * Get all ancestor IDs for a task
 */
export function getAncestorIds(path: string | null | undefined): string[] {
  if (!path) return []
  return path.split("/").slice(0, -1) // Exclude self
}

/**
 * Build breadcrumb items from ancestor tasks
 */
export function buildBreadcrumbs<T extends { id: string; title: string; hierarchyCode?: string | null; level?: number | null }>(
  ancestors: T[]
): BreadcrumbItem[] {
  return ancestors.map(task => ({
    id: task.id,
    title: task.title,
    hierarchyCode: task.hierarchyCode ?? undefined,
    level: task.level ?? 0,
  }))
}
