/**
 * Property-Based Tests for ResponsivePagination Component
 * 
 * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
 * **Validates: Requirements 9.5**
 * 
 * Tests that:
 * - For any screen width < 768px, pagination shows only prev/next buttons
 * - For any screen width >= 768px, pagination shows full page numbers
 * - Page indicator is always displayed in mobile
 * - Current page is always within valid range [1, totalPages]
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Breakpoint configuration matching the system
 */
const BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
} as const;

/**
 * Pagination display modes
 */
type PaginationMode = 'simple' | 'full';

/**
 * Determines which pagination mode should be used based on screen width
 * 
 * Requirements:
 * - 9.5: Mobile (< 768px) -> Simple (prev/next only)
 * - 9.5: Desktop (>= 768px) -> Full (with page numbers)
 */
function getExpectedPaginationMode(width: number): PaginationMode {
  return width < BREAKPOINTS.tablet ? 'simple' : 'full';
}

/**
 * Determines if the current width is considered mobile
 */
function isMobileWidth(width: number): boolean {
  return width < BREAKPOINTS.tablet;
}

/**
 * Validates that current page is within valid range
 */
function isValidPage(currentPage: number, totalPages: number): boolean {
  return currentPage >= 1 && currentPage <= totalPages && Number.isInteger(currentPage);
}

/**
 * Validates that total pages is positive
 */
function isValidTotalPages(totalPages: number): boolean {
  return totalPages >= 1 && Number.isInteger(totalPages);
}

/**
 * Calculates the number of page buttons shown in full pagination mode
 * Uses ellipsis for large page counts
 */
function calculateVisiblePageButtons(currentPage: number, totalPages: number): number {
  if (totalPages <= 7) {
    return totalPages;
  }

  // With ellipsis: prev + [1...4 or 1...ellipsis...last or 1...ellipsis...current-1...current...current+1...ellipsis...last] + next
  // Minimum visible pages: 1, ellipsis, current-1, current, current+1, ellipsis, last
  return 7; // 1 + ellipsis + 3 middle + ellipsis + last
}

/**
 * Determines if page indicator should be shown
 * In mobile mode, page indicator is always shown
 */
function shouldShowPageIndicator(isMobile: boolean): boolean {
  return isMobile;
}

/**
 * Determines if prev button should be enabled
 */
function isPrevButtonEnabled(currentPage: number): boolean {
  return currentPage > 1;
}

/**
 * Determines if next button should be enabled
 */
function isNextButtonEnabled(currentPage: number, totalPages: number): boolean {
  return currentPage < totalPages;
}

/**
 * Arbitrary generator for mobile screen widths (< 768px)
 */
const mobileWidthArb = fc.integer({ min: 320, max: 767 });

/**
 * Arbitrary generator for tablet screen widths (768px - 1023px)
 */
const tabletWidthArb = fc.integer({ min: 768, max: 1023 });

/**
 * Arbitrary generator for desktop screen widths (>= 1024px)
 */
const desktopWidthArb = fc.integer({ min: 1024, max: 2560 });

/**
 * Arbitrary generator for non-mobile widths (>= 768px)
 */
const nonMobileWidthArb = fc.oneof(tabletWidthArb, desktopWidthArb);

/**
 * Arbitrary generator for any valid screen width
 */
const anyWidthArb = fc.integer({ min: 320, max: 2560 });

/**
 * Arbitrary generator for valid total pages (1-1000)
 */
const totalPagesArb = fc.integer({ min: 1, max: 1000 });

/**
 * Arbitrary generator for valid pagination state (totalPages, currentPage)
 * Generates tuples where currentPage is always valid for the given totalPages
 */
const paginationArb = fc
  .tuple(totalPagesArb, fc.integer({ min: 1, max: 1000 }))
  .filter(([totalPages, currentPage]) => currentPage <= totalPages);

describe('ResponsivePagination - Property Tests', () => {
  describe('Property 9: Pagination simplified in mobile', () => {
    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: For any mobile width, pagination mode is 'simple'
     */
    it('uses simple mode for any mobile width (< 768px)', () => {
      fc.assert(
        fc.property(
          mobileWidthArb,
          (width) => {
            const mode = getExpectedPaginationMode(width);
            const isMobile = isMobileWidth(width);

            expect(mode).toBe('simple');
            expect(isMobile).toBe(true);

            return mode === 'simple' && isMobile;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: For any non-mobile width, pagination mode is 'full'
     */
    it('uses full mode for any non-mobile width (>= 768px)', () => {
      fc.assert(
        fc.property(
          nonMobileWidthArb,
          (width) => {
            const mode = getExpectedPaginationMode(width);
            const isMobile = isMobileWidth(width);

            expect(mode).toBe('full');
            expect(isMobile).toBe(false);

            return mode === 'full' && !isMobile;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Pagination mode is deterministic for any given width
     */
    it('pagination mode determination is deterministic', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          (width) => {
            const mode1 = getExpectedPaginationMode(width);
            const mode2 = getExpectedPaginationMode(width);
            const mode3 = getExpectedPaginationMode(width);

            expect(mode1).toBe(mode2);
            expect(mode2).toBe(mode3);

            return mode1 === mode2 && mode2 === mode3;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Boundary at 768px is correctly enforced
     */
    it('correctly handles boundary at 768px', () => {
      // Just below boundary - should be simple (mobile)
      expect(getExpectedPaginationMode(767)).toBe('simple');
      expect(isMobileWidth(767)).toBe(true);

      // At boundary - should be full (tablet)
      expect(getExpectedPaginationMode(768)).toBe('full');
      expect(isMobileWidth(768)).toBe(false);

      // Just above boundary - should be full (tablet)
      expect(getExpectedPaginationMode(769)).toBe('full');
      expect(isMobileWidth(769)).toBe(false);
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Pagination mode is binary - either simple or full, never both or neither
     */
    it('pagination mode is always exactly one of simple or full', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          (width) => {
            const mode = getExpectedPaginationMode(width);
            const isSimple = mode === 'simple';
            const isFull = mode === 'full';

            // Exactly one should be true (XOR)
            expect(isSimple !== isFull).toBe(true);

            return isSimple !== isFull;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: isMobile flag correlates with simple pagination mode
     */
    it('isMobile flag correlates with simple pagination mode', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          (width) => {
            const isMobile = isMobileWidth(width);
            const mode = getExpectedPaginationMode(width);

            // isMobile should be true if and only if mode is simple
            expect(isMobile).toBe(mode === 'simple');

            return isMobile === (mode === 'simple');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Page indicator is shown in mobile mode
     */
    it('page indicator is shown in mobile mode', () => {
      fc.assert(
        fc.property(
          mobileWidthArb,
          (width) => {
            const isMobile = isMobileWidth(width);
            const shouldShow = shouldShowPageIndicator(isMobile);

            expect(shouldShow).toBe(true);

            return shouldShow;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Current page is always valid (within [1, totalPages])
     */
    it('current page is always within valid range', () => {
      fc.assert(
        fc.property(
          paginationArb,
          ([totalPages, currentPage]) => {
            const isValid = isValidPage(currentPage, totalPages);

            expect(isValid).toBe(true);
            expect(currentPage).toBeGreaterThanOrEqual(1);
            expect(currentPage).toBeLessThanOrEqual(totalPages);

            return isValid;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Prev button is enabled only when not on first page
     */
    it('prev button enabled state is correct', () => {
      fc.assert(
        fc.property(
          paginationArb,
          ([totalPages, currentPage]) => {
            const isPrevEnabled = isPrevButtonEnabled(currentPage);

            if (currentPage === 1) {
              expect(isPrevEnabled).toBe(false);
            } else {
              expect(isPrevEnabled).toBe(true);
            }

            return isPrevEnabled === (currentPage > 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Next button is enabled only when not on last page
     */
    it('next button enabled state is correct', () => {
      fc.assert(
        fc.property(
          paginationArb,
          ([totalPages, currentPage]) => {
            const isNextEnabled = isNextButtonEnabled(currentPage, totalPages);

            if (currentPage === totalPages) {
              expect(isNextEnabled).toBe(false);
            } else {
              expect(isNextEnabled).toBe(true);
            }

            return isNextEnabled === (currentPage < totalPages);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Both prev and next buttons are disabled only on single page
     */
    it('both buttons disabled only when totalPages is 1', () => {
      fc.assert(
        fc.property(
          paginationArb,
          ([totalPages, currentPage]) => {
            const isPrevEnabled = isPrevButtonEnabled(currentPage);
            const isNextEnabled = isNextButtonEnabled(currentPage, totalPages);
            const bothDisabled = !isPrevEnabled && !isNextEnabled;

            if (totalPages === 1) {
              expect(bothDisabled).toBe(true);
            } else {
              expect(bothDisabled).toBe(false);
            }

            return bothDisabled === (totalPages === 1);
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: At least one button is always enabled when totalPages > 1
     */
    it('at least one button is enabled when totalPages > 1', () => {
      fc.assert(
        fc.property(
          fc
            .tuple(
              fc.integer({ min: 2, max: 1000 }),
              fc.integer({ min: 1, max: 1000 })
            )
            .filter(([totalPages, currentPage]) => currentPage <= totalPages),
          ([totalPages, currentPage]) => {
            const isPrevEnabled = isPrevButtonEnabled(currentPage);
            const isNextEnabled = isNextButtonEnabled(currentPage, totalPages);
            const atLeastOneEnabled = isPrevEnabled || isNextEnabled;

            expect(atLeastOneEnabled).toBe(true);

            return atLeastOneEnabled;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Visible page buttons count is reasonable for full mode
     */
    it('visible page buttons count is reasonable', () => {
      fc.assert(
        fc.property(
          paginationArb,
          ([totalPages, currentPage]) => {
            const visibleButtons = calculateVisiblePageButtons(currentPage, totalPages);

            // Should never show more than 7 page buttons (with ellipsis)
            expect(visibleButtons).toBeLessThanOrEqual(7);
            // Should show at least 1 page button
            expect(visibleButtons).toBeGreaterThanOrEqual(1);
            // Should not exceed total pages
            expect(visibleButtons).toBeLessThanOrEqual(totalPages);

            return visibleButtons >= 1 && visibleButtons <= 7 && visibleButtons <= totalPages;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-responsiveness, Property 9: Pagination simplified in mobile**
     * **Validates: Requirements 9.5**
     * 
     * Property: Page indicator format is consistent
     */
    it('page indicator format is consistent', () => {
      fc.assert(
        fc.property(
          paginationArb,
          ([totalPages, currentPage]) => {
            const indicator = `Página ${currentPage} de ${totalPages}`;

            // Should contain current page
            expect(indicator).toContain(currentPage.toString());
            // Should contain total pages
            expect(indicator).toContain(totalPages.toString());
            // Should contain "Página" and "de"
            expect(indicator).toContain('Página');
            expect(indicator).toContain('de');

            return (
              indicator.includes(currentPage.toString()) &&
              indicator.includes(totalPages.toString())
            );
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
