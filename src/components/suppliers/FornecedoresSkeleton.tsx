import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * FornecedoresSkeleton - Skeleton loading state for Fornecedores page
 * Prioritizes above-the-fold content (metrics + first cards)
 * 
 * Requirements: 4.1 - Priorizar renderização above-the-fold
 */
export function FornecedoresSkeleton(): JSX.Element {
  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in-0 duration-100">
      {/* Metrics Grid - Above the fold priority */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={`metric-${i}`} className="bg-white dark:bg-gray-800/50 rounded-xl border p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Page Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-7 w-40" />
            <Skeleton className="h-4 w-64" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24 rounded-md hidden sm:block" />
            <Skeleton className="h-10 w-36 rounded-md" />
          </div>
        </div>
        
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Skeleton className="h-10 w-64 rounded-md" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-[150px] rounded-md" />
            <Skeleton className="h-10 w-20 rounded-md" />
          </div>
        </div>
      </div>

      {/* First 3 supplier cards - Above the fold */}
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div 
            key={`supplier-${i}`} 
            className="bg-white dark:bg-gray-800/50 rounded-xl border p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default FornecedoresSkeleton;
