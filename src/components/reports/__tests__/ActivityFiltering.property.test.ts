/**
 * Property-Based Tests for Activity Filtering
 * 
 * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
 * **Validates: Requirements 4.2, 4.3**
 * 
 * Tests that for any search term and type filter combination, all displayed activity items 
 * should match both the search criteria (if provided) and the type filter (if not "all").
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ActivityItem } from '@/types/reports';

/**
 * Pure function that filters activity items by search term and type.
 * Mirrors the logic in ActivityHistory component.
 * 
 * @param activities - Array of activity items to filter
 * @param searchTerm - Search term to match against acao and detalhes
 * @param tipoFilter - Type filter ('all' or specific type)
 * @returns Filtered array of activity items
 */
export function filterActivities(
  activities: ActivityItem[],
  searchTerm: string,
  tipoFilter: string
): ActivityItem[] {
  return activities.filter(item => {
    const matchesSearch = !searchTerm || 
      item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.detalhes.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesTipo = tipoFilter === 'all' || item.tipo === tipoFilter;
    
    return matchesSearch && matchesTipo;
  });
}

/**
 * Validates that all filtered items match the search criteria.
 * 
 * @param items - Filtered activity items
 * @param searchTerm - Search term used for filtering
 * @returns true if all items match the search criteria
 */
export function allItemsMatchSearch(items: ActivityItem[], searchTerm: string): boolean {
  if (!searchTerm) {
    return true; // Empty search term matches everything
  }

  return items.every(item => 
    item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.detalhes.toLowerCase().includes(searchTerm.toLowerCase())
  );
}

/**
 * Validates that all filtered items match the type filter.
 * 
 * @param items - Filtered activity items
 * @param tipoFilter - Type filter used for filtering
 * @returns true if all items match the type filter
 */
export function allItemsMatchType(items: ActivityItem[], tipoFilter: string): boolean {
  if (tipoFilter === 'all') {
    return true; // 'all' filter matches everything
  }

  return items.every(item => item.tipo === tipoFilter);
}

/**
 * Arbitrary generator for valid ISO date strings
 */
const isoDateArbitrary = fc.date({ min: new Date(2020, 0, 1), max: new Date(2025, 11, 31) })
  .map(d => {
    if (isNaN(d.getTime())) {
      return new Date().toISOString();
    }
    return d.toISOString();
  });

/**
 * Arbitrary generator for activity types
 */
const activityTypeArbitrary = fc.constantFrom('cotacao', 'pedido', 'produto', 'fornecedor');

/**
 * Arbitrary generator for activity items
 */
const activityItemArbitrary: fc.Arbitrary<ActivityItem> = fc.record({
  id: fc.uuid(),
  tipo: activityTypeArbitrary,
  acao: fc.string({ minLength: 1, maxLength: 50 }),
  detalhes: fc.string({ minLength: 1, maxLength: 100 }),
  data: fc.string({ minLength: 1, maxLength: 50 }),
  usuario: fc.string({ minLength: 1, maxLength: 50 }),
  valor: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  economia: fc.option(fc.string({ minLength: 1, maxLength: 20 })),
  created_at: isoDateArbitrary,
});

/**
 * Arbitrary generator for arrays of activity items
 */
const activityArrayArbitrary = fc.array(activityItemArbitrary, { minLength: 0, maxLength: 100 });

/**
 * Arbitrary generator for search terms
 */
const searchTermArbitrary = fc.oneof(
  fc.constant(''), // Empty search term
  fc.string({ minLength: 1, maxLength: 20 })
);

/**
 * Arbitrary generator for type filters
 */
const typeFilterArbitrary = fc.oneof(
  fc.constant('all'),
  activityTypeArbitrary
);

describe('Activity Filtering - Property Tests', () => {
  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: For any search term, all filtered items should match the search criteria.
   */
  it('should return only items matching the search term', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        searchTermArbitrary,
        (activities, searchTerm) => {
          const filtered = filterActivities(activities, searchTerm, 'all');
          return allItemsMatchSearch(filtered, searchTerm);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: For any type filter, all filtered items should match the type filter.
   */
  it('should return only items matching the type filter', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        typeFilterArbitrary,
        (activities, tipoFilter) => {
          const filtered = filterActivities(activities, '', tipoFilter);
          return allItemsMatchType(filtered, tipoFilter);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: For any combination of search term and type filter, all filtered items 
   * should match both criteria.
   */
  it('should return only items matching both search term and type filter', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        searchTermArbitrary,
        typeFilterArbitrary,
        (activities, searchTerm, tipoFilter) => {
          const filtered = filterActivities(activities, searchTerm, tipoFilter);
          
          // All items must match both search and type criteria
          return filtered.every(item => {
            const matchesSearch = !searchTerm || 
              item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
              item.detalhes.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesTipo = tipoFilter === 'all' || item.tipo === tipoFilter;
            
            return matchesSearch && matchesTipo;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: Filtering with 'all' type filter should return all items matching the search term.
   */
  it('should return all matching items when type filter is "all"', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        searchTermArbitrary,
        (activities, searchTerm) => {
          const filtered = filterActivities(activities, searchTerm, 'all');
          
          // Should match all items that satisfy the search criteria
          const expectedCount = activities.filter(item =>
            !searchTerm || 
            item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.detalhes.toLowerCase().includes(searchTerm.toLowerCase())
          ).length;
          
          return filtered.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: Filtering with empty search term should return all items of the specified type.
   */
  it('should return all items of specified type when search term is empty', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        typeFilterArbitrary,
        (activities, tipoFilter) => {
          const filtered = filterActivities(activities, '', tipoFilter);
          
          // Should match all items of the specified type
          const expectedCount = tipoFilter === 'all' 
            ? activities.length
            : activities.filter(item => item.tipo === tipoFilter).length;
          
          return filtered.length === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: Filtering should never return items that don't match the criteria.
   */
  it('should never return items that do not match the criteria', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        searchTermArbitrary,
        typeFilterArbitrary,
        (activities, searchTerm, tipoFilter) => {
          const filtered = filterActivities(activities, searchTerm, tipoFilter);
          const unfiltered = activities.filter(item => !filtered.includes(item));
          
          // All unfiltered items should NOT match the criteria
          return unfiltered.every(item => {
            const matchesSearch = searchTerm && 
              (item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
               item.detalhes.toLowerCase().includes(searchTerm.toLowerCase()));
            
            const matchesTipo = tipoFilter !== 'all' && item.tipo === tipoFilter;
            
            // Item should fail at least one criterion
            return !matchesSearch || !matchesTipo;
          });
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: Filtering should be case-insensitive for search terms.
   */
  it('should perform case-insensitive search', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (activities, searchTerm) => {
          const filteredLower = filterActivities(activities, searchTerm.toLowerCase(), 'all');
          const filteredUpper = filterActivities(activities, searchTerm.toUpperCase(), 'all');
          const filteredMixed = filterActivities(activities, searchTerm, 'all');
          
          // All three should return the same items
          return filteredLower.length === filteredUpper.length &&
                 filteredUpper.length === filteredMixed.length &&
                 filteredLower.every(item => filteredMixed.some(m => m.id === item.id));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: Filtering should preserve all matching items (no duplicates, no loss).
   */
  it('should preserve all matching items without duplicates', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        searchTermArbitrary,
        typeFilterArbitrary,
        (activities, searchTerm, tipoFilter) => {
          const filtered = filterActivities(activities, searchTerm, tipoFilter);
          
          // No duplicates
          const uniqueIds = new Set(filtered.map(item => item.id));
          if (uniqueIds.size !== filtered.length) {
            return false;
          }
          
          // All filtered items should be from the original array
          return filtered.every(filteredItem =>
            activities.some(originalItem => originalItem.id === filteredItem.id)
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: Empty search term with 'all' type filter should return all items.
   */
  it('should return all items when search term is empty and type filter is "all"', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        (activities) => {
          const filtered = filterActivities(activities, '', 'all');
          return filtered.length === activities.length &&
                 filtered.every(item => activities.some(a => a.id === item.id));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: Filtering should be idempotent (filtering twice should give same result as once).
   */
  it('should be idempotent - filtering twice should equal filtering once', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        searchTermArbitrary,
        typeFilterArbitrary,
        (activities, searchTerm, tipoFilter) => {
          const filtered1 = filterActivities(activities, searchTerm, tipoFilter);
          const filtered2 = filterActivities(filtered1, searchTerm, tipoFilter);
          
          // Both should have same length and same items
          return filtered1.length === filtered2.length &&
                 filtered1.every((item, idx) => item.id === filtered2[idx].id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: Filtering should work correctly with special characters in search terms.
   */
  it('should handle special characters in search terms', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        fc.string({ minLength: 1, maxLength: 20 }),
        (activities, searchTerm) => {
          // Should not throw and should return valid results
          const filtered = filterActivities(activities, searchTerm, 'all');
          
          // All filtered items should match the search
          return filtered.every(item =>
            item.acao.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.detalhes.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 4: Activity filtering returns matching items**
   * **Validates: Requirements 4.2, 4.3**
   * 
   * Property: Filtering with a specific type should never return items of other types.
   */
  it('should never return items of different type when type filter is specific', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        activityTypeArbitrary,
        (activities, tipoFilter) => {
          const filtered = filterActivities(activities, '', tipoFilter);
          
          // All filtered items should have the specified type
          return filtered.every(item => item.tipo === tipoFilter);
        }
      ),
      { numRuns: 100 }
    );
  });
});
