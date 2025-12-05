import * as React from "react";
import { useEffect, useRef, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface InfiniteScrollProps {
  /**
   * Whether there are more items to load
   */
  hasMore: boolean;
  /**
   * Callback to load more items
   */
  loadMore: () => void;
  /**
   * Whether currently loading more items
   */
  isLoading?: boolean;
  /**
   * Custom loader element
   */
  loader?: React.ReactNode;
  /**
   * Threshold in pixels before the end to trigger loadMore
   * @default 200
   */
  threshold?: number;
  /**
   * Content to render
   */
  children: React.ReactNode;
  /**
   * Additional class name for the container
   */
  className?: string;
  /**
   * Additional class name for the loader container
   */
  loaderClassName?: string;
  /**
   * Text to show when loading
   * @default "Carregando..."
   */
  loadingText?: string;
  /**
   * Text to show when no more items
   * @default "Não há mais itens"
   */
  endText?: string;
  /**
   * Whether to show end message
   * @default false
   */
  showEndMessage?: boolean;
  /**
   * Root element for intersection observer (defaults to viewport)
   */
  root?: Element | null;
  /**
   * Root margin for intersection observer
   * @default "0px"
   */
  rootMargin?: string;
}

/**
 * Default loader component
 */
function DefaultLoader({ text = "Carregando..." }: { text?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
      <Loader2 className="h-5 w-5 animate-spin" />
      <span className="text-sm">{text}</span>
    </div>
  );
}

/**
 * InfiniteScroll - A component that loads more content when scrolling near the bottom.
 * 
 * Features:
 * - Uses Intersection Observer for efficient scroll detection
 * - Configurable threshold for when to trigger loading
 * - Custom loader support
 * - Shows end message when no more items
 * - Optimized for mobile performance
 * 
 * @example
 * ```tsx
 * <InfiniteScroll
 *   hasMore={hasNextPage}
 *   loadMore={fetchNextPage}
 *   isLoading={isFetchingNextPage}
 *   threshold={300}
 * >
 *   {items.map(item => (
 *     <ItemCard key={item.id} item={item} />
 *   ))}
 * </InfiniteScroll>
 * ```
 * 
 * Requirements: 5.3, 14.3
 */
export function InfiniteScroll({
  hasMore,
  loadMore,
  isLoading = false,
  loader,
  threshold = 200,
  children,
  className,
  loaderClassName,
  loadingText = "Carregando...",
  endText = "Não há mais itens",
  showEndMessage = false,
  root = null,
  rootMargin = "0px",
}: InfiniteScrollProps): JSX.Element {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);

  // Keep loadMore ref updated
  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  // Set up intersection observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMoreRef.current();
        }
      },
      {
        root,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, root, rootMargin, threshold]);

  return (
    <div className={cn("relative", className)}>
      {children}
      
      {/* Sentinel element for intersection observer */}
      <div 
        ref={sentinelRef} 
        className="h-1 w-full" 
        aria-hidden="true"
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className={cn("py-4", loaderClassName)}>
          {loader || <DefaultLoader text={loadingText} />}
        </div>
      )}
      
      {/* End message */}
      {showEndMessage && !hasMore && !isLoading && (
        <div className="py-4 text-center text-sm text-muted-foreground">
          {endText}
        </div>
      )}
    </div>
  );
}

/**
 * Hook for infinite scroll functionality
 * Useful when you need more control over the infinite scroll behavior
 */
export function useInfiniteScroll({
  hasMore,
  loadMore,
  isLoading = false,
  threshold = 200,
  root = null,
}: Pick<InfiniteScrollProps, 'hasMore' | 'loadMore' | 'isLoading' | 'threshold' | 'root'>) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef(loadMore);

  useEffect(() => {
    loadMoreRef.current = loadMore;
  }, [loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasMore && !isLoading) {
          loadMoreRef.current();
        }
      },
      {
        root,
        rootMargin: `${threshold}px`,
        threshold: 0,
      }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, isLoading, root, threshold]);

  return { sentinelRef };
}

export default InfiniteScroll;
