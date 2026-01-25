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
} from "@/components/ui/pagination";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";

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

  const tokens = designSystem.components.pagination;

  return (
    <div className={tokens.wrapper}>
      {/* Resultados e Seletor de Itens */}
      <div className="flex items-center gap-6 order-2 sm:order-1">
        <div className={tokens.results}>
          {safeTotalItems > 0 ? (
            <>
              Mostrando <span className="text-foreground dark:text-zinc-200">{safeStartIndex + 1}</span> a <span className="text-foreground dark:text-zinc-200">{safeEndIndex}</span> de <span className="text-foreground dark:text-zinc-200">{safeTotalItems}</span> resultados
            </>
          ) : (
            "Nenhum resultado encontrado"
          )}
        </div>

        <div className="hidden md:flex items-center gap-2">
          <span className="text-[12px] font-medium text-zinc-400">Itens:</span>
          <Select
            value={safeItemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
          >
            <SelectTrigger className="h-8 w-[65px] bg-transparent border-zinc-200 dark:border-zinc-800 text-xs">
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
      </div>

      {/* Navegação */}
      {safeTotalPages > 1 && (
        <div className={cn(tokens.controls, "order-1 sm:order-2")}>
          <div className={tokens.nav}>
            <button
              onClick={handlePrevious}
              disabled={safeCurrentPage === 1}
              className={tokens.navButton}
              title="Anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            <Pagination className="w-auto mx-0">
              <PaginationContent className="gap-1.5 font-sans">
                {pageNumbers.map((page, idx) =>
                  page === "ellipsis" ? (
                    <PaginationItem key={`ellipsis-${idx}`}>
                      <PaginationEllipsis className="h-9 w-9 flex items-center justify-center text-zinc-400" />
                    </PaginationItem>
                  ) : (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => onPageChange(page)}
                        isActive={safeCurrentPage === page}
                        className={cn(
                          tokens.item,
                          safeCurrentPage === page ? tokens.active : tokens.inactive
                        )}
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  )
                )}
              </PaginationContent>
            </Pagination>

            <button
              onClick={handleNext}
              disabled={safeCurrentPage === safeTotalPages}
              className={tokens.navButton}
              title="Próxima"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
