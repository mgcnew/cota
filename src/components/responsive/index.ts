export { 
  ConditionalRender, 
  MobileOnly, 
  DesktopOnly 
} from './ConditionalRender';

export { ResponsiveModal } from './ResponsiveModal';
export type { ResponsiveModalProps } from './ResponsiveModal';

// Re-export useBreakpoint hook for convenience
export { useBreakpoint, BREAKPOINTS } from '@/hooks/useBreakpoint';
export type { Breakpoint, BreakpointState } from '@/hooks/useBreakpoint';
