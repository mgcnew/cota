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

export { LazyImage, SimpleLazyImage } from './LazyImage';
export type { LazyImageProps } from './LazyImage';

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
