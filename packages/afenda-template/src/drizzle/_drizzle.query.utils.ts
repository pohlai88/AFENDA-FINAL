import { sql, SQL, and, or, eq, gt, lt, gte, lte, desc, asc } from "drizzle-orm";
import type { PgColumn, PgTable } from "drizzle-orm/pg-core";

/**
 * Query utilities for pagination, filtering, sorting, and batch operations.
 *
 * Patterns:
 * - Cursor-based pagination
 * - Offset-based pagination
 * - Dynamic filtering
 * - Multi-column sorting
 * - Batch inserts/updates
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
}

export interface SortParam {
  column: string;
  direction: "asc" | "desc";
}

export interface FilterParam {
  column: string;
  operator: "eq" | "gt" | "lt" | "gte" | "lte" | "like" | "in";
  value: any;
}

/**
 * Calculate offset pagination parameters.
 */
export function getOffsetPagination(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const pageSize = Math.min(100, Math.max(1, params.pageSize || 10));
  const offset = (page - 1) * pageSize;

  return {
    limit: pageSize,
    offset,
    page,
    pageSize,
  };
}

/**
 * Build pagination metadata.
 */
export function buildPaginationMeta(params: {
  total: number;
  page: number;
  pageSize: number;
}) {
  const { total, page, pageSize } = params;
  const totalPages = Math.ceil(total / pageSize);

  return {
    total,
    page,
    pageSize,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
}

/**
 * Cursor-based pagination helper.
 * Returns items and nextCursor.
 */
export async function cursorPaginate<T extends { id: any }>(
  query: any,
  options: {
    cursor?: string;
    pageSize?: number;
    cursorColumn?: keyof T;
  } = {}
) {
  const { cursor, pageSize = 10, cursorColumn = "id" } = options;
  const limit = Math.min(100, pageSize) + 1; // Fetch one extra to check for next page

  let items: T[] = await query.limit(limit);

  if (cursor) {
    items = items.filter((item) => String(item[cursorColumn]) > cursor);
  }

  const hasMore = items.length > pageSize;
  if (hasMore) {
    items = items.slice(0, pageSize);
  }

  const nextCursor = hasMore && items.length > 0 ? String(items[items.length - 1][cursorColumn]) : null;

  return {
    items,
    nextCursor,
    hasMore,
  };
}

/**
 * Build WHERE conditions from filter array.
 */
export function buildFilters(filters: FilterParam[], columns: Record<string, PgColumn>): SQL | undefined {
  if (!filters || filters.length === 0) return undefined;

  const conditions = filters.map((filter) => {
    const column = columns[filter.column];
    if (!column) return undefined;

    switch (filter.operator) {
      case "eq":
        return eq(column, filter.value);
      case "gt":
        return gt(column, filter.value);
      case "lt":
        return lt(column, filter.value);
      case "gte":
        return gte(column, filter.value);
      case "lte":
        return lte(column, filter.value);
      case "like":
        return sql`${column} ILIKE ${`%${filter.value}%`}`;
      case "in":
        return sql`${column} = ANY(${filter.value})`;
      default:
        return undefined;
    }
  }).filter(Boolean);

  return conditions.length > 0 ? and(...conditions) : undefined;
}

/**
 * Build ORDER BY from sort array.
 */
export function buildSort(sorts: SortParam[], columns: Record<string, PgColumn>): SQL[] {
  if (!sorts || sorts.length === 0) return [];

  return sorts
    .map((sort) => {
      const column = columns[sort.column];
      if (!column) return undefined;
      return sort.direction === "desc" ? desc(column) : asc(column);
    })
    .filter(Boolean) as SQL[];
}

/**
 * Batch insert with conflict handling.
 */
export async function batchInsert<T>(
  db: any,
  table: PgTable,
  records: T[],
  options: {
    batchSize?: number;
    onConflict?: "ignore" | "update";
    conflictColumns?: string[];
  } = {}
) {
  const { batchSize = 100, onConflict, conflictColumns } = options;
  const results = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    let query = db.insert(table).values(batch);

    if (onConflict === "ignore") {
      query = query.onConflictDoNothing();
    } else if (onConflict === "update" && conflictColumns) {
      query = query.onConflictDoUpdate({
        target: conflictColumns as any,
        set: batch[0], // Use first record as template
      });
    }

    const result = await query;
    results.push(result);
  }

  return results;
}

/**
 * Batch update helper.
 */
export async function batchUpdate<T extends { id: any }>(
  db: any,
  table: PgTable,
  records: T[],
  options: {
    batchSize?: number;
  } = {}
) {
  const { batchSize = 100 } = options;
  const results = [];

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    for (const record of batch) {
      const { id, ...updates } = record;
      const result = await db.update(table).set(updates).where(eq((table as any).id, id));
      results.push(result);
    }
  }

  return results;
}

/**
 * Full-text search helper (using tsvector).
 */
export function fullTextSearch(column: PgColumn, query: string) {
  return sql`to_tsvector('english', ${column}) @@ plainto_tsquery('english', ${query})`;
}

/**
 * JSON field query helper.
 */
export function jsonbContains(column: PgColumn, value: any) {
  return sql`${column} @> ${JSON.stringify(value)}`;
}

export function jsonbPath(column: PgColumn, path: string) {
  return sql`${column}->>${path}`;
}

/**
 * Array contains helper.
 */
export function arrayContains(column: PgColumn, value: any) {
  return sql`${column} @> ARRAY[${value}]`;
}
