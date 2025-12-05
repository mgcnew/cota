import * as React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/**
 * Variants for PageSkeleton component
 * - dashboard: Hero cards + metrics grid + charts
 * - list: Search bar + list items
 * - grid: Search bar + grid of cards
 * - form: Form fields layout
 */
export type PageSkeletonVariant = 'dashboard' | 'list' | 'grid' | 'form';

export interface PageSkeletonProps {
  /**
   * The variant of skeleton to display
   * @default 'list'
   */
  variant?: PageSkeletonVariant;
  /**
   * Number of sections to display
   * @default 3
   */
  sections?: number;
  /**
   * Number of items per section
   * @default 4
   */
  itemsPerSection?: number;
  /**
   * Additional class name
   */
  className?: string;
}

/**
 * Dashboard skeleton - Hero cards + metrics + charts
 */
function DashboardSkeleton({ sections = 3, itemsPerSection = 4 }: Pick<PageSkeletonProps, 'sections' | 'itemsPerSection'>) {
  return (
    <div className="space-y-6">
      {/* Hero card */}
      <Skeleton className="h-32 w-full rounded-xl" />
      
      {/* Metrics grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: itemsPerSection }).map((_, i) => (
          <Skeleton key={`metric-${i}`} className="h-24 rounded-lg" />
        ))}
      </div>
      
      {/* Charts section */}
      {Array.from({ length: Math.min(sections - 1, 2) }).map((_, i) => (
        <div key={`chart-section-${i}`} className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-64 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

/**
 * List skeleton - Search + list items
 */
function ListSkeleton({ itemsPerSection = 6 }: Pick<PageSkeletonProps, 'itemsPerSection'>) {
  return (
    <div className="space-y-4">
      {/* Search bar */}
      <div className="flex gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <Skeleton className="h-10 w-24 rounded-md" />
      </div>
      
      {/* List items */}
      <div className="space-y-3">
        {Array.from({ length: itemsPerSection }).map((_, i) => (
          <div key={`list-item-${i}`} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-12 w-12 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Grid skeleton - Search + grid of cards
 */
function GridSkeleton({ itemsPerSection = 6 }: Pick<PageSkeletonProps, 'itemsPerSection'>) {
  return (
    <div className="space-y-4">
      {/* Search and filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Skeleton className="h-10 flex-1 rounded-md" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-24 rounded-md" />
          <Skeleton className="h-10 w-24 rounded-md" />
        </div>
      </div>
      
      {/* Grid of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: itemsPerSection }).map((_, i) => (
          <div key={`grid-item-${i}`} className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <Skeleton className="h-20 w-full rounded-md" />
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-8 w-8 rounded-md" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Form skeleton - Form fields layout
 */
function FormSkeleton({ sections = 3, itemsPerSection = 3 }: Pick<PageSkeletonProps, 'sections' | 'itemsPerSection'>) {
  return (
    <div className="space-y-6">
      {Array.from({ length: sections }).map((_, sectionIndex) => (
        <div key={`form-section-${sectionIndex}`} className="space-y-4">
          {/* Section title */}
          <Skeleton className="h-6 w-32" />
          
          {/* Form fields */}
          <div className="space-y-4">
            {Array.from({ length: itemsPerSection }).map((_, fieldIndex) => (
              <div key={`field-${sectionIndex}-${fieldIndex}`} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>
      ))}
      
      {/* Submit button */}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-24 rounded-md" />
        <Skeleton className="h-10 w-32 rounded-md" />
      </div>
    </div>
  );
}

/**
 * PageSkeleton - A skeleton component that replicates the structure of different page types.
 * 
 * Features:
 * - Dashboard variant: Hero cards + metrics grid + charts
 * - List variant: Search bar + list items
 * - Grid variant: Search bar + grid of cards
 * - Form variant: Form fields layout
 * - Configurable sections and items per section
 * - Uses existing Skeleton component as base
 * 
 * @example
 * ```tsx
 * // Dashboard skeleton
 * <PageSkeleton variant="dashboard" />
 * 
 * // List with 10 items
 * <PageSkeleton variant="list" itemsPerSection={10} />
 * 
 * // Grid with custom sections
 * <PageSkeleton variant="grid" sections={2} itemsPerSection={6} />
 * ```
 * 
 * Requirements: 1.1, 10.1
 */
export function PageSkeleton({
  variant = 'list',
  sections = 3,
  itemsPerSection = 4,
  className,
}: PageSkeletonProps): JSX.Element {
  const content = React.useMemo(() => {
    switch (variant) {
      case 'dashboard':
        return <DashboardSkeleton sections={sections} itemsPerSection={itemsPerSection} />;
      case 'list':
        return <ListSkeleton itemsPerSection={itemsPerSection} />;
      case 'grid':
        return <GridSkeleton itemsPerSection={itemsPerSection} />;
      case 'form':
        return <FormSkeleton sections={sections} itemsPerSection={itemsPerSection} />;
      default:
        return <ListSkeleton itemsPerSection={itemsPerSection} />;
    }
  }, [variant, sections, itemsPerSection]);

  return (
    <div className={cn("animate-in fade-in-0 duration-200", className)}>
      {content}
    </div>
  );
}

export default PageSkeleton;
