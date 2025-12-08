import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export interface PedidosSkeletonProps {
  /**
   * Number of order cards to display
   * @default 6
   */
  itemCount?: number;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * PedidosSkeleton - Skeleton loading component for the Pedidos page.
 * 
 * Displays:
 * - 4 metric cards at the top
 * - Page header with search and filters
 * - Order cards/list items
 * 
 * Requirements: 5.1
 */
export function PedidosSkeleton({
  itemCount = 6,
  className,
}: PedidosSkeletonProps): JSX.Element {
  return (
    <div className={cn("space-y-4 sm:space-y-6 animate-in fade-in-0 duration-200", className)}>
      {/* Metric Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={`metric-${i}`} 
            className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 p-4"
          >
            <div className="flex items-center justify-between mb-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Page Header Skeleton */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-10 w-20 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <Skeleton className="h-10 w-full sm:w-64 rounded-xl" />
          <Skeleton className="h-10 w-full sm:w-40 rounded-xl" />
        </div>
      </div>

      {/* Order Cards - Mobile View */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: itemCount }).map((_, i) => (
          <div 
            key={`mobile-card-${i}`} 
            className="bg-white dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700/30 p-4"
          >
            <div className="flex items-start justify-between gap-3 mb-3">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700/30 flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
        ))}
      </div>

      {/* Order Table - Desktop View */}
      <div className="hidden md:block">
        {/* Table Header */}
        <div className="bg-white/95 dark:bg-gray-800/70 border border-orange-300/60 dark:border-orange-900/60 rounded-xl px-4 py-3 mb-3">
          <div className="flex items-center">
            <div className="w-[15%] flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="w-[18%] px-2">
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="hidden lg:block w-[18%] px-2">
              <Skeleton className="h-3 w-16" />
            </div>
            <div className="hidden xl:block w-[15%] px-2">
              <Skeleton className="h-3 w-14" />
            </div>
            <div className="w-[12%] px-2 flex justify-center">
              <Skeleton className="h-3 w-12" />
            </div>
            <div className="w-[12%] px-2 flex justify-center">
              <Skeleton className="h-3 w-10" />
            </div>
            <div className="w-[10%] pl-4 flex justify-end">
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        </div>

        {/* Table Rows */}
        <div className="space-y-3">
          {Array.from({ length: itemCount }).map((_, i) => (
            <div 
              key={`table-row-${i}`} 
              className="flex items-center p-3 bg-white/90 dark:bg-gray-800/50 rounded-lg border border-gray-300/70 dark:border-gray-700/30"
            >
              <div className="w-[15%] flex items-center gap-3 pr-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
              <div className="w-[18%] px-2 space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-5 w-16 rounded-md" />
              </div>
              <div className="hidden lg:block w-[18%] px-2 space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-16" />
              </div>
              <div className="hidden xl:block w-[15%] px-2 space-y-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>
              <div className="w-[12%] px-2 flex justify-center">
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="w-[12%] px-2 flex justify-center">
                <Skeleton className="h-5 w-20" />
              </div>
              <div className="w-[10%] pl-4 flex justify-end">
                <Skeleton className="h-8 w-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Pagination Skeleton */}
      <div className="border-t border-gray-200 dark:border-gray-700 px-3 sm:px-4 py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <Skeleton className="h-4 w-24" />
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
            <Skeleton className="h-8 w-8 rounded-md" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default PedidosSkeleton;
