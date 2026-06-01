"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPageNumbers } from "@/lib/pagination";

interface DataPaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  startIndex: number;
  endIndex: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function DataPagination({
  page,
  totalPages,
  totalItems,
  startIndex,
  endIndex,
  onPageChange,
  className,
}: DataPaginationProps) {
  if (totalItems === 0) return null;

  const pages = getPageNumbers(page, totalPages);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border/60 bg-muted/15 px-5 py-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <p className="text-sm text-muted-foreground">
        Showing{" "}
        <span className="font-medium text-foreground">
          {startIndex}–{endIndex}
        </span>{" "}
        of <span className="font-medium text-foreground">{totalItems}</span>
      </p>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon-xs"
          className="h-8 w-8 rounded-lg"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        {pages.map((pageNum) => (
          <Button
            key={pageNum}
            variant={pageNum === page ? "default" : "ghost"}
            size="icon-xs"
            className={cn(
              "h-8 min-w-8 rounded-lg text-xs font-semibold",
              pageNum === page &&
                "bg-[var(--brand-ink)] text-white hover:bg-[var(--brand-ink)]/90"
            )}
            onClick={() => onPageChange(pageNum)}
            aria-label={`Page ${pageNum}`}
            aria-current={pageNum === page ? "page" : undefined}
          >
            {pageNum}
          </Button>
        ))}

        <Button
          variant="ghost"
          size="icon-xs"
          className="h-8 w-8 rounded-lg"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
