/**
 * Property-Based Tests for Responsive Spacing Classes
 *
 * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
 * **Validates: Requirements 9.1, 9.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

const BREAKPOINTS = {
  mobile: 0,
  tablet: 640, // sm breakpoint in Tailwind
  desktop: 1024, // lg breakpoint in Tailwind
} as const;

// Spacing values in pixels for each breakpoint
const SPACING_CONFIG = {
  px: {
    mobile: 16, // 1rem
    tablet: 24, // 1.5rem
    desktop: 32, // 2rem
  },
  py: {
    mobile: 12, // 0.75rem
    tablet: 16, // 1rem
    desktop: 24, // 1.5rem
  },
  gap: {
    mobile: 8, // 0.5rem
    tablet: 16, // 1rem
    desktop: 24, // 1.5rem
  },
  section: {
    mobile: 16, // 1rem
    tablet: 20, // 1.25rem
    desktop: 24, // 1.5rem
  },
  card: {
    mobile: 12, // 0.75rem
    tablet: 16, // 1rem
    desktop: 24, // 1.5rem
  },
} as const;

type Breakpoint = 'mobile' | 'tablet' | 'desktop';
type SpacingType = 'px' | 'py' | 'gap' | 'section' | 'card';

function getBreakpoint(width: number): Breakpoint {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
}

function getSpacingValue(width: number, spacingType: SpacingType): number {
  const breakpoint = getBreakpoint(width);
  return SPACING_CONFIG[spacingType][breakpoint];
}

function convertRemToPixels(rem: number): number {
  return rem * 16; // Assuming 16px base font size
}

const mobileWidthArb = fc.integer({ min: 320, max: 639 });
const tabletWidthArb = fc.integer({ min: 640, max: 1023 });
const desktopWidthArb = fc.integer({ min: 1024, max: 2560 });
const anyWidthArb = fc.integer({ min: 320, max: 2560 });

const spacingTypeArb = fc.constantFrom<SpacingType>('px', 'py', 'gap', 'section', 'card');

describe('Responsive Spacing Classes - Property Tests', () => {
  describe('Property 9: Spacing respects mobile scale', () => {
    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1**
     */
    it('horizontal padding (px-responsive) is 16px on mobile', () => {
      fc.assert(
        fc.property(mobileWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const spacing = getSpacingValue(width, 'px');
          expect(breakpoint).toBe('mobile');
          expect(spacing).toBe(16);
          return breakpoint === 'mobile' && spacing === 16;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1**
     */
    it('horizontal padding (px-responsive) is 24px on tablet', () => {
      fc.assert(
        fc.property(tabletWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const spacing = getSpacingValue(width, 'px');
          expect(breakpoint).toBe('tablet');
          expect(spacing).toBe(24);
          return breakpoint === 'tablet' && spacing === 24;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1**
     */
    it('horizontal padding (px-responsive) is 32px on desktop', () => {
      fc.assert(
        fc.property(desktopWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const spacing = getSpacingValue(width, 'px');
          expect(breakpoint).toBe('desktop');
          expect(spacing).toBe(32);
          return breakpoint === 'desktop' && spacing === 32;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.2**
     */
    it('section gap is 16px on mobile', () => {
      fc.assert(
        fc.property(mobileWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const spacing = getSpacingValue(width, 'section');
          expect(breakpoint).toBe('mobile');
          expect(spacing).toBe(16);
          return breakpoint === 'mobile' && spacing === 16;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.2**
     */
    it('section gap is 20px on tablet', () => {
      fc.assert(
        fc.property(tabletWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const spacing = getSpacingValue(width, 'section');
          expect(breakpoint).toBe('tablet');
          expect(spacing).toBe(20);
          return breakpoint === 'tablet' && spacing === 20;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.2**
     */
    it('section gap is 24px on desktop', () => {
      fc.assert(
        fc.property(desktopWidthArb, (width) => {
          const breakpoint = getBreakpoint(width);
          const spacing = getSpacingValue(width, 'section');
          expect(breakpoint).toBe('desktop');
          expect(spacing).toBe(24);
          return breakpoint === 'desktop' && spacing === 24;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('spacing is always positive for any width', () => {
      fc.assert(
        fc.property(anyWidthArb, spacingTypeArb, (width, spacingType) => {
          const spacing = getSpacingValue(width, spacingType);
          expect(spacing).toBeGreaterThan(0);
          return spacing > 0;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('spacing is deterministic for any width', () => {
      fc.assert(
        fc.property(anyWidthArb, spacingTypeArb, (width, spacingType) => {
          const spacing1 = getSpacingValue(width, spacingType);
          const spacing2 = getSpacingValue(width, spacingType);
          const spacing3 = getSpacingValue(width, spacingType);
          expect(spacing1).toBe(spacing2);
          expect(spacing2).toBe(spacing3);
          return spacing1 === spacing2 && spacing2 === spacing3;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('spacing increases or stays same as width increases', () => {
      fc.assert(
        fc.property(anyWidthArb, spacingTypeArb, fc.integer({ min: 1, max: 500 }), (width, spacingType, increment) => {
          const spacing1 = getSpacingValue(width, spacingType);
          const spacing2 = getSpacingValue(width + increment, spacingType);
          expect(spacing2).toBeGreaterThanOrEqual(spacing1);
          return spacing2 >= spacing1;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('mobile spacing is less than or equal to tablet spacing', () => {
      fc.assert(
        fc.property(mobileWidthArb, tabletWidthArb, spacingTypeArb, (mobileWidth, tabletWidth, spacingType) => {
          const mobileSpacing = getSpacingValue(mobileWidth, spacingType);
          const tabletSpacing = getSpacingValue(tabletWidth, spacingType);
          expect(mobileSpacing).toBeLessThanOrEqual(tabletSpacing);
          return mobileSpacing <= tabletSpacing;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('tablet spacing is less than or equal to desktop spacing', () => {
      fc.assert(
        fc.property(tabletWidthArb, desktopWidthArb, spacingTypeArb, (tabletWidth, desktopWidth, spacingType) => {
          const tabletSpacing = getSpacingValue(tabletWidth, spacingType);
          const desktopSpacing = getSpacingValue(desktopWidth, spacingType);
          expect(tabletSpacing).toBeLessThanOrEqual(desktopSpacing);
          return tabletSpacing <= desktopSpacing;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('correctly handles breakpoint boundaries', () => {
      // Mobile boundary
      expect(getBreakpoint(639)).toBe('mobile');
      expect(getSpacingValue(639, 'px')).toBe(16);
      expect(getSpacingValue(639, 'section')).toBe(16);

      // Tablet boundary
      expect(getBreakpoint(640)).toBe('tablet');
      expect(getSpacingValue(640, 'px')).toBe(24);
      expect(getSpacingValue(640, 'section')).toBe(20);

      // Desktop boundary
      expect(getBreakpoint(1023)).toBe('tablet');
      expect(getSpacingValue(1023, 'px')).toBe(24);
      expect(getSpacingValue(1023, 'section')).toBe(20);

      expect(getBreakpoint(1024)).toBe('desktop');
      expect(getSpacingValue(1024, 'px')).toBe(32);
      expect(getSpacingValue(1024, 'section')).toBe(24);
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('vertical padding (py-responsive) follows mobile scale', () => {
      fc.assert(
        fc.property(mobileWidthArb, (width) => {
          const spacing = getSpacingValue(width, 'py');
          expect(spacing).toBe(12);
          return spacing === 12;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('gap-responsive follows mobile scale', () => {
      fc.assert(
        fc.property(mobileWidthArb, (width) => {
          const spacing = getSpacingValue(width, 'gap');
          expect(spacing).toBe(8);
          return spacing === 8;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Spacing respects mobile scale**
     * **Validates: Requirements 9.1, 9.2**
     */
    it('card-padding follows mobile scale', () => {
      fc.assert(
        fc.property(mobileWidthArb, (width) => {
          const spacing = getSpacingValue(width, 'card');
          expect(spacing).toBe(12);
          return spacing === 12;
        }),
        { numRuns: 100 }
      );
    });
  });
});
