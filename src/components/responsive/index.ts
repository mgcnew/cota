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

// Re-export useBreakpoint hook for convenience
export { useBreakpoint, BREAKPOINTS } from '@/hooks/useBreakpoint';
export type { Breakpoint, BreakpointState } from '@/hooks/useBreakpoint';
