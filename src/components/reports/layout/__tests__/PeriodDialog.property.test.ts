/**
 * Property-Based Tests for PeriodDialog Date Range Validation
 * 
 * **Feature: relatorios-refactoring, Property 6: Date range validation**
 * **Validates: Requirements 7.3**
 * 
 * Tests that for any start date and end date selection, if the end date is 
 * before the start date, the system should indicate an invalid state and 
 * prevent form submission.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { validateDateRange } from '../PeriodDialog';

describe('PeriodDialog - Date Range Validation Property Tests', () => {
  // Helper to create valid date arbitrary (filters out NaN dates)
  const validDate = () => fc.date({ min: new Date(2000, 0, 1), max: new Date(2100, 11, 31) })
    .filter(d => !isNaN(d.getTime()));

  /**
   * **Feature: relatorios-refactoring, Property 6: Date range validation**
   * **Validates: Requirements 7.3**
   * 
   * Property: For any start date and end date, if end date is before start date,
   * validation should return false (invalid state).
   */
  it('should return false when end date is before start date', () => {
    fc.assert(
      fc.property(
        validDate(),
        validDate(),
        (date1, date2) => {
          // Ensure date1 > date2 (end before start scenario)
          const startDate = date1 > date2 ? date1 : date2;
          const endDate = date1 > date2 ? date2 : date1;
          
          // Only test when dates are actually different (end < start)
          if (endDate < startDate) {
            const result = validateDateRange(startDate, endDate);
            expect(result).toBe(false);
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 6: Date range validation**
   * **Validates: Requirements 7.3**
   * 
   * Property: For any start date and end date where end >= start,
   * validation should return true (valid state).
   */
  it('should return true when end date is on or after start date', () => {
    fc.assert(
      fc.property(
        validDate(),
        fc.nat({ max: 365 * 10 }), // Up to 10 years offset
        (startDate, daysOffset) => {
          // Create end date that is >= start date
          const endDate = new Date(startDate.getTime() + daysOffset * 24 * 60 * 60 * 1000);
          
          const result = validateDateRange(startDate, endDate);
          expect(result).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 6: Date range validation**
   * **Validates: Requirements 7.3**
   * 
   * Property: When start date equals end date (same day), validation should return true.
   */
  it('should return true when start date equals end date', () => {
    fc.assert(
      fc.property(
        validDate(),
        (date) => {
          const result = validateDateRange(date, date);
          expect(result).toBe(true);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 6: Date range validation**
   * **Validates: Requirements 7.3**
   * 
   * Property: When either date is undefined, validation should return false.
   */
  it('should return false when start date is undefined', () => {
    fc.assert(
      fc.property(
        validDate(),
        (endDate) => {
          const result = validateDateRange(undefined, endDate);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false when end date is undefined', () => {
    fc.assert(
      fc.property(
        validDate(),
        (startDate) => {
          const result = validateDateRange(startDate, undefined);
          expect(result).toBe(false);
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should return false when both dates are undefined', () => {
    const result = validateDateRange(undefined, undefined);
    expect(result).toBe(false);
  });
});
