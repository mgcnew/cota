import { memo, useMemo, useCallback } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface DataPaginationProps {
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (items: number) => void;
  startIndex: number;
  endIndex: number;
}

export const DataPagination = memo(function DataPagination({
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  startIndex,
  endIndex,
}: DataPaginationProps) {
  // Valores padrão para evitar erros durante carregamento
  const safeItemsPerPage = itemsPerPage || 10;
  const safeTotalItems = totalItems || 0;
  const safeTotalPages = totalPages || 0;
  const safeCurrentPage = currentPage || 1;
  const safeStartIndex = startIndex ?? 0;
  const safeEndIndex = endIndex ?? 0;

  const pageNumbers = useMemo(() => {
    const pages: (number | "ellipsis")[] = [];
    const showEllipsis = safeTotalPages > 7;

    if (!showEllipsis) {
      for (let i = 1; i <= safeTotalPages; i++) {
        pages.push(i);
      }
    } else {
      if (safeCurrentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(safeTotalPages);
      } else if (safeCurrentPage >= safeTotalPages - 2) {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = safeTotalPages - 3; i <= safeTotalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push("ellipsis");
        for (let i = safeCurrentPage - 1; i <= safeCurrentPage + 1; i++) pages.push(i);
        pages.push("ellipsis");
        pages.push(safeTotalPages);
      }
    }

    return pages;
  }, [safeTotalPages, safeCurrentPage]);

  const handleItemsPerPageChange = useCallback((value: string) => {
    onItemsPerPageChange(Number(value));
  }, [onItemsPerPageChange]);

  const handlePrevious = useCallback(() => {
    if (safeCurrentPage > 1) onPageChange(safeCurrentPage - 1);
  }, [safeCurrentPage, onPageChange]);

  const handleNext = useCallback(() => {
    if (safeCurrentPage < safeTotalPages) onPageChange(safeCurrentPage + 1);
  }, [safeCurrentPage, safeTotalPages, onPageChange]);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 py-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>
          Mostrando {safeStartIndex + 1} a {safeEndIndex} de {safeTotalItems} resultados
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Itens por página:</span>
          <Select
            value={safeItemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {safeTotalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={handlePrevious}
                  className={safeCurrentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>

              {pageNumbers.map((page, idx) =>
                page === "ellipsis" ? (
                  <PaginationItem key={`ellipsis-${idx}`}>
                    <PaginationEllipsis />
                  </PaginationItem>
                ) : (
                  <PaginationItem key={page}>
                    <PaginationLink
                      onClick={() => onPageChange(page)}
                      isActive={safeCurrentPage === page}
                      className="cursor-pointer"
                    >
                      {page}
                    </PaginationLink>
                  </PaginationItem>
                )
              )}

              <PaginationItem>
                <PaginationNext
                  onClick={handleNext}
                  className={safeCurrentPage === safeTotalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </div>
    </div>
  );
});
