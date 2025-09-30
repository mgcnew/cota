import { useState, useMemo } from 'react';
import { PaginationData } from '@/types/pagination';

interface UsePaginationProps {
  initialPage?: number;
  initialItemsPerPage?: number;
}

export function usePagination<T>({
  initialPage = 1,
  initialItemsPerPage = 10,
}: UsePaginationProps = {}) {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const paginate = (items: T[]): PaginationData<T> => {
    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedItems = items.slice(startIndex, endIndex);

    return {
      items: paginatedItems,
      pagination: {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        startIndex,
        endIndex,
        goToPage: (page: number) => {
          const validPage = Math.max(1, Math.min(page, totalPages));
          setCurrentPage(validPage);
        },
        nextPage: () => {
          if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
          }
        },
        prevPage: () => {
          if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
          }
        },
        setItemsPerPage: (items: number) => {
          setItemsPerPage(items);
          setCurrentPage(1);
        },
      },
    };
  };

  return { paginate, currentPage, itemsPerPage };
}
