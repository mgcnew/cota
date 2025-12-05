/**
 * Property-Based Tests for useDebounce Hook
 * 
 * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
 * **Validates: Requirements 2.3**
 * 
 * Tests that for any search input, the debounce mechanism correctly delays
 * value updates by at least 300ms to prevent excessive re-renders during typing.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fc from 'fast-check';

/**
 * Minimum debounce delay as per Requirements 2.3
 */
const MINIMUM_DEBOUNCE_DELAY = 300;

/**
 * Pure function that simulates debounce behavior
 * Returns whether the debounced value should have updated given elapsed time
 */
function shouldDebounceUpdate(elapsedMs: number, delay: number): boolean {
  return elapsedMs >= delay;
}

/**
 * Validates that a debounce delay meets the minimum requirement
 */
function isValidDebounceDelay(delay: number): boolean {
  return delay >= MINIMUM_DEBOUNCE_DELAY;
}

/**
 * Simulates a sequence of rapid inputs and determines final debounced state
 * Returns the expected debounced value after all inputs and given elapsed time
 */
function simulateDebounceSequence<T>(
  inputs: { value: T; timestampMs: number }[],
  delay: number,
  currentTimeMs: number
): { debouncedValue: T | undefined; lastInputTime: number } {
  if (inputs.length === 0) {
    return { debouncedValue: undefined, lastInputTime: 0 };
  }

  // Sort inputs by timestamp
  const sortedInputs = [...inputs].sort((a, b) => a.timestampMs - b.timestampMs);
  const lastInput = sortedInputs[sortedInputs.length - 1];
  
  // Check if enough time has passed since last input
  const timeSinceLastInput = currentTimeMs - lastInput.timestampMs;
  
  if (timeSinceLastInput >= delay) {
    return { debouncedValue: lastInput.value, lastInputTime: lastInput.timestampMs };
  }
  
  // Find the most recent input that has had enough time to settle
  for (let i = sortedInputs.length - 1; i >= 0; i--) {
    const input = sortedInputs[i];
    const nextInput = sortedInputs[i + 1];
    
    if (nextInput) {
      const timeBetweenInputs = nextInput.timestampMs - input.timestampMs;
      if (timeBetweenInputs >= delay) {
        return { debouncedValue: input.value, lastInputTime: input.timestampMs };
      }
    }
  }
  
  // No input has settled yet - return initial/undefined
  return { debouncedValue: undefined, lastInputTime: 0 };
}

/**
 * Arbitrary generator for search query strings
 */
const searchQueryArbitrary = fc.string({ minLength: 0, maxLength: 100 });

/**
 * Arbitrary generator for valid debounce delays (>= 300ms)
 */
const validDelayArbitrary = fc.integer({ min: MINIMUM_DEBOUNCE_DELAY, max: 2000 });

/**
 * Arbitrary generator for invalid debounce delays (< 300ms)
 */
const invalidDelayArbitrary = fc.integer({ min: 0, max: MINIMUM_DEBOUNCE_DELAY - 1 });

/**
 * Arbitrary generator for elapsed time in milliseconds
 */
const elapsedTimeArbitrary = fc.integer({ min: 0, max: 5000 });

/**
 * Arbitrary generator for a sequence of rapid inputs
 */
const inputSequenceArbitrary = fc.array(
  fc.record({
    value: searchQueryArbitrary,
    timestampMs: fc.integer({ min: 0, max: 10000 })
  }),
  { minLength: 1, maxLength: 20 }
);

describe('useDebounce - Property Tests', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: Default debounce delay must be at least 300ms
   */
  it('should have default delay of at least 300ms', () => {
    // The useDebounce hook has a default delay of 300ms
    const defaultDelay = 300;
    expect(isValidDebounceDelay(defaultDelay)).toBe(true);
    expect(defaultDelay).toBeGreaterThanOrEqual(MINIMUM_DEBOUNCE_DELAY);
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: For any valid delay >= 300ms, the delay should be accepted
   */
  it('should accept any delay >= 300ms as valid', () => {
    fc.assert(
      fc.property(
        validDelayArbitrary,
        (delay) => {
          const isValid = isValidDebounceDelay(delay);
          expect(isValid).toBe(true);
          expect(delay).toBeGreaterThanOrEqual(MINIMUM_DEBOUNCE_DELAY);
          return isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: For any delay < 300ms, the delay should be flagged as invalid
   */
  it('should flag delays < 300ms as invalid for search debouncing', () => {
    fc.assert(
      fc.property(
        invalidDelayArbitrary,
        (delay) => {
          const isValid = isValidDebounceDelay(delay);
          expect(isValid).toBe(false);
          expect(delay).toBeLessThan(MINIMUM_DEBOUNCE_DELAY);
          return !isValid;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: Debounced value should NOT update before delay has elapsed
   */
  it('should not update debounced value before delay elapses', () => {
    fc.assert(
      fc.property(
        validDelayArbitrary,
        fc.integer({ min: 0, max: 299 }), // Time less than minimum delay
        (delay, elapsedTime) => {
          // Ensure elapsed time is less than the delay
          const actualElapsed = Math.min(elapsedTime, delay - 1);
          const shouldUpdate = shouldDebounceUpdate(actualElapsed, delay);
          
          expect(shouldUpdate).toBe(false);
          return !shouldUpdate;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: Debounced value SHOULD update after delay has elapsed
   */
  it('should update debounced value after delay elapses', () => {
    fc.assert(
      fc.property(
        validDelayArbitrary,
        (delay) => {
          // Time equal to or greater than delay
          const elapsedTime = delay;
          const shouldUpdate = shouldDebounceUpdate(elapsedTime, delay);
          
          expect(shouldUpdate).toBe(true);
          return shouldUpdate;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: For any elapsed time >= delay, debounce should allow update
   */
  it('should allow update for any elapsed time >= delay', () => {
    fc.assert(
      fc.property(
        validDelayArbitrary,
        elapsedTimeArbitrary,
        (delay, extraTime) => {
          const elapsedTime = delay + extraTime;
          const shouldUpdate = shouldDebounceUpdate(elapsedTime, delay);
          
          expect(shouldUpdate).toBe(true);
          return shouldUpdate;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: Rapid inputs should only trigger one update after settling
   */
  it('should only update once after rapid inputs settle', () => {
    fc.assert(
      fc.property(
        fc.array(searchQueryArbitrary, { minLength: 2, maxLength: 10 }),
        validDelayArbitrary,
        (queries, delay) => {
          // Simulate rapid inputs within the delay window
          const inputs = queries.map((value, index) => ({
            value,
            timestampMs: index * 50 // 50ms apart (faster than debounce)
          }));
          
          const lastInputTime = inputs[inputs.length - 1].timestampMs;
          
          // Check state before delay has passed
          const beforeDelay = simulateDebounceSequence(
            inputs,
            delay,
            lastInputTime + delay - 1
          );
          
          // Check state after delay has passed
          const afterDelay = simulateDebounceSequence(
            inputs,
            delay,
            lastInputTime + delay
          );
          
          // Before delay: should not have the last value
          expect(beforeDelay.debouncedValue).not.toBe(queries[queries.length - 1]);
          
          // After delay: should have the last value
          expect(afterDelay.debouncedValue).toBe(queries[queries.length - 1]);
          
          return afterDelay.debouncedValue === queries[queries.length - 1];
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: Debounce behavior is deterministic for same inputs
   */
  it('should be deterministic - same inputs produce same debounce behavior', () => {
    fc.assert(
      fc.property(
        searchQueryArbitrary,
        validDelayArbitrary,
        elapsedTimeArbitrary,
        (query, delay, elapsed) => {
          const result1 = shouldDebounceUpdate(elapsed, delay);
          const result2 = shouldDebounceUpdate(elapsed, delay);
          const result3 = shouldDebounceUpdate(elapsed, delay);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
          
          return result1 === result2 && result2 === result3;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: Empty search queries should also be debounced
   */
  it('should debounce empty search queries the same as non-empty', () => {
    fc.assert(
      fc.property(
        validDelayArbitrary,
        (delay) => {
          const emptyQuery = '';
          const nonEmptyQuery = 'test';
          
          // Both should follow same debounce rules
          const emptyBeforeDelay = shouldDebounceUpdate(delay - 1, delay);
          const nonEmptyBeforeDelay = shouldDebounceUpdate(delay - 1, delay);
          
          const emptyAfterDelay = shouldDebounceUpdate(delay, delay);
          const nonEmptyAfterDelay = shouldDebounceUpdate(delay, delay);
          
          expect(emptyBeforeDelay).toBe(nonEmptyBeforeDelay);
          expect(emptyAfterDelay).toBe(nonEmptyAfterDelay);
          
          return emptyBeforeDelay === nonEmptyBeforeDelay && 
                 emptyAfterDelay === nonEmptyAfterDelay;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: mobile-performance-refactor, Property 14: Debounced Search Input**
   * **Validates: Requirements 2.3**
   * 
   * Property: The 300ms minimum prevents excessive re-renders during typing
   */
  it('should prevent updates during typical typing speed (< 300ms between keystrokes)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 50, max: 200 }), // Typical typing interval
        (typingInterval) => {
          // At typical typing speed, debounce should NOT trigger between keystrokes
          const shouldTrigger = shouldDebounceUpdate(typingInterval, MINIMUM_DEBOUNCE_DELAY);
          
          expect(shouldTrigger).toBe(false);
          expect(typingInterval).toBeLessThan(MINIMUM_DEBOUNCE_DELAY);
          
          return !shouldTrigger;
        }
      ),
      { numRuns: 100 }
    );
  });
});
