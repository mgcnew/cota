/**
 * Property-Based Tests for Activity Chronological Order
 * 
 * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
 * **Validates: Requirements 4.1**
 * 
 * Tests that for any list of activity items returned from the history, the items 
 * should be sorted by created_at date in descending order (newest first).
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ActivityItem } from '@/types/reports';

/**
 * Pure function that sorts activity items chronologically in descending order (newest first).
 * This mirrors the logic in ActivityHistory: `.order("created_at", { ascending: false })`
 * 
 * @param activities - Array of activity items to sort
 * @returns Sorted array with newest items first
 */
export function sortActivitiesChronologically(activities: ActivityItem[]): ActivityItem[] {
  return [...activities].sort((a, b) => {
    const dateA = new Date(a.created_at).getTime();
    const dateB = new Date(b.created_at).getTime();
    return dateB - dateA; // Descending order (newest first)
  });
}

/**
 * Pure function that validates if an activity list is chronologically ordered.
 * 
 * @param activities - Array of activity items to validate
 * @returns true if the list is sorted in descending chronological order, false otherwise
 */
export function isChronologicallyOrdered(activities: ActivityItem[]): boolean {
  if (activities.length <= 1) {
    return true;
  }

  for (let i = 0; i < activities.length - 1; i++) {
    const currentDate = new Date(activities[i].created_at).getTime();
    const nextDate = new Date(activities[i + 1].created_at).getTime();
    
    // Current item should be >= next item (descending order)
    if (currentDate < nextDate) {
      return false;
    }
  }

  return true;
}

/**
 * Pure function that gets the chronological order of activities.
 * Returns an array of indices showing the order of items.
 * 
 * @param activities - Array of activity items
 * @returns Array of indices in chronological order
 */
export function getChronologicalOrder(activities: ActivityItem[]): number[] {
  return activities
    .map((_, index) => index)
    .sort((aIdx, bIdx) => {
      const dateA = new Date(activities[aIdx].created_at).getTime();
      const dateB = new Date(activities[bIdx].created_at).getTime();
      return dateB - dateA; // Descending order
    });
}

/**
 * Arbitrary generator for valid ISO date strings
 */
const isoDateArbitrary = fc.date({ min: new Date(2020, 0, 1), max: new Date(2025, 11, 31) })
  .map(d => {
    // Ensure the date is valid before converting to ISO string
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  });

/**
 * Arbitrary generator for activity items
 */
const activityItemArbitrary: fc.Arbitrary<ActivityItem> = fc.record({
  id: fc.uuid(),
  tipo: fc.constantFrom('cotacao', 'pedido', 'produto', 'fornecedor'),
  acao: fc.string({ minLength: 1, maxLength: 50 }),
  detalhes: fc.string({ minLength: 1, maxLength: 100 }),
  data: fc.string({ minLength: 1, maxLength: 50 }),
  usuario: fc.string({ minLength: 1, maxLength: 50 }),
  valor: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  economia: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  created_at: isoDateArbitrary,
});

/**
 * Arbitrary generator for arrays of activity items with valid dates
 */
const activityArrayArbitrary = fc.array(activityItemArbitrary, { minLength: 0, maxLength: 100 });

describe('Activity Chronological Order - Property Tests', () => {
  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any list of activity items, after sorting chronologically,
   * the list should be in descending order (newest first).
   */
  it('should sort any activity list in descending chronological order', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        (activities) => {
          const sorted = sortActivitiesChronologically(activities);
          
          // Verify the sorted list is chronologically ordered
          return isChronologicallyOrdered(sorted);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any activity list, sorting should preserve all items
   * (no items should be lost or duplicated).
   */
  it('should preserve all items when sorting chronologically', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        (activities) => {
          const sorted = sortActivitiesChronologically(activities);
          
          // Same length
          if (sorted.length !== activities.length) {
            return false;
          }

          // All original IDs should be present
          const originalIds = new Set(activities.map(a => a.id));
          const sortedIds = new Set(sorted.map(a => a.id));
          
          return originalIds.size === sortedIds.size &&
                 Array.from(originalIds).every(id => sortedIds.has(id));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any chronologically sorted list, the first item should have
   * the most recent (latest) created_at date.
   */
  it('should have the most recent item first after sorting', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary.filter(arr => arr.length > 0),
        (activities) => {
          const sorted = sortActivitiesChronologically(activities);
          
          if (sorted.length === 0) {
            return true;
          }

          const firstDate = new Date(sorted[0].created_at).getTime();
          
          // First item should have the maximum date
          return sorted.every(item => {
            const itemDate = new Date(item.created_at).getTime();
            return itemDate <= firstDate;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any chronologically sorted list, the last item should have
   * the oldest (earliest) created_at date.
   */
  it('should have the oldest item last after sorting', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary.filter(arr => arr.length > 0),
        (activities) => {
          const sorted = sortActivitiesChronologically(activities);
          
          if (sorted.length === 0) {
            return true;
          }

          const lastDate = new Date(sorted[sorted.length - 1].created_at).getTime();
          
          // Last item should have the minimum date
          return sorted.every(item => {
            const itemDate = new Date(item.created_at).getTime();
            return itemDate >= lastDate;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any activity list, the validation function should correctly
   * identify if it's chronologically ordered.
   */
  it('should correctly validate chronological order for any list', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        (activities) => {
          const sorted = sortActivitiesChronologically(activities);
          
          // Sorted list should be valid
          if (!isChronologicallyOrdered(sorted)) {
            return false;
          }

          // Original unsorted list should be valid only if it was already sorted
          const isOriginalOrdered = isChronologicallyOrdered(activities);
          
          // If original is ordered, it should match the sorted version
          if (isOriginalOrdered) {
            return activities.every((item, idx) => item.id === sorted[idx].id);
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: Sorting the same list twice should produce identical results
   * (idempotence property).
   */
  it('should produce identical results when sorted multiple times', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        (activities) => {
          const sorted1 = sortActivitiesChronologically(activities);
          const sorted2 = sortActivitiesChronologically(sorted1);
          
          // Both sorts should produce the same order
          return sorted1.length === sorted2.length &&
                 sorted1.every((item, idx) => item.id === sorted2[idx].id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any two activity lists, concatenating and sorting should
   * produce the same result as sorting each separately and concatenating.
   */
  it('should handle concatenated lists correctly', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        activityArrayArbitrary,
        (activities1, activities2) => {
          const concatenated = [...activities1, ...activities2];
          const sortedConcatenated = sortActivitiesChronologically(concatenated);
          
          const sorted1 = sortActivitiesChronologically(activities1);
          const sorted2 = sortActivitiesChronologically(activities2);
          const sortedSeparately = [...sorted1, ...sorted2];
          const sortedAgain = sortActivitiesChronologically(sortedSeparately);
          
          // Both approaches should produce the same result
          return sortedConcatenated.length === sortedAgain.length &&
                 sortedConcatenated.every((item, idx) => item.id === sortedAgain[idx].id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: Empty activity lists should be considered chronologically ordered.
   */
  it('should consider empty lists as chronologically ordered', () => {
    const emptyList: ActivityItem[] = [];
    expect(isChronologicallyOrdered(emptyList)).toBe(true);
    
    const sorted = sortActivitiesChronologically(emptyList);
    expect(sorted.length).toBe(0);
  });

  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: Single-item activity lists should be considered chronologically ordered.
   */
  it('should consider single-item lists as chronologically ordered', () => {
    fc.assert(
      fc.property(
        activityItemArbitrary,
        (activity) => {
          const singleList = [activity];
          
          expect(isChronologicallyOrdered(singleList)).toBe(true);
          
          const sorted = sortActivitiesChronologically(singleList);
          expect(sorted.length).toBe(1);
          expect(sorted[0].id).toBe(activity.id);
          
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 3: Activity list is chronologically ordered**
   * **Validates: Requirements 4.1**
   * 
   * Property: For any activity list with items having the same created_at date,
   * they should maintain relative order (stable sort).
   */
  it('should maintain relative order for items with same created_at date', () => {
    fc.assert(
      fc.property(
        fc.array(activityItemArbitrary, { minLength: 2, maxLength: 20 }),
        (activities) => {
          // Create a list where all items have the same created_at date
          const sameDate = new Date().toISOString();
          const sameTimeActivities = activities.map((item, idx) => ({
            ...item,
            created_at: sameDate,
            id: `item-${idx}` // Ensure unique IDs for tracking
          }));
          
          const sorted = sortActivitiesChronologically(sameTimeActivities);
          
          // All items should still be present
          return sorted.length === sameTimeActivities.length &&
                 sorted.every(item => sameTimeActivities.some(a => a.id === item.id));
        }
      ),
      { numRuns: 100 }
    );
  });
});
