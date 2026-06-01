"use client";

import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PAGE_SIZE, paginate } from "@/lib/pagination";

export function usePagination<T>(
  items: T[],
  pageSize: number = DEFAULT_PAGE_SIZE
) {
  const [page, setPage] = useState(1);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [totalItems, pageSize]);

  const result = useMemo(
    () => paginate(items, page, pageSize),
    [items, page, pageSize]
  );

  return {
    page: result.page,
    setPage,
    totalPages: result.totalPages,
    totalItems: result.totalItems,
    pageSize: result.pageSize,
    startIndex: result.startIndex,
    endIndex: result.endIndex,
    paginatedItems: result.items,
  };
}
