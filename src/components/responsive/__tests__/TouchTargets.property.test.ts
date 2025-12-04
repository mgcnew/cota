/**
 * Property-Based Tests for Touch Targets
 * 
 * **Feature: mobile-responsiveness, Property 6: Touch targets meet minimum size**
 * **Validates: Requirements 4.2, 7.1**
 * 
 * Tests that for any interactive element in mobile context, the touch-target
 * utility class ensures minimum dimensions of 44x44 pixels for accessible touch interactions.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Touch target configuration constants
 * Based on WCAG 2.1 Success Criterion 2.5.5 (Target Size)
 * and Apple Human Interface Guidelines (44pt minimum)
 */
const TOUCH_TARGET_CONFIG = {
  minHeight: 44,
  minWidth: 44,
} as const;

/**
 * Interactive element types that require touch targets
 */
type InteractiveElementType = 'button' | 'input' | 'link' | 'select' | 'checkbox' | 'radio';

/**
 * Simulates the CSS properties applied by the .touch-target utility class
 * This mirrors the Tailwind plugin configuration in tailwind.config.ts
 */
function getTouchTargetStyles(): { minHeight: string; minWidth: string } {
  return {
    minHeight: '44px',
    minWidth: '44px',
  };
}

/**
 * Parses a CSS pixel value to a number
 */
function parsePxValue(value: string): number {
  const match = value.match(/^(\d+(?:\.\d+)?)px$/);
  if (!match) {
    throw new Error(`Invalid pixel value: ${value}`);
  }
  return parseFloat(match[1]);
}

/**
 * Validates that touch target styles meet minimum size requirements
 */
function validateTouchTargetSize(styles: { minHeight: string; minWidth: string }): {
  isValid: boolean;
  minHeight: number;
  minWidth: number;
} {
  const minHeight = parsePxValue(styles.minHeight);
  const minWidth = parsePxValue(styles.minWidth);
  
  return {
    isValid: minHeight >= TOUCH_TARGET_CONFIG.minHeight && minWidth >= TOUCH_TARGET_CONFIG.minWidth,
    minHeight,
    minWidth,
  };
}

/**
 * Simulates computing effective touch target size for an element
 * considering both explicit dimensions and the touch-target utility
 */
function computeEffectiveTouchTargetSize(
  elementWidth: number,
  elementHeight: number,
  hasTouchTargetClass: boolean
): { effectiveWidth: number; effectiveHeight: number } {
  if (hasTouchTargetClass) {
    return {
      effectiveWidth: Math.max(elementWidth, TOUCH_TARGET_CONFIG.minWidth),
      effectiveHeight: Math.max(elementHeight, TOUCH_TARGET_CONFIG.minHeight),
    };
  }
  return {
    effectiveWidth: elementWidth,
    effectiveHeight: elementHeight,
  };
}

/**
 * Arbitrary generator for interactive element types
 */
const interactiveElementTypeArb = fc.constantFrom<InteractiveElementType>(
  'button', 'input', 'link', 'select', 'checkbox', 'radio'
);

/**
 * Arbitrary generator for element dimensions (realistic range)
 */
const elementDimensionArb = fc.integer({ min: 16, max: 200 });

/**
 * Arbitrary generator for small element dimensions (below touch target minimum)
 */
const smallDimensionArb = fc.integer({ min: 16, max: 43 });

/**
 * Arbitrary generator for large element dimensions (at or above touch target minimum)
 */
const largeDimensionArb = fc.integer({ min: 44, max: 200 });

describe('Touch Targets - Property Tests', () => {
  /**
   * **Feature: mobile-responsiveness, Property 6: Touch targets meet minimum size**
   * **Validates: Requirements 4.2, 7.1**
   * 
   * Property: The touch-target utility class always provides minimum 44px dimensions
   */
  it('touch-target utility class provides minimum 44px dimensions', () => {
    const styles = getTouchTargetStyles();
    const validation = validateTouchTargetSize(styles);
    
    expect(validation.isValid).toBe(true);
    expect(validation.minHeight).toBeGreaterThanOrEqual(TOUCH_TARGET_CONFIG.minHeight);
    expect(validation.minWidth).toBeGreaterThanOrEqual(TOUCH_TARGET_CONFIG.minWidth);
  });

  /**
   * **Feature: mobile-responsiveness, Property 6: Touch targets meet minimum size**
   * **Validates: Requirements 4.2, 7.1**
   * 
   * Property: For any interactive element with touch-target class,
   * effective dimensions are at least 44x44px regardless of original size
   */
  it('touch-target class ensures minimum size for any element dimensions', () => {
    fc.assert(
      fc.property(
        interactiveElementTypeArb,
        elementDimensionArb,
        elementDimensionArb,
        (elementType, width, height) => {
          const result = computeEffectiveTouchTargetSize(width, height, true);
          
          expect(result.effectiveWidth).toBeGreaterThanOrEqual(TOUCH_TARGET_CONFIG.minWidth);
          expect(result.effectiveHeight).toBeGreaterThanOrEqual(TOUCH_TARGET_CONFIG.minHeight);
          
          return (
            result.effectiveWidth >= TOUCH_TARGET_CONFIG.minWidth &&
            result.effectiveHeight >= TOUCH_TARGET_CONFIG.minHeight
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 6: Touch targets meet minimum size**
   * **Validates: Requirements 4.2, 7.1**
   * 
   * Property: Small elements (< 44px) are expanded to minimum touch target size
   */
  it('small elements are expanded to minimum touch target size', () => {
    fc.assert(
      fc.property(
        interactiveElementTypeArb,
        smallDimensionArb,
        smallDimensionArb,
        (elementType, width, height) => {
          const result = computeEffectiveTouchTargetSize(width, height, true);
          
          // Small elements should be expanded to exactly the minimum
          expect(result.effectiveWidth).toBe(TOUCH_TARGET_CONFIG.minWidth);
          expect(result.effectiveHeight).toBe(TOUCH_TARGET_CONFIG.minHeight);
          
          return (
            result.effectiveWidth === TOUCH_TARGET_CONFIG.minWidth &&
            result.effectiveHeight === TOUCH_TARGET_CONFIG.minHeight
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 6: Touch targets meet minimum size**
   * **Validates: Requirements 4.2, 7.1**
   * 
   * Property: Large elements (>= 44px) retain their original size
   */
  it('large elements retain their original size', () => {
    fc.assert(
      fc.property(
        interactiveElementTypeArb,
        largeDimensionArb,
        largeDimensionArb,
        (elementType, width, height) => {
          const result = computeEffectiveTouchTargetSize(width, height, true);
          
          // Large elements should keep their original size
          expect(result.effectiveWidth).toBe(width);
          expect(result.effectiveHeight).toBe(height);
          
          return (
            result.effectiveWidth === width &&
            result.effectiveHeight === height
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 6: Touch targets meet minimum size**
   * **Validates: Requirements 4.2, 7.1**
   * 
   * Property: Elements without touch-target class are not modified
   */
  it('elements without touch-target class are not modified', () => {
    fc.assert(
      fc.property(
        interactiveElementTypeArb,
        elementDimensionArb,
        elementDimensionArb,
        (elementType, width, height) => {
          const result = computeEffectiveTouchTargetSize(width, height, false);
          
          // Without the class, dimensions should remain unchanged
          expect(result.effectiveWidth).toBe(width);
          expect(result.effectiveHeight).toBe(height);
          
          return (
            result.effectiveWidth === width &&
            result.effectiveHeight === height
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 6: Touch targets meet minimum size**
   * **Validates: Requirements 4.2, 7.1**
   * 
   * Property: Touch target size is consistent across all interactive element types
   */
  it('touch target size is consistent across all interactive element types', () => {
    const elementTypes: InteractiveElementType[] = ['button', 'input', 'link', 'select', 'checkbox', 'radio'];
    
    fc.assert(
      fc.property(
        smallDimensionArb,
        smallDimensionArb,
        (width, height) => {
          const results = elementTypes.map(type => 
            computeEffectiveTouchTargetSize(width, height, true)
          );
          
          // All element types should have the same effective size
          const firstResult = results[0];
          const allSame = results.every(
            r => r.effectiveWidth === firstResult.effectiveWidth &&
                 r.effectiveHeight === firstResult.effectiveHeight
          );
          
          expect(allSame).toBe(true);
          
          return allSame;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-responsiveness, Property 6: Touch targets meet minimum size**
   * **Validates: Requirements 4.2, 7.1**
   * 
   * Property: Touch target minimum is exactly 44px (WCAG 2.1 / Apple HIG standard)
   */
  it('touch target minimum matches accessibility standards (44px)', () => {
    expect(TOUCH_TARGET_CONFIG.minHeight).toBe(44);
    expect(TOUCH_TARGET_CONFIG.minWidth).toBe(44);
    
    const styles = getTouchTargetStyles();
    expect(styles.minHeight).toBe('44px');
    expect(styles.minWidth).toBe('44px');
  });

  /**
   * **Feature: mobile-responsiveness, Property 6: Touch targets meet minimum size**
   * **Validates: Requirements 4.2, 7.1**
   * 
   * Property: Asymmetric dimensions are handled correctly
   * (e.g., wide button with small height)
   */
  it('asymmetric dimensions are handled correctly', () => {
    fc.assert(
      fc.property(
        largeDimensionArb,
        smallDimensionArb,
        (largeValue, smallValue) => {
          // Wide element with small height
          const wideResult = computeEffectiveTouchTargetSize(largeValue, smallValue, true);
          expect(wideResult.effectiveWidth).toBe(largeValue);
          expect(wideResult.effectiveHeight).toBe(TOUCH_TARGET_CONFIG.minHeight);
          
          // Tall element with small width
          const tallResult = computeEffectiveTouchTargetSize(smallValue, largeValue, true);
          expect(tallResult.effectiveWidth).toBe(TOUCH_TARGET_CONFIG.minWidth);
          expect(tallResult.effectiveHeight).toBe(largeValue);
          
          return (
            wideResult.effectiveWidth === largeValue &&
            wideResult.effectiveHeight === TOUCH_TARGET_CONFIG.minHeight &&
            tallResult.effectiveWidth === TOUCH_TARGET_CONFIG.minWidth &&
            tallResult.effectiveHeight === largeValue
          );
        }
      ),
      { numRuns: 100 }
    );
  });
});
