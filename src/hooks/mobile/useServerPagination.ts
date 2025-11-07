import { useState, useCallback, useMemo, useEffect } from "react";
import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { useMobileQueryConfig } from "./useMobileQueryConfig";

export interface ServerPaginationParams {
  page: number;
  pageSize: number;
  search?: string;
  filters?: Record<string, any>;
}

export interface ServerPaginationResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  pagination: {
    currentPage: number;
    pageSize: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    setPageSize: (size: number) => void;
    setItemsPerPage: (size: number) => void;
    onItemsPerPageChange: (size: number) => void;
  };
  refetch: () => void;
}

interface UseServerPaginationOptions<T> {
  queryKey: string[];
  queryFn: (params: ServerPaginationParams) => Promise<{
    data: T[];
    total: number;
  }>;
  initialPage?: number;
  initialPageSize?: number;
  enabled?: boolean;
}

/**
 * Hook para paginação server-side otimizada
 * 
 * Mobile: pageSize menor (20 itens)
 * Desktop: pageSize maior (50 itens)
 */
export function useServerPagination<T>({
  queryKey,
  queryFn,
  initialPage = 1,
  initialPageSize,
  enabled = true,
}: UseServerPaginationOptions<T>): ServerPaginationResult<T> {
  // ✅ Usar useState para isMobile para garantir consistência entre renders
  const [isMobile] = useState(() => 
    typeof window !== "undefined" && window.innerWidth < 768
  );
  const defaultPageSize = initialPageSize || (isMobile ? 20 : 50);
  
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);

  const mobileConfig = useMobileQueryConfig();

  // Extrair search e filters do queryKey se existirem
  // O último elemento do queryKey pode ser searchQuery
  const searchFromKey = queryKey[queryKey.length - 1] as string | undefined;
  const search = searchFromKey || "";

  const { data, isLoading, error, refetch: queryRefetch } = useQuery({
    queryKey: [...queryKey, currentPage, pageSize],
    queryFn: async () => {
      const result = await queryFn({ page: currentPage, pageSize, search, filters: {} });
      return result as { data: T[]; total: number };
    },
    enabled,
    ...mobileConfig,
    placeholderData: (previousData: any) => previousData,
  });

  // Resetar para primeira página quando search mudar
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchFromKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalItems = (data as any)?.total || 0;
  const totalPages = Math.ceil(totalItems / pageSize);

  const pagination = useMemo(
    () => {
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = Math.min(startIndex + pageSize, totalItems);
      
      return {
        currentPage,
        pageSize,
        itemsPerPage: pageSize,
        totalItems,
        totalPages,
        startIndex,
        endIndex,
        hasNextPage: currentPage < totalPages,
        hasPrevPage: currentPage > 1,
        goToPage: (page: number) => {
          const validPage = Math.max(1, Math.min(page, totalPages));
          setCurrentPage(validPage);
        },
        nextPage: () => {
          if (currentPage < totalPages) {
            setCurrentPage((prev) => prev + 1);
          }
        },
        prevPage: () => {
          if (currentPage > 1) {
            setCurrentPage((prev) => prev - 1);
          }
        },
        setPageSize: (size: number) => {
          setPageSize(size);
          setCurrentPage(1);
        },
        setItemsPerPage: (size: number) => {
          setPageSize(size);
          setCurrentPage(1);
        },
        onItemsPerPageChange: (size: number) => {
          setPageSize(size);
          setCurrentPage(1);
        },
      };
    },
    [currentPage, pageSize, totalItems, totalPages]
  );

  const refetch = useCallback(() => {
    queryRefetch();
  }, [queryRefetch]);

  return {
    data: (data as any)?.data || [],
    isLoading,
    error: error as Error | null,
    pagination,
    refetch,
  };
}

