/**
 * LazySection - Intersection Observer for Off-Screen Content (Requirements 12.5)
 * 
 * This component uses Intersection Observer to lazy load content that is below the fold.
 * Content is only rendered when it enters or is about to enter the viewport.
 * 
 * Features:
 * - Configurable root margin for preloading before visible
 * - Optional skeleton placeholder during loading
 * - Supports both immediate and deferred loading
 * - Memory efficient - only renders when needed
 * 
 * @example
 * ```tsx
 * <LazySection
 *   fallback={<Skeleton className="h-64 w-full" />}
 *   rootMargin="200px"
 * >
 *   <HeavyComponent />
 * </LazySection>
 * ```
 */

import { useState, useEffect, useRef, ReactNode, memo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface LazySectionProps {
  /**
   * Content to render when visible
   */
  children: ReactNode;
  /**
   * Fallback to show before content is loaded
   * @default Skeleton placeholder
   */
  fallback?: ReactNode;
  /**
   * Root margin for intersection observer
   * Positive values load content before it's visible
   * @default "100px"
   */
  rootMargin?: string;
  /**
   * Threshold for intersection (0-1)
   * @default 0
   */
  threshold?: number;
  /**
   * Whether to keep content rendered after first visibility
   * @default true
   */
  keepMounted?: boolean;
  /**
   * Minimum height for the placeholder
   * @default "200px"
   */
  minHeight?: string;
  /**
   * Additional class name for the container
   */
  className?: string;
  /**
   * Callback when section becomes visible
   */
  onVisible?: () => void;
  /**
   * Whether to disable lazy loading (always render)
   * @default false
   */
  disabled?: boolean;
}

/**
 * Default skeleton fallback
 */
function DefaultFallback({ minHeight }: { minHeight: string }) {
  return (
    <div className="w-full space-y-4" style={{ minHeight }}>
      <Skeleton className="h-8 w-3/4" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  );
}

/**
 * LazySection component for lazy loading off-screen content
 */
export const LazySection = memo(function LazySection({
  children,
  fallback,
  rootMargin = '100px',
  threshold = 0,
  keepMounted = true,
  minHeight = '200px',
  className,
  onVisible,
  disabled = false,
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(disabled);
  const [hasBeenVisible, setHasBeenVisible] = useState(disabled);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setIsVisible(true);
      setHasBeenVisible(true);
      return;
    }

    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
          onVisible?.();
          
          // If keepMounted, we can disconnect after first visibility
          if (keepMounted) {
            observer.disconnect();
          }
        } else if (!keepMounted) {
          setIsVisible(false);
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, keepMounted, onVisible, disabled]);

  // Determine what to render
  const shouldRenderContent = keepMounted ? hasBeenVisible : isVisible;

  return (
    <div 
      ref={containerRef} 
      className={cn('w-full', className)}
      style={{ minHeight: shouldRenderContent ? undefined : minHeight }}
    >
      {shouldRenderContent ? children : (fallback || <DefaultFallback minHeight={minHeight} />)}
    </div>
  );
});

/**
 * Hook for using intersection observer directly
 * Useful when you need more control over the lazy loading behavior
 */
export function useIntersectionObserver({
  rootMargin = '100px',
  threshold = 0,
  triggerOnce = true,
}: {
  rootMargin?: string;
  threshold?: number;
  triggerOnce?: boolean;
} = {}) {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        setIsIntersecting(entry.isIntersecting);
        
        if (entry.isIntersecting) {
          setHasIntersected(true);
          if (triggerOnce) {
            observer.disconnect();
          }
        }
      },
      {
        rootMargin,
        threshold,
      }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, triggerOnce]);

  return {
    ref,
    isIntersecting,
    hasIntersected,
  };
}

export default LazySection;
