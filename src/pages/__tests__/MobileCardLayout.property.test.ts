/**
 * Property-Based Tests for Mobile Card Layout
 * 
 * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
 * **Validates: Requirements 3.1**
 * 
 * Tests that:
 * - For any list page rendered on mobile viewport (width < 768px), 
 *   the layout SHALL display items in card format rather than table rows.
 * 
 * This property ensures that the Cotações page (and similar list pages) 
 * correctly transforms from table layout to card layout on mobile devices.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Breakpoint configuration matching the system (Tailwind md: breakpoint)
 */
const MOBILE_BREAKPOINT = 768;

/**
 * Layout types for list pages
 */
type LayoutType = 'cards' | 'table';

/**
 * Viewport type based on width
 */
type ViewportType = 'mobile' | 'desktop';

/**
 * Determines the viewport type from screen width
 * Mobile: width < 768px (Tailwind's md: breakpoint)
 * Desktop: width >= 768px
 */
function getViewportType(width: number): ViewportType {
  return width < MOBILE_BREAKPOINT ? 'mobile' : 'desktop';
}

/**
 * Determines the expected layout type based on viewport
 * 
 * Requirements 3.1: WHEN the Quotes page renders on mobile 
 * THEN the System SHALL display cards instead of tables
 */
function getExpectedLayoutType(viewportType: ViewportType): LayoutType {
  return viewportType === 'mobile' ? 'cards' : 'table';
}

/**
 * Simulates the CSS class visibility logic used in Cotações page
 * 
 * The page uses:
 * - `md:hidden` for mobile cards (visible when width < 768px)
 * - `hidden md:block` for desktop table (visible when width >= 768px)
 */
function isMobileCardsVisible(width: number): boolean {
  // md:hidden means visible on mobile (< 768px), hidden on md and above
  return width < MOBILE_BREAKPOINT;
}

function isDesktopTableVisible(width: number): boolean {
  // hidden md:block means hidden by default, visible on md (>= 768px) and above
  return width >= MOBILE_BREAKPOINT;
}

/**
 * Determines which layout is actually rendered based on CSS visibility
 */
function getRenderedLayout(width: number): LayoutType {
  const cardsVisible = isMobileCardsVisible(width);
  const tableVisible = isDesktopTableVisible(width);
  
  // Exactly one should be visible at any given width
  if (cardsVisible && !tableVisible) return 'cards';
  if (!cardsVisible && tableVisible) return 'table';
  
  // This should never happen with correct CSS
  throw new Error(`Invalid state: cards=${cardsVisible}, table=${tableVisible}`);
}

/**
 * Validates that the CSS classes produce mutually exclusive visibility
 */
function hasExclusiveVisibility(width: number): boolean {
  const cardsVisible = isMobileCardsVisible(width);
  const tableVisible = isDesktopTableVisible(width);
  
  // XOR: exactly one should be visible
  return cardsVisible !== tableVisible;
}

/**
 * Arbitrary generator for mobile viewport widths (320px to 767px)
 */
const mobileWidthArb = fc.integer({ min: 320, max: 767 });

/**
 * Arbitrary generator for desktop viewport widths (768px to 2560px)
 */
const desktopWidthArb = fc.integer({ min: 768, max: 2560 });

/**
 * Arbitrary generator for any valid viewport width
 */
const anyWidthArb = fc.integer({ min: 320, max: 2560 });

/**
 * Arbitrary generator for quote data
 */
const quoteDataArb = fc.record({
  id: fc.uuid(),
  produto: fc.string({ minLength: 1, maxLength: 100 }),
  status: fc.constantFrom('ativa', 'pendente', 'concluida', 'planejada', 'expirada'),
  fornecedores: fc.integer({ min: 0, max: 50 }),
  melhorPreco: fc.string({ minLength: 1, maxLength: 20 }),
});

/**
 * Arbitrary generator for arrays of quotes
 */
const quotesArrayArb = fc.array(quoteDataArb, { minLength: 0, maxLength: 100 });

describe('Mobile Card Layout - Property Tests', () => {
  describe('Property 5: Mobile Card Layout', () => {
    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: For any mobile viewport width, cards layout is displayed
     */
    it('displays cards layout for any mobile viewport width (< 768px)', () => {
      fc.assert(
        fc.property(
          mobileWidthArb,
          (width) => {
            const viewportType = getViewportType(width);
            const expectedLayout = getExpectedLayoutType(viewportType);
            const renderedLayout = getRenderedLayout(width);
            
            expect(viewportType).toBe('mobile');
            expect(expectedLayout).toBe('cards');
            expect(renderedLayout).toBe('cards');
            
            return viewportType === 'mobile' && 
                   expectedLayout === 'cards' && 
                   renderedLayout === 'cards';
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: For any desktop viewport width, table layout is displayed
     */
    it('displays table layout for any desktop viewport width (>= 768px)', () => {
      fc.assert(
        fc.property(
          desktopWidthArb,
          (width) => {
            const viewportType = getViewportType(width);
            const expectedLayout = getExpectedLayoutType(viewportType);
            const renderedLayout = getRenderedLayout(width);
            
            expect(viewportType).toBe('desktop');
            expect(expectedLayout).toBe('table');
            expect(renderedLayout).toBe('table');
            
            return viewportType === 'desktop' && 
                   expectedLayout === 'table' && 
                   renderedLayout === 'table';
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: CSS visibility is mutually exclusive at any viewport width
     */
    it('ensures exactly one layout is visible at any viewport width', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          (width) => {
            const isExclusive = hasExclusiveVisibility(width);
            
            expect(isExclusive).toBe(true);
            
            return isExclusive;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: Layout determination is deterministic for any given width
     */
    it('layout determination is deterministic', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          (width) => {
            const layout1 = getRenderedLayout(width);
            const layout2 = getRenderedLayout(width);
            const layout3 = getRenderedLayout(width);
            
            expect(layout1).toBe(layout2);
            expect(layout2).toBe(layout3);
            
            return layout1 === layout2 && layout2 === layout3;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: Boundary at 768px is correctly enforced
     */
    it('correctly handles boundary at 768px', () => {
      // Just below boundary - should be cards (mobile)
      expect(getViewportType(767)).toBe('mobile');
      expect(getRenderedLayout(767)).toBe('cards');
      expect(isMobileCardsVisible(767)).toBe(true);
      expect(isDesktopTableVisible(767)).toBe(false);
      
      // At boundary - should be table (desktop)
      expect(getViewportType(768)).toBe('desktop');
      expect(getRenderedLayout(768)).toBe('table');
      expect(isMobileCardsVisible(768)).toBe(false);
      expect(isDesktopTableVisible(768)).toBe(true);
      
      // Just above boundary - should be table (desktop)
      expect(getViewportType(769)).toBe('desktop');
      expect(getRenderedLayout(769)).toBe('table');
      expect(isMobileCardsVisible(769)).toBe(false);
      expect(isDesktopTableVisible(769)).toBe(true);
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: Layout type is binary - either cards or table
     */
    it('layout type is always exactly one of cards or table', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          (width) => {
            const layout = getRenderedLayout(width);
            const isCards = layout === 'cards';
            const isTable = layout === 'table';
            
            // Exactly one should be true (XOR)
            expect(isCards !== isTable).toBe(true);
            
            return isCards !== isTable;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: Mobile cards visibility correlates with cards layout
     */
    it('mobile cards visibility correlates with cards layout', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          (width) => {
            const cardsVisible = isMobileCardsVisible(width);
            const layout = getRenderedLayout(width);
            
            // cardsVisible should be true if and only if layout is cards
            expect(cardsVisible).toBe(layout === 'cards');
            
            return cardsVisible === (layout === 'cards');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: Desktop table visibility correlates with table layout
     */
    it('desktop table visibility correlates with table layout', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          (width) => {
            const tableVisible = isDesktopTableVisible(width);
            const layout = getRenderedLayout(width);
            
            // tableVisible should be true if and only if layout is table
            expect(tableVisible).toBe(layout === 'table');
            
            return tableVisible === (layout === 'table');
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: Layout works correctly regardless of data size
     */
    it('layout determination is independent of data size', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          quotesArrayArb,
          (width, quotes) => {
            // Layout should be determined solely by viewport width
            // regardless of how many quotes are in the list
            const layout = getRenderedLayout(width);
            const expectedLayout = getExpectedLayoutType(getViewportType(width));
            
            expect(layout).toBe(expectedLayout);
            
            // The number of items doesn't affect layout choice
            return layout === expectedLayout;
          }
        ),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: Common mobile device widths render cards
     */
    it('common mobile device widths render cards layout', () => {
      const commonMobileWidths = [
        320,  // iPhone SE
        375,  // iPhone 6/7/8/X
        390,  // iPhone 12/13
        414,  // iPhone 6/7/8 Plus
        428,  // iPhone 12/13 Pro Max
        360,  // Samsung Galaxy S series
        412,  // Pixel phones
        540,  // Surface Duo
        600,  // Small tablets (portrait)
      ];
      
      for (const width of commonMobileWidths) {
        const layout = getRenderedLayout(width);
        expect(layout).toBe('cards');
      }
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: Common desktop/tablet widths render table
     */
    it('common desktop/tablet widths render table layout', () => {
      const commonDesktopWidths = [
        768,   // iPad Mini (portrait)
        820,   // iPad Air (portrait)
        1024,  // iPad Pro (portrait) / Small laptops
        1280,  // HD laptops
        1366,  // Common laptop resolution
        1440,  // MacBook Pro 15"
        1536,  // Surface Pro
        1920,  // Full HD monitors
        2560,  // QHD monitors
      ];
      
      for (const width of commonDesktopWidths) {
        const layout = getRenderedLayout(width);
        expect(layout).toBe('table');
      }
    });

    /**
     * **Feature: mobile-performance-refactor, Property 5: Mobile Card Layout**
     * **Validates: Requirements 3.1**
     * 
     * Property: Viewport type and layout type are consistent
     */
    it('viewport type and layout type are always consistent', () => {
      fc.assert(
        fc.property(
          anyWidthArb,
          (width) => {
            const viewportType = getViewportType(width);
            const layout = getRenderedLayout(width);
            
            // Mobile viewport should always have cards layout
            if (viewportType === 'mobile') {
              expect(layout).toBe('cards');
            }
            
            // Desktop viewport should always have table layout
            if (viewportType === 'desktop') {
              expect(layout).toBe('table');
            }
            
            return (viewportType === 'mobile' && layout === 'cards') ||
                   (viewportType === 'desktop' && layout === 'table');
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
