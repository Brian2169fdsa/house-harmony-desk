import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  pageSize: number;
  totalCount: number;
  onPrevPage: () => void;
  onNextPage: () => void;
}

export function Pagination({ page, pageSize, totalCount, onPrevPage, onNextPage }: PaginationProps) {
  const totalPages = Math.ceil(totalCount / pageSize);
  const isFirstPage = page === 0;
  const isLastPage = page >= totalPages - 1;

  if (totalCount <= pageSize) return null;

  return (
    <div className="flex items-center justify-between pt-4">
      <p className="text-sm text-muted-foreground">
        Showing {page * pageSize + 1}–{Math.min((page + 1) * pageSize, totalCount)} of {totalCount}
      </p>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={onPrevPage} disabled={isFirstPage}>
          <ChevronLeft className="h-4 w-4 mr-1" />
          Previous
        </Button>
        <Button variant="outline" size="sm" onClick={onNextPage} disabled={isLastPage}>
          Next
          <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
