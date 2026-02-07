"use client";

/**
 * Audit Pagination
 * Pagination controls for audit log.
 */

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { IconChevronLeft, IconChevronRight } from "@tabler/icons-react";

import { Button } from "@afenda/shadcn";

export interface AuditPaginationProps {
  currentPage: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export function AuditPagination({
  currentPage,
  pageSize,
  total,
  hasMore,
}: AuditPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const totalPages = Math.ceil(total / pageSize);
  const hasPrev = currentPage > 1;
  const hasNext = hasMore || currentPage < totalPages;

  const goToPage = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", page.toString());
    } else {
      params.delete("page");
    }
    router.push(`?${params.toString()}`);
  };

  const startEntry = (currentPage - 1) * pageSize + 1;
  const endEntry = Math.min(currentPage * pageSize, total);

  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {startEntry} to {endEntry} of {total} entries
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage - 1)}
          disabled={!hasPrev}
        >
          <IconChevronLeft className="mr-1 size-4" />
          Previous
        </Button>

        <span className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => goToPage(currentPage + 1)}
          disabled={!hasNext}
        >
          Next
          <IconChevronRight className="ml-1 size-4" />
        </Button>
      </div>
    </div>
  );
}
