/**
 * Property-Based Tests for CSS Animation Duration Limits
 * 
 * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
 * **Validates: Requirements 3.2, 7.5, 9.3, 11.5**
 * 
 * Tests that for any transition animation, the duration SHALL not exceed 300ms,
 * and hover transitions SHALL not exceed 150ms.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  ANIMATION_DURATIONS,
  isValidAnimationDuration,
  getMaxDuration,
  buildAnimationClass,
  getModalAnimationClasses,
  cssAnimationClasses,
} from '../cssAnimations';

/**
 * Constants for animation duration requirements
 * Based on Requirements 3.2, 7.5, 9.3, 11.5
 */
const MAX_HOVER_DURATION = 150; // ms - Requirement 11.5
const MAX_TRANSITION_DURATION = 200; // ms - Requirement 3.2
const MAX_MODAL_DURATION = 300; // ms - Requirements 7.5, 9.3
const ABSOLUTE_MAX_DURATION = 300; // ms - No animation should exceed this

/**
 * Arbitrary generator for animation types
 */
const animationTypeArb = fc.constantFrom('hover', 'transition', 'modal') as fc.Arbitrary<'hover' | 'transition' | 'modal'>;

/**
 * Arbitrary generator for animation effects
 */
const animationEffectArb = fc.constantFrom('scale', 'lift', 'fade', 'scale-fade') as fc.Arbitrary<'scale' | 'lift' | 'fade' | 'scale-fade'>;

/**
 * Arbitrary generator for modal directions
 */
const modalDirectionArb = fc.constantFrom('bottom', 'right', 'center') as fc.Arbitrary<'bottom' | 'right' | 'center'>;

/**
 * Arbitrary generator for positive durations (valid range)
 */
const validDurationArb = fc.integer({ min: 1, max: 300 });

/**
 * Arbitrary generator for invalid durations (exceeding limits)
 */
const invalidDurationArb = fc.integer({ min: 301, max: 10000 });

describe('CSS Animation Duration Limits - Property Tests', () => {
  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 11.5**
   * 
   * Property: Hover animation duration is at most 150ms
   */
  it('hover animation duration does not exceed 150ms', () => {
    expect(ANIMATION_DURATIONS.hover).toBeLessThanOrEqual(MAX_HOVER_DURATION);
    expect(ANIMATION_DURATIONS.hover).toBe(150);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2**
   * 
   * Property: Transition animation duration is at most 200ms
   */
  it('transition animation duration does not exceed 200ms', () => {
    expect(ANIMATION_DURATIONS.transition).toBeLessThanOrEqual(MAX_TRANSITION_DURATION);
    expect(ANIMATION_DURATIONS.transition).toBe(200);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 7.5, 9.3**
   * 
   * Property: Modal animation duration is at most 300ms
   */
  it('modal animation duration does not exceed 300ms', () => {
    expect(ANIMATION_DURATIONS.modal).toBeLessThanOrEqual(MAX_MODAL_DURATION);
    expect(ANIMATION_DURATIONS.modal).toBe(300);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2, 7.5, 9.3, 11.5**
   * 
   * Property: No animation duration exceeds the absolute maximum of 300ms
   */
  it('no animation duration exceeds absolute maximum of 300ms', () => {
    expect(ANIMATION_DURATIONS.max).toBeLessThanOrEqual(ABSOLUTE_MAX_DURATION);
    expect(ANIMATION_DURATIONS.hover).toBeLessThanOrEqual(ABSOLUTE_MAX_DURATION);
    expect(ANIMATION_DURATIONS.transition).toBeLessThanOrEqual(ABSOLUTE_MAX_DURATION);
    expect(ANIMATION_DURATIONS.modal).toBeLessThanOrEqual(ABSOLUTE_MAX_DURATION);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2, 7.5, 9.3, 11.5**
   * 
   * Property: For any animation type, getMaxDuration returns the correct limit
   */
  it('getMaxDuration returns correct limit for any animation type', () => {
    fc.assert(
      fc.property(animationTypeArb, (type) => {
        const maxDuration = getMaxDuration(type);
        
        switch (type) {
          case 'hover':
            expect(maxDuration).toBe(MAX_HOVER_DURATION);
            return maxDuration === MAX_HOVER_DURATION;
          case 'transition':
            expect(maxDuration).toBe(MAX_TRANSITION_DURATION);
            return maxDuration === MAX_TRANSITION_DURATION;
          case 'modal':
            expect(maxDuration).toBe(MAX_MODAL_DURATION);
            return maxDuration === MAX_MODAL_DURATION;
          default:
            return false;
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2, 7.5, 9.3, 11.5**
   * 
   * Property: For any duration within limits, isValidAnimationDuration returns true
   */
  it('durations within limits are valid for any animation type', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        validDurationArb,
        (type, duration) => {
          const maxForType = getMaxDuration(type);
          
          // Only test durations that are within the type's limit
          if (duration <= maxForType) {
            const isValid = isValidAnimationDuration(duration, type);
            expect(isValid).toBe(true);
            return isValid === true;
          }
          
          return true; // Skip durations above the type's limit
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2, 7.5, 9.3, 11.5**
   * 
   * Property: For any duration exceeding limits, isValidAnimationDuration returns false
   */
  it('durations exceeding limits are invalid for any animation type', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        invalidDurationArb,
        (type, duration) => {
          const isValid = isValidAnimationDuration(duration, type);
          expect(isValid).toBe(false);
          return isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 11.5**
   * 
   * Property: buildAnimationClass with 'hover' type uses duration-150 class
   */
  it('buildAnimationClass uses duration-150 for hover type', () => {
    fc.assert(
      fc.property(
        animationEffectArb,
        fc.boolean(),
        (effect, includeActive) => {
          const classes = buildAnimationClass({
            type: 'hover',
            effect,
            includeActive,
          });
          
          expect(classes).toContain('duration-150');
          expect(classes).not.toContain('duration-200');
          expect(classes).not.toContain('duration-300');
          
          return (
            classes.includes('duration-150') &&
            !classes.includes('duration-200') &&
            !classes.includes('duration-300')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2**
   * 
   * Property: buildAnimationClass with 'transition' type uses duration-200 class
   */
  it('buildAnimationClass uses duration-200 for transition type', () => {
    fc.assert(
      fc.property(
        animationEffectArb,
        fc.boolean(),
        (effect, includeActive) => {
          const classes = buildAnimationClass({
            type: 'transition',
            effect,
            includeActive,
          });
          
          expect(classes).toContain('duration-200');
          expect(classes).not.toContain('duration-150');
          expect(classes).not.toContain('duration-300');
          
          return (
            classes.includes('duration-200') &&
            !classes.includes('duration-150') &&
            !classes.includes('duration-300')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 7.5, 9.3**
   * 
   * Property: buildAnimationClass with 'modal' type uses duration-300 class
   */
  it('buildAnimationClass uses duration-300 for modal type', () => {
    fc.assert(
      fc.property(
        animationEffectArb,
        fc.boolean(),
        (effect, includeActive) => {
          const classes = buildAnimationClass({
            type: 'modal',
            effect,
            includeActive,
          });
          
          expect(classes).toContain('duration-300');
          expect(classes).not.toContain('duration-150');
          expect(classes).not.toContain('duration-200');
          
          return (
            classes.includes('duration-300') &&
            !classes.includes('duration-150') &&
            !classes.includes('duration-200')
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 9.3**
   * 
   * Property: getModalAnimationClasses uses duration-300 for any direction
   */
  it('getModalAnimationClasses uses duration-300 for any direction', () => {
    fc.assert(
      fc.property(modalDirectionArb, (direction) => {
        const { enter, exit, backdrop } = getModalAnimationClasses(direction);
        
        // All modal animations should use duration-300
        expect(enter).toContain('duration-300');
        expect(exit).toContain('duration-300');
        expect(backdrop).toContain('duration-300');
        
        return (
          enter.includes('duration-300') &&
          exit.includes('duration-300') &&
          backdrop.includes('duration-300')
        );
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2, 7.5, 9.3, 11.5**
   * 
   * Property: Duration hierarchy is maintained (hover < transition < modal)
   */
  it('duration hierarchy is maintained: hover < transition <= modal', () => {
    expect(ANIMATION_DURATIONS.hover).toBeLessThan(ANIMATION_DURATIONS.transition);
    expect(ANIMATION_DURATIONS.transition).toBeLessThanOrEqual(ANIMATION_DURATIONS.modal);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2, 7.5, 9.3, 11.5**
   * 
   * Property: CSS duration classes match the ANIMATION_DURATIONS constants
   */
  it('CSS duration classes match ANIMATION_DURATIONS constants', () => {
    // Verify the class names contain the correct duration values
    expect(cssAnimationClasses.durationHover).toBe('duration-150');
    expect(cssAnimationClasses.durationTransition).toBe('duration-200');
    expect(cssAnimationClasses.durationModal).toBe('duration-300');
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2, 7.5, 9.3, 11.5**
   * 
   * Property: Zero or negative durations are invalid for any animation type
   */
  it('zero or negative durations are invalid for any animation type', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        fc.integer({ min: -1000, max: 0 }),
        (type, duration) => {
          const isValid = isValidAnimationDuration(duration, type);
          expect(isValid).toBe(false);
          return isValid === false;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 8: Animation Duration Limits**
   * **Validates: Requirements 3.2, 7.5, 9.3, 11.5**
   * 
   * Property: Animation duration validation is deterministic
   */
  it('animation duration validation is deterministic', () => {
    fc.assert(
      fc.property(
        animationTypeArb,
        fc.integer({ min: -100, max: 500 }),
        (type, duration) => {
          const result1 = isValidAnimationDuration(duration, type);
          const result2 = isValidAnimationDuration(duration, type);
          
          expect(result1).toBe(result2);
          return result1 === result2;
        }
      ),
      { numRuns: 100 }
    );
  });
});
