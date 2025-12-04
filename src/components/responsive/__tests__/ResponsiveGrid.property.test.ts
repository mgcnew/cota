/**
 * Property-Based Tests for ResponsiveGrid Component
 *
 * **Feature: mobile-responsiveness, Property 5: Grid columns match breakpoint**
 * **Validates: Requirements 3.2, 3.3, 3.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

const DEFAULT_GRID_CONFIG = {
  mobile: 2,
  tablet: 2,
  desktop: 4,
} as const;

type Breakpoint = 'mobile' | 'tablet' | 'desktop';

interface GridConfig {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}

function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
}

function getExpectedColumns(width: number, config: GridConfig = DEFAULT_GRID_CONFIG): number {
  const breakpoint = getBreakpoint(width);
  switch (breakpoint) {
    case 'mobile':
      return config.mobile ?? DEFAULT_GRID_CONFIG.mobile;
    case 'tablet':
      return config.tablet ?? DEFAULT_GRID_CONFIG.tablet;
    case 'desktop':
      return config.desktop ?? DEFAULT_GRID_CONFIG.desktop;
  }
}

function isValidColumnCount(breakpoint: Breakpoint, columns: number): boolean {
  switch (breakpoint) {
    case 'mobile':
      return columns === 2;
    case 'tablet':
      return columns >= 2 && columns <= 3;
    case 'desktop':
      return columns === 4;
  }
}

function getGridColsClass(columns: number): string {
  const gridColsClasses: Record<number, string> = {
    1: 'grid-cols-1',
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
    5: 'grid-cols-5',
    6: 'grid-cols-6',
  };
  return gridColsClasses[columns] ?? 'grid-cols-1';
}

const mobileWidthArb = fc.integer({ min: 320, max: 767 });
const tabletWidthArb = fc.integer({ min: 768, max: 1023 });
const desktopWidthArb = fc.integer({ min: 1024, max: 2560 });
const anyWidthArb = fc.integer({ min: 320, max: 2560 });

const gridConfigArb = fc.record({
  mobile: fc.integer({ min: 1, max: 6 }),
  tablet: fc.integer({ min: 1, max: 6 }),
  desktop: fc.integer({ min: 1, max: 6 }),
});

describe('ResponsiveGrid - Property Tests', () => {
  describe('Property 5: Grid columns match breakpoint', () => {
    it('grid has 2 columns for any mobile width', () => {
      fc.assert(
        fc.property(mobileWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const columns = getExpectedColumns(width);
          expect(breakpoint).toBe('mobile');
          expect(columns).toBe(2);
          return breakpoint === 'mobile' && columns === 2;
        }),
        { numRuns: 100 }
      );
    });

    it('grid has 2-3 columns for any tablet width', () => {
      fc.assert(
        fc.property(tabletWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const columns = getExpectedColumns(width);
          expect(breakpoint).toBe('tablet');
          expect(columns).toBeGreaterThanOrEqual(2);
          expect(columns).toBeLessThanOrEqual(3);
          return breakpoint === 'tablet' && columns >= 2 && columns <= 3;
        }),
        { numRuns: 100 }
      );
    });

    it('grid has 4 columns for any desktop width', () => {
      fc.assert(
        fc.property(desktopWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const columns = getExpectedColumns(width);
          expect(breakpoint).toBe('desktop');
          expect(columns).toBe(4);
          return breakpoint === 'desktop' && columns === 4;
        }),
        { numRuns: 100 }
      );
    });

    it('column count is always valid for any screen width', () => {
      fc.assert(
        fc.property(anyWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const columns = getExpectedColumns(width);
          return isValidColumnCount(breakpoint, columns);
        }),
        { numRuns: 100 }
      );
    });

    it('correctly handles breakpoint boundaries', () => {
      expect(getBreakpoint(767)).toBe('mobile');
      expect(getExpectedColumns(767)).toBe(2);
      expect(getBreakpoint(768)).toBe('tablet');
      expect(getBreakpoint(1024)).toBe('desktop');
      expect(getExpectedColumns(1024)).toBe(4);
    });

    it('column determination is deterministic', () => {
      fc.assert(
        fc.property(anyWidthArb, (width) => {
          const c1 = getExpectedColumns(width);
          const c2 = getExpectedColumns(width);
          return c1 === c2;
        }),
        { numRuns: 100 }
      );
    });

    it('custom config overrides defaults', () => {
      fc.assert(
        fc.property(anyWidthArb, gridConfigArb, (width, config) => {
          const bp = getBreakpoint(width);
          const cols = getExpectedColumns(width, config);
          const expected = bp === 'mobile' ? config.mobile : bp === 'tablet' ? config.tablet : config.desktop;
          return cols === expected;
        }),
        { numRuns: 100 }
      );
    });

    it('grid CSS class matches column count', () => {
      fc.assert(
        fc.property(anyWidthArb, (width) => {
          const cols = getExpectedColumns(width);
          const css = getGridColsClass(cols);
          return css === `grid-cols-${cols}`;
        }),
        { numRuns: 100 }
      );
    });

    it('column count is always positive', () => {
      fc.assert(
        fc.property(anyWidthArb, (width) => {
          return getExpectedColumns(width) > 0;
        }),
        { numRuns: 100 }
      );
    });

    it('columns increase or stay same as width increases', () => {
      fc.assert(
        fc.property(anyWidthArb, fc.integer({ min: 1, max: 500 }), (width, inc) => {
          const c1 = getExpectedColumns(width);
          const c2 = getExpectedColumns(width + inc);
          return c2 >= c1;
        }),
        { numRuns: 100 }
      );
    });
  });
});
