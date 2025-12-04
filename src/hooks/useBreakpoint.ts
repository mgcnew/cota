import { useSyncExternalStore } from "react";

/**
 * Breakpoint configuration matching Tailwind CSS defaults
 * - mobile: 0 - 767px
 * - tablet: 768px - 1023px  
 * - desktop: 1024px+
 */
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

export interface BreakpointState {
  current: Breakpoint;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
}

// Cache for breakpoint state to avoid recalculations
let cachedState: BreakpointState | null = null;

function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
}

function calculateState(width: number): BreakpointState {
  const current = getBreakpoint(width);
  return {
    current,
    isMobile: current === 'mobile',
    isTablet: current === 'tablet',
    isDesktop: current === 'desktop',
    width,
  };
}

function getState(): BreakpointState {
  if (typeof window === 'undefined') {
    // SSR fallback: assume desktop
    return calculateState(BREAKPOINTS.desktop);
  }
  if (cachedState === null) {
    cachedState = calculateState(window.innerWidth);
  }
  return cachedState;
}

// Store for useSyncExternalStore - efficient subscription pattern
const subscribers = new Set<() => void>();

function subscribe(callback: () => void) {
  subscribers.add(callback);
  return () => subscribers.delete(callback);
}

function getSnapshot(): BreakpointState {
  return getState();
}

function getServerSnapshot(): BreakpointState {
  // SSR fallback: assume desktop for better initial render
  return calculateState(BREAKPOINTS.desktop);
}

// Global resize listener with debounce
if (typeof window !== 'undefined') {
  let resizeTimeout: number | null = null;
  
  window.addEventListener('resize', () => {
    if (resizeTimeout) {
      cancelAnimationFrame(resizeTimeout);
    }
    resizeTimeout = requestAnimationFrame(() => {
      const newWidth = window.innerWidth;
      const currentState = cachedState;
      const newBreakpoint = getBreakpoint(newWidth);
      
      // Only update if breakpoint changed or width changed significantly
      if (!currentState || currentState.current !== newBreakpoint || Math.abs(currentState.width - newWidth) > 10) {
        cachedState = calculateState(newWidth);
        subscribers.forEach(callback => callback());
      }
    });
  }, { passive: true });
}

/**
 * useBreakpoint - Hook for detecting current breakpoint and device type
 * 
 * Returns an object with:
 * - current: 'mobile' | 'tablet' | 'desktop'
 * - isMobile: boolean (width < 768px)
 * - isTablet: boolean (768px <= width < 1024px)
 * - isDesktop: boolean (width >= 1024px)
 * - width: current window width
 * 
 * Features:
 * - SSR support with desktop fallback
 * - Optimized with useSyncExternalStore
 * - Debounced resize handling
 * - Cached values to avoid recalculations
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, current } = useBreakpoint();
 * 
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * ```
 * 
 * Requirements: 1.1, 1.2, 6.5
 */
export function useBreakpoint(): BreakpointState {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export default useBreakpoint;
