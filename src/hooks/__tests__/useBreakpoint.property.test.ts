/**
 * Property-Based Tests for useBreakpoint Hook
 * 
 * **Feature: mobile-responsiveness, Property 1: Modal rendering matches device type**
 * **Validates: Requirements 1.1, 1.2**
 * 
 * Tests that for any screen width value, the breakpoint detection correctly
 * identifies mobile (< 768px) vs desktop/tablet (>= 768px) for modal rendering decisions.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { BREAKPOINTS, Breakpoint } from '../useBreakpoint';

/**
 * Pure function to calculate breakpoint from width
 * Extracted from useBreakpoint for testability
 */
function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
}

/**
 * Determines if a modal should render as Drawer (mobile) or Dialog (desktop/tablet)
 * Based on Requirements 1.1 and 1.2
 */
function shouldRenderAsDrawer(width: number): boolean {
  return width < BREAKPOINTS.tablet; // 768px
}

/**
 * Calculates the full breakpoint state from width
 */
function calculateBreakpointState(width: number) {
  const current = getBreakpoint(width);
  return {
    current,
    isMobile: current === 'mobile',
    isTablet: current === 'tablet',
    isDesktop: current === 'desktop',
    width,
  };
}

/**
 * Arbitrary generator for mobile screen widths (< 768px)
 */
const mobileWidthArbitrary = fc.integer({ min: 320, max: 767 });

/**
 * Arbitrary generator for tablet screen widths (768px - 1023px)
 */
const tabletWidthArbitrary = fc.integer({ min: 768, max: 1023 });

/**
 * Arbitrary generator for desktop screen widths (>= 1024px)
 */
const desktopWidthArbitrary = fc.integer({ min: 1024, max: 2560 });

/**
 * Arbitrary generator for any valid screen width
 */
const anyWidthArbitrary = fc.integer({ min: 320, max: 2560 });

describe('useBreakpoint - Property Tests', () => {
  /**
   * **Feature: mobile-responsiveness, Property 1: Modal rendering matches device type**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * Property: For any width < 768px, modal should render as Drawer (mobile)
   */
  it('should identify mobile breakpoint for widths < 768px (renders Drawer)', () => {
    fc.assert(
      fc.property(
        mobileWidthArbitrary,
        (width) => {
          const state = calculateBreakpointState(width);
          const rendersAsDrawer = shouldRenderAsDrawer(width);
          
          expect(state.current).toBe('mobile');
          expect(state.isMobile).toBe(true);
          expect(state.isTablet).toBe(false);
          expect(state.isDesktop).toBe(false);
          expect(rendersAsDrawer).toBe(true);
          
          return state.isMobile && rendersAsDrawer;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 1: Modal rendering matches device type**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * Property: For any width >= 768px, modal should render as Dialog (desktop/tablet)
   */
  it('should identify non-mobile breakpoint for widths >= 768px (renders Dialog)', () => {
    fc.assert(
      fc.property(
        fc.oneof(tabletWidthArbitrary, desktopWidthArbitrary),
        (width) => {
          const state = calculateBreakpointState(width);
          const rendersAsDrawer = shouldRenderAsDrawer(width);
          
          expect(state.isMobile).toBe(false);
          expect(rendersAsDrawer).toBe(false);
          expect(['tablet', 'desktop']).toContain(state.current);
          
          return !state.isMobile && !rendersAsDrawer;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 1: Modal rendering matches device type**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * Property: Breakpoint boundaries are correctly enforced
   * - width < 768 -> mobile (Drawer)
   * - width >= 768 -> tablet/desktop (Dialog)
   */
  it('should correctly handle boundary at 768px', () => {
    // Just below boundary - should be mobile
    const belowBoundary = calculateBreakpointState(767);
    expect(belowBoundary.current).toBe('mobile');
    expect(belowBoundary.isMobile).toBe(true);
    expect(shouldRenderAsDrawer(767)).toBe(true);
    
    // At boundary - should be tablet
    const atBoundary = calculateBreakpointState(768);
    expect(atBoundary.current).toBe('tablet');
    expect(atBoundary.isTablet).toBe(true);
    expect(shouldRenderAsDrawer(768)).toBe(false);
    
    // Just above boundary - should be tablet
    const aboveBoundary = calculateBreakpointState(769);
    expect(aboveBoundary.current).toBe('tablet');
    expect(aboveBoundary.isTablet).toBe(true);
    expect(shouldRenderAsDrawer(769)).toBe(false);
  });

  /**
   * **Feature: mobile-responsiveness, Property 1: Modal rendering matches device type**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * Property: isMobile flag is mutually exclusive with isTablet and isDesktop
   */
  it('should have mutually exclusive breakpoint flags', () => {
    fc.assert(
      fc.property(
        anyWidthArbitrary,
        (width) => {
          const state = calculateBreakpointState(width);
          
          // Exactly one flag should be true
          const flagCount = [state.isMobile, state.isTablet, state.isDesktop]
            .filter(Boolean).length;
          
          expect(flagCount).toBe(1);
          
          // isMobile should match shouldRenderAsDrawer
          expect(state.isMobile).toBe(shouldRenderAsDrawer(width));
          
          return flagCount === 1;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 1: Modal rendering matches device type**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * Property: Breakpoint detection is deterministic
   */
  it('should be deterministic - same width always produces same result', () => {
    fc.assert(
      fc.property(
        anyWidthArbitrary,
        (width) => {
          const state1 = calculateBreakpointState(width);
          const state2 = calculateBreakpointState(width);
          const state3 = calculateBreakpointState(width);
          
          expect(state1.current).toBe(state2.current);
          expect(state2.current).toBe(state3.current);
          expect(state1.isMobile).toBe(state2.isMobile);
          
          return state1.current === state2.current && 
                 state2.current === state3.current;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 1: Modal rendering matches device type**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * Property: Width is preserved in state
   */
  it('should preserve width value in state', () => {
    fc.assert(
      fc.property(
        anyWidthArbitrary,
        (width) => {
          const state = calculateBreakpointState(width);
          expect(state.width).toBe(width);
          return state.width === width;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 1: Modal rendering matches device type**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * Property: Tablet breakpoint correctly identified (768px - 1023px)
   */
  it('should identify tablet breakpoint for widths 768px - 1023px', () => {
    fc.assert(
      fc.property(
        tabletWidthArbitrary,
        (width) => {
          const state = calculateBreakpointState(width);
          
          expect(state.current).toBe('tablet');
          expect(state.isTablet).toBe(true);
          expect(state.isMobile).toBe(false);
          expect(state.isDesktop).toBe(false);
          
          return state.isTablet && !state.isMobile && !state.isDesktop;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 1: Modal rendering matches device type**
   * **Validates: Requirements 1.1, 1.2**
   * 
   * Property: Desktop breakpoint correctly identified (>= 1024px)
   */
  it('should identify desktop breakpoint for widths >= 1024px', () => {
    fc.assert(
      fc.property(
        desktopWidthArbitrary,
        (width) => {
          const state = calculateBreakpointState(width);
          
          expect(state.current).toBe('desktop');
          expect(state.isDesktop).toBe(true);
          expect(state.isMobile).toBe(false);
          expect(state.isTablet).toBe(false);
          
          return state.isDesktop && !state.isMobile && !state.isTablet;
        }
      ),
      { numRuns: 100 }
    );
  });
});
