import { useState, useMemo } from "react";

export type PaginationState = {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  startIndex: number;
  endIndex: number;
  hasPrev: boolean;
  hasNext: boolean;
  setPage: (page: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  setPageSize: (size: number) => void;
};

export function usePagination<T>(
  items: T[],
  initialPageSize = 20
): { paginatedItems: T[]; pagination: PaginationState } {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // Clamp page to valid range
  const safePage = Math.min(Math.max(1, page), totalPages);
  if (safePage !== page) setPage(safePage);

  const startIndex = (safePage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  const paginatedItems = useMemo(
    () => items.slice(startIndex, endIndex),
    [items, startIndex, endIndex]
  );

  const pagination: PaginationState = {
    page: safePage,
    pageSize,
    totalItems,
    totalPages,
    startIndex,
    endIndex,
    hasPrev: safePage > 1,
    hasNext: safePage < totalPages,
    setPage,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
    setPageSize: (size: number) => {
      setPageSizeState(size);
      setPage(1);
    },
  };

  return { paginatedItems, pagination };
}
