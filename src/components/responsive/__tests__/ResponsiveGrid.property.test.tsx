/**
 * Property-Based Tests for ResponsiveGrid Component
 *
 * **Feature: mobile-performance-refactor, Property 1: CSS Grid Layout Without JavaScript**
 * **Validates: Requirements 1.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { render, cleanup } from '@testing-library/react';
import { ResponsiveGrid } from '../ResponsiveGrid';

interface GridConfigType {
  mobile: number;
  tablet: number;
  desktop: number;
}

// Only generate configs that are supported by the ResponsiveGrid component
// These match the pre-defined gridConfigs in ResponsiveGrid.tsx
const supportedConfigs: GridConfigType[] = [
  { mobile: 1, tablet: 1, desktop: 1 },
  { mobile: 1, tablet: 2, desktop: 2 },
  { mobile: 1, tablet: 2, desktop: 3 },
  { mobile: 1, tablet: 2, desktop: 4 },
  { mobile: 2, tablet: 2, desktop: 2 },
  { mobile: 2, tablet: 2, desktop: 3 },
  { mobile: 2, tablet: 2, desktop: 4 },
  { mobile: 2, tablet: 3, desktop: 4 },
  { mobile: 2, tablet: 3, desktop: 6 },
  { mobile: 1, tablet: 3, desktop: 4 },
];

const gridConfigArb = fc.constantFrom(...supportedConfigs);

const gapArb = fc.constantFrom('sm' as const, 'md' as const, 'lg' as const);

describe('ResponsiveGrid - Property Tests', () => {
  describe('Property 1: CSS Grid Layout Without JavaScript', () => {
    /**
     * **Feature: mobile-performance-refactor, Property 1: CSS Grid Layout Without JavaScript**
     * **Validates: Requirements 1.2**
     *
     * For any ResponsiveGrid component with a given config, the rendered output
     * SHALL use only CSS classes for responsive layout without runtime JavaScript
     * breakpoint detection for column changes.
     */
    it('renders with CSS grid classes without runtime breakpoint detection', () => {
      fc.assert(
        fc.property(gridConfigArb, (config: GridConfigType) => {
          cleanup();
          const { container } = render(
            <ResponsiveGrid config={config}>
              <div>Item 1</div>
              <div>Item 2</div>
            </ResponsiveGrid>
          );

          const gridElement = container.querySelector('.grid');
          expect(gridElement).toBeTruthy();

          const classList = gridElement?.className || '';
          expect(classList).toContain('grid');

          // Verify responsive CSS classes are present (sm:, lg: prefixes)
          // These indicate CSS-based responsiveness, not JavaScript
          const hasResponsiveClasses =
            classList.includes('sm:') || classList.includes('lg:');
          expect(hasResponsiveClasses).toBe(true);

          // Verify no JavaScript breakpoint detection via data attributes
          const hasJSBreakpointDetection =
            gridElement?.hasAttribute('data-breakpoint') ||
            gridElement?.hasAttribute('data-width') ||
            gridElement?.hasAttribute('data-columns');
          expect(hasJSBreakpointDetection).toBe(false);

          return (
            gridElement !== null &&
            classList.includes('grid') &&
            hasResponsiveClasses &&
            !hasJSBreakpointDetection
          );
        }),
        { numRuns: 100 }
      );
    });


    /**
     * **Feature: mobile-performance-refactor, Property 1: CSS Grid Layout Without JavaScript**
     * **Validates: Requirements 1.2**
     */
    it('applies grid-cols-* classes matching the config', () => {
      fc.assert(
        fc.property(gridConfigArb, (config: GridConfigType) => {
          cleanup();
          const { container } = render(
            <ResponsiveGrid config={config}>
              <div>Item</div>
            </ResponsiveGrid>
          );

          const gridElement = container.querySelector('.grid');
          const classList = gridElement?.className || '';

          // Verify grid-cols classes are present
          const hasGridColsClass =
            classList.includes('grid-cols-1') ||
            classList.includes('grid-cols-2') ||
            classList.includes('grid-cols-3') ||
            classList.includes('grid-cols-4') ||
            classList.includes('grid-cols-5') ||
            classList.includes('grid-cols-6');

          expect(hasGridColsClass).toBe(true);

          // Verify the mobile class matches config
          const mobileClass = `grid-cols-${config.mobile}`;
          expect(classList).toContain(mobileClass);

          return hasGridColsClass && classList.includes(mobileClass);
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 1: CSS Grid Layout Without JavaScript**
     * **Validates: Requirements 1.2**
     */
    it('includes gap classes for spacing without JavaScript', () => {
      fc.assert(
        fc.property(gridConfigArb, gapArb, (config: GridConfigType, gap) => {
          cleanup();
          const { container } = render(
            <ResponsiveGrid config={config} gap={gap}>
              <div>Item</div>
            </ResponsiveGrid>
          );

          const gridElement = container.querySelector('.grid');
          const classList = gridElement?.className || '';

          // Verify gap classes are present (CSS-based, not JS)
          const hasGapClass =
            classList.includes('gap-') ||
            classList.includes('sm:gap-') ||
            classList.includes('lg:gap-');

          expect(hasGapClass).toBe(true);

          // Verify no inline styles that would indicate JS-based sizing
          const hasInlineStyles = gridElement?.hasAttribute('style');
          expect(hasInlineStyles).toBe(false);

          return hasGapClass && !hasInlineStyles;
        }),
        { numRuns: 100 }
      );
    });

    /**
     * **Feature: mobile-performance-refactor, Property 1: CSS Grid Layout Without JavaScript**
     * **Validates: Requirements 1.2**
     */
    it('maintains CSS-only layout across different configs', () => {
      fc.assert(
        fc.property(fc.array(gridConfigArb, { minLength: 1, maxLength: 5 }), (configs: GridConfigType[]) => {
          const results = configs.map((config) => {
            cleanup();
            const { container } = render(
              <ResponsiveGrid config={config}>
                <div>Item</div>
              </ResponsiveGrid>
            );

            const gridElement = container.querySelector('.grid');
            const classList = gridElement?.className || '';

            return (
              classList.includes('grid') &&
              (classList.includes('sm:') || classList.includes('lg:')) &&
              !gridElement?.hasAttribute('data-breakpoint')
            );
          });

          return results.every((result) => result === true);
        }),
        { numRuns: 50 }
      );
    });
  });
});
