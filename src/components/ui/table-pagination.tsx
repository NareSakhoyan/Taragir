"use client";

import { useId, useMemo, useState } from "react";
import { ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useI18n } from "@/lib/i18n/use-i18n";

type TablePaginationProps = {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  isBusy?: boolean;
};

function getVisiblePages(currentPage: number, totalPages: number) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | "ellipsis"> = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push("ellipsis");
  }

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  if (end < totalPages - 1) {
    pages.push("ellipsis");
  }

  pages.push(totalPages);
  return pages;
}

export function TablePagination({
  currentPage,
  totalPages,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  isBusy = false,
}: TablePaginationProps) {
  const { messages } = useI18n();
  const [pageInput, setPageInput] = useState("");
  const pageJumpInputId = useId();

  const pages = useMemo(() => getVisiblePages(currentPage, totalPages), [currentPage, totalPages]);

  function submitPageJump() {
    const nextPage = Number(pageInput);

    if (!Number.isFinite(nextPage)) {
      return;
    }

    const clampedPage = Math.min(Math.max(1, Math.trunc(nextPage)), totalPages);
    onPageChange(clampedPage);
    setPageInput("");
  }

  return (
    <div className="mt-6 flex flex-col gap-4 text-sm text-muted-foreground xl:flex-row xl:items-center xl:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <label className="flex items-center gap-2 whitespace-nowrap">
          <span className="whitespace-nowrap">{messages.common.rowsPerPage}</span>
          <select
            className="h-10 rounded-md border border-input bg-background/80 px-3 text-sm text-foreground outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring"
            disabled={isBusy}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            value={pageSize}
          >
            {pageSizeOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            submitPageJump();
          }}
        >
          <label className="whitespace-nowrap" htmlFor={pageJumpInputId}>
            {messages.common.goToPage}
          </label>
          <Input
            className="h-10 w-24"
            disabled={isBusy}
            id={pageJumpInputId}
            inputMode="numeric"
            max={totalPages}
            min={1}
            onChange={(event) => setPageInput(event.target.value)}
            placeholder={String(currentPage)}
            value={pageInput}
          />
          <Button disabled={isBusy} size="icon" type="submit" variant="outline">
            <ChevronRight className="h-4 w-4" />
            <span className="sr-only">{messages.common.go}</span>
          </Button>
        </form>
      </div>

      <Pagination className="justify-end">
        <PaginationContent>
          <PaginationItem>
            <PaginationLink
              aria-label={messages.common.first}
              disabled={isBusy || currentPage <= 1}
              onClick={() => onPageChange(1)}
              size="icon"
              variant="outline"
            >
              <ChevronsLeft className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>

          <PaginationItem>
            <PaginationPrevious
              disabled={isBusy || currentPage <= 1}
              onClick={() => onPageChange(Math.max(1, currentPage - 1))}
              size="icon"
              variant="outline"
            />
          </PaginationItem>

          {pages.map((page, index) => (
            <PaginationItem key={`${page}-${index}`}>
              {page === "ellipsis" ? (
                <PaginationEllipsis />
              ) : (
                <PaginationLink
                  isActive={page === currentPage}
                  onClick={() => !isBusy && onPageChange(page)}
                  variant={page === currentPage ? "default" : "ghost"}
                >
                  {page}
                </PaginationLink>
              )}
            </PaginationItem>
          ))}

          <PaginationItem>
            <PaginationNext
              disabled={isBusy || currentPage >= totalPages}
              onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
              size="icon"
              variant="outline"
            />
          </PaginationItem>

          <PaginationItem>
            <PaginationLink
              aria-label={messages.common.last}
              disabled={isBusy || currentPage >= totalPages}
              onClick={() => onPageChange(totalPages)}
              size="icon"
              variant="outline"
            >
              <ChevronsRight className="h-4 w-4" />
            </PaginationLink>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  );
}
