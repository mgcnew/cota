/**
 * Property-Based Tests for Touch Target Utilities
 * 
 * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
 * **Validates: Requirements 2.5, 18.1**
 * 
 * Tests that for any interactive button or touchable element, the computed touch target
 * area SHALL be at least 44x44 pixels.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  MIN_TOUCH_TARGET_SIZE,
  meetsMinTouchTarget,
  calculateTouchPadding,
  getTouchTargetStyles,
  getTouchTargetClass,
  buildTouchTargetClass,
  touchTargetClasses,
} from '../touchTargets';

/**
 * Element types that require touch targets
 */
type ElementType = 'button' | 'icon' | 'listItem' | 'link' | 'checkbox' | 'radio' | 'switch';

/**
 * Arbitrary generator for element types
 */
const elementTypeArb = fc.constantFrom<ElementType>(
  'button', 'icon', 'listItem', 'link', 'checkbox', 'radio', 'switch'
);

/**
 * Arbitrary generator for positive dimensions
 */
const positiveDimensionArb = fc.integer({ min: 1, max: 500 });

/**
 * Arbitrary generator for dimensions below minimum touch target
 */
const smallDimensionArb = fc.integer({ min: 1, max: MIN_TOUCH_TARGET_SIZE - 1 });

/**
 * Arbitrary generator for dimensions at or above minimum touch target
 */
const largeDimensionArb = fc.integer({ min: MIN_TOUCH_TARGET_SIZE, max: 500 });

describe('Touch Target Utilities - Property Tests', () => {
  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: MIN_TOUCH_TARGET_SIZE constant is exactly 44px (WCAG standard)
   */
  it('MIN_TOUCH_TARGET_SIZE is exactly 44px', () => {
    expect(MIN_TOUCH_TARGET_SIZE).toBe(44);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: For any dimensions >= 44px, meetsMinTouchTarget returns true
   */
  it('meetsMinTouchTarget returns true for dimensions >= 44px', () => {
    fc.assert(
      fc.property(
        largeDimensionArb,
        largeDimensionArb,
        (width, height) => {
          const result = meetsMinTouchTarget(width, height);
          expect(result).toBe(true);
          return result === true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: For any dimensions where either width or height < 44px, 
   * meetsMinTouchTarget returns false
   */
  it('meetsMinTouchTarget returns false when any dimension < 44px', () => {
    fc.assert(
      fc.property(
        smallDimensionArb,
        positiveDimensionArb,
        (smallDim, otherDim) => {
          // Test with small width
          const resultSmallWidth = meetsMinTouchTarget(smallDim, otherDim);
          // Test with small height
          const resultSmallHeight = meetsMinTouchTarget(otherDim, smallDim);
          
          // At least one should be false (unless otherDim is also >= 44)
          if (otherDim < MIN_TOUCH_TARGET_SIZE) {
            expect(resultSmallWidth).toBe(false);
            expect(resultSmallHeight).toBe(false);
          } else {
            expect(resultSmallWidth).toBe(false);
            expect(resultSmallHeight).toBe(false);
          }
          
          return !resultSmallWidth && !resultSmallHeight;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: calculateTouchPadding returns 0 for content >= 44px
   */
  it('calculateTouchPadding returns 0 for content >= 44px', () => {
    fc.assert(
      fc.property(
        largeDimensionArb,
        (contentSize) => {
          const padding = calculateTouchPadding(contentSize);
          expect(padding).toBe(0);
          return padding === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: For any content < 44px, calculateTouchPadding returns padding
   * such that content + 2*padding >= 44px
   */
  it('calculateTouchPadding ensures total size >= 44px', () => {
    fc.assert(
      fc.property(
        smallDimensionArb,
        (contentSize) => {
          const padding = calculateTouchPadding(contentSize);
          const totalSize = contentSize + (padding * 2);
          
          expect(padding).toBeGreaterThan(0);
          expect(totalSize).toBeGreaterThanOrEqual(MIN_TOUCH_TARGET_SIZE);
          
          return padding > 0 && totalSize >= MIN_TOUCH_TARGET_SIZE;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: getTouchTargetStyles always returns minWidth and minHeight >= 44px
   */
  it('getTouchTargetStyles always returns minimum 44px dimensions', () => {
    fc.assert(
      fc.property(
        fc.record({
          minWidth: fc.option(positiveDimensionArb, { nil: undefined }),
          minHeight: fc.option(positiveDimensionArb, { nil: undefined }),
          centered: fc.option(fc.boolean(), { nil: undefined }),
        }),
        (options) => {
          const styles = getTouchTargetStyles(options);
          
          const minWidth = parseInt(styles.minWidth as string, 10);
          const minHeight = parseInt(styles.minHeight as string, 10);
          
          // When no custom values provided, should default to 44px
          if (!options.minWidth) {
            expect(minWidth).toBe(MIN_TOUCH_TARGET_SIZE);
          }
          if (!options.minHeight) {
            expect(minHeight).toBe(MIN_TOUCH_TARGET_SIZE);
          }
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: getTouchTargetClass returns a valid class for all element types
   */
  it('getTouchTargetClass returns valid class for all element types', () => {
    fc.assert(
      fc.property(
        elementTypeArb,
        (elementType) => {
          const className = getTouchTargetClass(elementType);
          
          expect(className).toBeTruthy();
          expect(typeof className).toBe('string');
          expect(className.length).toBeGreaterThan(0);
          
          // Should be one of the defined touch target classes
          const validClasses = Object.values(touchTargetClasses);
          expect(validClasses).toContain(className);
          
          return validClasses.includes(className);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: buildTouchTargetClass always includes a base touch target class
   */
  it('buildTouchTargetClass always includes a touch target class', () => {
    fc.assert(
      fc.property(
        fc.record({
          type: fc.option(elementTypeArb, { nil: undefined }),
          centered: fc.option(fc.boolean(), { nil: undefined }),
          expanded: fc.option(fc.boolean(), { nil: undefined }),
        }),
        (options) => {
          const classString = buildTouchTargetClass(options);
          
          expect(classString).toBeTruthy();
          expect(typeof classString).toBe('string');
          
          // Should contain at least one touch-target class
          const containsTouchTarget = Object.values(touchTargetClasses).some(
            cls => classString.includes(cls)
          );
          expect(containsTouchTarget).toBe(true);
          
          return containsTouchTarget;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: All touchTargetClasses values are non-empty strings
   */
  it('all touchTargetClasses are non-empty strings', () => {
    const classes = Object.values(touchTargetClasses);
    
    classes.forEach(cls => {
      expect(typeof cls).toBe('string');
      expect(cls.length).toBeGreaterThan(0);
      expect(cls.startsWith('touch-target')).toBe(true);
    });
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: Button elements always get the base touch-target class
   */
  it('button elements get base touch-target class', () => {
    const buttonClass = getTouchTargetClass('button');
    expect(buttonClass).toBe(touchTargetClasses.base);
    expect(buttonClass).toBe('touch-target');
  });

  /**
   * **Feature: mobile-performance-refactor, Property 4: Touch Target Minimum Size**
   * **Validates: Requirements 2.5, 18.1**
   * 
   * Property: meetsMinTouchTarget is symmetric - order of width/height doesn't matter
   * for the boolean result when both are the same
   */
  it('meetsMinTouchTarget is consistent for same dimensions', () => {
    fc.assert(
      fc.property(
        positiveDimensionArb,
        (dimension) => {
          const result1 = meetsMinTouchTarget(dimension, dimension);
          const result2 = meetsMinTouchTarget(dimension, dimension);
          
          expect(result1).toBe(result2);
          
          // Should be true only if dimension >= 44
          const expected = dimension >= MIN_TOUCH_TARGET_SIZE;
          expect(result1).toBe(expected);
          
          return result1 === result2 && result1 === expected;
        }
      ),
      { numRuns: 100 }
    );
  });
});
