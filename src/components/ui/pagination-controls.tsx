import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { PaginationState } from "@/hooks/usePagination";

type PaginationControlsProps = {
  pagination: PaginationState;
  pageSizeOptions?: number[];
};

export function PaginationControls({
  pagination,
  pageSizeOptions = [10, 20, 50, 100],
}: PaginationControlsProps) {
  if (pagination.totalItems <= pageSizeOptions[0]) return null;

  return (
    <div className="flex items-center justify-between px-2 py-3">
      <p className="text-sm text-muted-foreground">
        Showing {pagination.startIndex + 1}–{pagination.endIndex} of{" "}
        {pagination.totalItems}
      </p>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="text-sm text-muted-foreground">Rows</span>
          <Select
            value={String(pagination.pageSize)}
            onValueChange={(v) => pagination.setPageSize(Number(v))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {pageSizeOptions.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!pagination.hasPrev}
            onClick={pagination.prevPage}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground min-w-[80px] text-center">
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            disabled={!pagination.hasNext}
            onClick={pagination.nextPage}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
