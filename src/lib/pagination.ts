export const DEFAULT_PAGE_SIZE = 5; // Default to 5 rows per page for Leave Attendance

export function paginate<T>(items: T[], page: number, pageSize = DEFAULT_PAGE_SIZE) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    items: items.slice(startIndex, endIndex),
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    startIndex: totalItems === 0 ? 0 : startIndex + 1,
    endIndex,
  };
}

export function getPageNumbers(current: number, total: number, maxVisible = 5): number[] {
  if (total <= maxVisible) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const half = Math.floor(maxVisible / 2);
  let start = Math.max(1, current - half);
  const end = Math.min(total, start + maxVisible - 1);
  start = Math.max(1, end - maxVisible + 1);

  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
