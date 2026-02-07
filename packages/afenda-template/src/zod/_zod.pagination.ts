import { z } from "zod";

import { PAGINATION_DEFAULTS } from "../constant";
import { zPage, zPageSize } from "./_zod.number";

const SORT_DIRECTION_VALUES = ["asc", "desc"] as const;

export const zSortDirection = z.enum(SORT_DIRECTION_VALUES);
export type SortDirection = z.infer<typeof zSortDirection>;

export const zPaginationInput = z
  .object({
    page: zPage.default(PAGINATION_DEFAULTS.PAGE),
    pageSize: zPageSize.default(PAGINATION_DEFAULTS.PAGE_SIZE),
    sortBy: z.string().trim().min(1).max(128).default(PAGINATION_DEFAULTS.SORT_BY),
    sortDir: zSortDirection.default(PAGINATION_DEFAULTS.SORT_DIRECTION),
  })
  .strict();

export type PaginationInput = z.infer<typeof zPaginationInput>;
