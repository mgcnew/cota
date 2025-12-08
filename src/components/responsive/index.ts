export { 
  ConditionalRender, 
  MobileOnly, 
  DesktopOnly 
} from './ConditionalRender';

export { ResponsiveModal } from './ResponsiveModal';
export type { ResponsiveModalProps } from './ResponsiveModal';

export { ResponsiveTable } from './ResponsiveTable';
export type { ResponsiveTableProps, Column, RowAction } from './ResponsiveTable';

export { ResponsiveCard } from './ResponsiveCard';
export type { ResponsiveCardProps, CardSize, CardPadding } from './ResponsiveCard';

export { ResponsiveGrid } from './ResponsiveGrid';
export type { ResponsiveGridProps, GridConfig } from './ResponsiveGrid';

export { ResponsiveFormField } from './ResponsiveFormField';
export type { ResponsiveFormFieldProps } from './ResponsiveFormField';

export { ResponsiveFormActions } from './ResponsiveFormActions';
export type { ResponsiveFormActionsProps } from './ResponsiveFormActions';

export {
  ResponsiveTabs,
  ResponsiveTabsList,
  ResponsiveTabsTrigger,
  ResponsiveTabsContent,
} from './ResponsiveTabs';

export { ResponsivePagination } from './ResponsivePagination';

export { LazyImage, SimpleLazyImage } from './LazyImage';
export type { LazyImageProps } from './LazyImage';

export { ResponsiveFilters } from './ResponsiveFilters';
export type { ResponsiveFiltersProps } from './ResponsiveFilters';

// New infrastructure components
export { PageSkeleton } from './PageSkeleton';
export type { PageSkeletonProps, PageSkeletonVariant } from './PageSkeleton';

export { VirtualList } from './VirtualList';
export type { VirtualListProps } from './VirtualList';

export { InfiniteScroll, useInfiniteScroll } from './InfiniteScroll';
export type { InfiniteScrollProps } from './InfiniteScroll';

export { MobileFilters } from './MobileFilters';
export type { MobileFiltersProps, FilterConfig } from './MobileFilters';

// Fade-in animation for loading completion (Requirements 10.4)
export { FadeIn, FadeInContent } from './FadeIn';
export type { FadeInProps, FadeInContentProps } from './FadeIn';

// Lazy loading for off-screen content (Requirements 12.5)
export { LazySection, useIntersectionObserver } from './LazySection';
export type { LazySectionProps } from './LazySection';

// Re-export useBreakpoint hook for convenience
export { useBreakpoint, BREAKPOINTS } from '@/hooks/useBreakpoint';
export type { Breakpoint, BreakpointState } from '@/hooks/useBreakpoint';

// Re-export mobile animation utilities
export { useMobileAnimations } from '@/hooks/useMobileAnimations';
export type { MobileAnimationOptions, UseMobileAnimationsReturn } from '@/hooks/useMobileAnimations';
export { 
  ANIMATION_CONFIG, 
  mobileAnimationClasses,
  getAnimationConfig,
  getTransitionDuration,
  getHoverClasses,
  buildAnimationClasses 
} from '@/utils/mobileAnimations';
