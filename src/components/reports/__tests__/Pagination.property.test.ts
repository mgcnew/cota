/**
 * Property-Based Tests for Pagination
 * 
 * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
 * **Validates: Requirements 4.5**
 * 
 * Tests that for any page size configuration and total items count, the number of 
 * displayed items on any page should not exceed the configured page size.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { ActivityItem } from '@/types/reports';

/**
 * Pure function that paginates an array of items based on page number and page size.
 * 
 * @param items - Array of items to paginate
 * @param pageNumber - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Array of items for the current page
 */
export function paginateItems(
  items: ActivityItem[],
  pageNumber: number,
  pageSize: number
): ActivityItem[] {
  if (pageSize <= 0 || pageNumber <= 0) {
    return [];
  }

  const startIndex = (pageNumber - 1) * pageSize;
  const endIndex = startIndex + pageSize;

  return items.slice(startIndex, endIndex);
}

/**
 * Pure function that calculates the total number of pages.
 * 
 * @param totalItems - Total number of items
 * @param pageSize - Number of items per page
 * @returns Total number of pages
 */
export function calculateTotalPages(totalItems: number, pageSize: number): number {
  if (pageSize <= 0) {
    return 0;
  }

  return Math.ceil(totalItems / pageSize);
}

/**
 * Pure function that validates if a page number is valid.
 * 
 * @param pageNumber - Page number to validate
 * @param totalPages - Total number of pages
 * @returns true if page number is valid (1 to totalPages inclusive)
 */
export function isValidPageNumber(pageNumber: number, totalPages: number): boolean {
  return pageNumber >= 1 && pageNumber <= totalPages;
}

/**
 * Pure function that gets all items for a specific page range.
 * 
 * @param items - Array of items
 * @param pageNumber - Current page number (1-indexed)
 * @param pageSize - Number of items per page
 * @returns Object with page items and pagination metadata
 */
export function getPaginatedData(
  items: ActivityItem[],
  pageNumber: number,
  pageSize: number
): {
  items: ActivityItem[];
  pageNumber: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
} {
  const totalItems = items.length;
  const totalPages = calculateTotalPages(totalItems, pageSize);
  const validPageNumber = Math.max(1, Math.min(pageNumber, totalPages || 1));
  const pageItems = paginateItems(items, validPageNumber, pageSize);

  return {
    items: pageItems,
    pageNumber: validPageNumber,
    pageSize,
    totalItems,
    totalPages,
    hasNextPage: validPageNumber < totalPages,
    hasPreviousPage: validPageNumber > 1,
  };
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
 * Arbitrary generator for arrays of activity items
 */
const activityArrayArbitrary = fc.array(activityItemArbitrary, { minLength: 0, maxLength: 1000 });

/**
 * Arbitrary generator for valid page sizes (1 to 100)
 */
const pageSizeArbitrary = fc.integer({ min: 1, max: 100 });

/**
 * Arbitrary generator for page numbers (1 to 100)
 */
const pageNumberArbitrary = fc.integer({ min: 1, max: 100 });

describe('Pagination - Property Tests', () => {
  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any page size and total items count, the number of displayed items 
   * on any page should not exceed the configured page size.
   */
  it('should never display more items than the configured page size', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        pageSizeArbitrary,
        pageNumberArbitrary,
        (items, pageSize, pageNumber) => {
          const paginatedItems = paginateItems(items, pageNumber, pageSize);
          
          // Number of items should not exceed page size
          return paginatedItems.length <= pageSize;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any valid page number, the last page may have fewer items than 
   * the page size, but all other pages should have exactly page size items.
   */
  it('should have exactly page size items on all pages except possibly the last', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary.filter(arr => arr.length > 0),
        pageSizeArbitrary,
        (items, pageSize) => {
          const totalPages = calculateTotalPages(items.length, pageSize);
          
          // Check all pages except the last
          for (let pageNum = 1; pageNum < totalPages; pageNum++) {
            const pageItems = paginateItems(items, pageNum, pageSize);
            if (pageItems.length !== pageSize) {
              return false;
            }
          }

          // Last page should have <= pageSize items
          if (totalPages > 0) {
            const lastPageItems = paginateItems(items, totalPages, pageSize);
            if (lastPageItems.length > pageSize || lastPageItems.length === 0) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array and page size, the total number of items across 
   * all pages should equal the original array length.
   */
  it('should preserve all items across all pages', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        pageSizeArbitrary,
        (items, pageSize) => {
          const totalPages = calculateTotalPages(items.length, pageSize);
          const allPaginatedItems: ActivityItem[] = [];

          // Collect items from all pages
          for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const pageItems = paginateItems(items, pageNum, pageSize);
            allPaginatedItems.push(...pageItems);
          }

          // Should have same length and same items
          if (allPaginatedItems.length !== items.length) {
            return false;
          }

          // All original IDs should be present
          const originalIds = new Set(items.map(item => item.id));
          const paginatedIds = new Set(allPaginatedItems.map(item => item.id));

          return originalIds.size === paginatedIds.size &&
                 Array.from(originalIds).every(id => paginatedIds.has(id));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array and page size, requesting an invalid page number 
   * should return an empty array or the first/last page.
   */
  it('should handle invalid page numbers gracefully', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        pageSizeArbitrary,
        (items, pageSize) => {
          // Page 0 or negative should return empty
          const page0 = paginateItems(items, 0, pageSize);
          const pageNegative = paginateItems(items, -1, pageSize);

          if (page0.length !== 0 || pageNegative.length !== 0) {
            return false;
          }

          // Very large page number should return empty
          const largePageNum = 999999;
          const largePage = paginateItems(items, largePageNum, pageSize);

          return largePage.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array and page size, the total pages calculation should 
   * be correct (ceiling of items / pageSize).
   */
  it('should calculate total pages correctly', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        pageSizeArbitrary,
        (items, pageSize) => {
          const totalPages = calculateTotalPages(items.length, pageSize);
          const expectedPages = Math.ceil(items.length / pageSize);

          return totalPages === expectedPages;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array, page size, and page number, pagination should 
   * not duplicate items across pages.
   */
  it('should not duplicate items across pages', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary.filter(arr => arr.length > 0),
        pageSizeArbitrary,
        (items, pageSize) => {
          const totalPages = calculateTotalPages(items.length, pageSize);
          const allIds: string[] = [];

          // Collect all IDs from all pages
          for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const pageItems = paginateItems(items, pageNum, pageSize);
            allIds.push(...pageItems.map(item => item.id));
          }

          // Check for duplicates
          const uniqueIds = new Set(allIds);
          return uniqueIds.size === allIds.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array and page size, the first page should contain 
   * the first items from the original array.
   */
  it('should return items in correct order across pages', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary.filter(arr => arr.length > 0),
        pageSizeArbitrary,
        (items, pageSize) => {
          const page1 = paginateItems(items, 1, pageSize);
          const page2 = paginateItems(items, 2, pageSize);

          // First page should match first items
          const expectedFirstPage = items.slice(0, pageSize);
          if (page1.length !== expectedFirstPage.length) {
            return false;
          }

          if (!page1.every((item, idx) => item.id === expectedFirstPage[idx].id)) {
            return false;
          }

          // Second page should match next items
          const expectedSecondPage = items.slice(pageSize, pageSize * 2);
          if (page2.length !== expectedSecondPage.length) {
            return false;
          }

          return page2.every((item, idx) => item.id === expectedSecondPage[idx].id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array and page size, the getPaginatedData function should 
   * return correct metadata about pagination state.
   */
  it('should return correct pagination metadata', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        pageSizeArbitrary,
        pageNumberArbitrary,
        (items, pageSize, pageNumber) => {
          const paginatedData = getPaginatedData(items, pageNumber, pageSize);

          // Verify metadata
          if (paginatedData.totalItems !== items.length) {
            return false;
          }

          if (paginatedData.pageSize !== pageSize) {
            return false;
          }

          if (paginatedData.totalPages !== calculateTotalPages(items.length, pageSize)) {
            return false;
          }

          // Verify hasNextPage logic
          const expectedHasNextPage = paginatedData.pageNumber < paginatedData.totalPages;
          if (paginatedData.hasNextPage !== expectedHasNextPage) {
            return false;
          }

          // Verify hasPreviousPage logic
          const expectedHasPreviousPage = paginatedData.pageNumber > 1;
          if (paginatedData.hasPreviousPage !== expectedHasPreviousPage) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For empty items array, pagination should return empty results regardless 
   * of page number or page size.
   */
  it('should handle empty items array correctly', () => {
    fc.assert(
      fc.property(
        pageSizeArbitrary,
        pageNumberArbitrary,
        (pageSize, pageNumber) => {
          const emptyItems: ActivityItem[] = [];
          const paginatedItems = paginateItems(emptyItems, pageNumber, pageSize);
          const totalPages = calculateTotalPages(emptyItems.length, pageSize);

          return paginatedItems.length === 0 && totalPages === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array and page size, requesting the same page multiple 
   * times should return identical results (idempotence).
   */
  it('should return identical results for the same page number', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        pageSizeArbitrary,
        pageNumberArbitrary,
        (items, pageSize, pageNumber) => {
          const page1 = paginateItems(items, pageNumber, pageSize);
          const page2 = paginateItems(items, pageNumber, pageSize);

          return page1.length === page2.length &&
                 page1.every((item, idx) => item.id === page2[idx].id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array and page size, page size of 1 should return 
   * exactly 1 item per page (except possibly the last page if empty).
   */
  it('should handle page size of 1 correctly', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        (items) => {
          const pageSize = 1;
          const totalPages = calculateTotalPages(items.length, pageSize);

          for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            const pageItems = paginateItems(items, pageNum, pageSize);
            if (pageItems.length !== 1) {
              return false;
            }
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array and very large page size, pagination should 
   * return all items on page 1 and empty on subsequent pages.
   */
  it('should handle very large page size correctly', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        (items) => {
          const largePageSize = 10000;
          const page1 = paginateItems(items, 1, largePageSize);
          const page2 = paginateItems(items, 2, largePageSize);

          // Page 1 should have all items
          if (page1.length !== items.length) {
            return false;
          }

          // Page 2 should be empty
          return page2.length === 0;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 5: Pagination respects page size**
   * **Validates: Requirements 4.5**
   * 
   * Property: For any items array and page size, isValidPageNumber should correctly 
   * identify valid page numbers.
   */
  it('should correctly validate page numbers', () => {
    fc.assert(
      fc.property(
        activityArrayArbitrary,
        pageSizeArbitrary,
        (items, pageSize) => {
          const totalPages = calculateTotalPages(items.length, pageSize);

          // Valid pages should be 1 to totalPages
          for (let pageNum = 1; pageNum <= totalPages; pageNum++) {
            if (!isValidPageNumber(pageNum, totalPages)) {
              return false;
            }
          }

          // Invalid pages should be 0, negative, or > totalPages
          if (isValidPageNumber(0, totalPages)) {
            return false;
          }

          if (isValidPageNumber(-1, totalPages)) {
            return false;
          }

          if (totalPages > 0 && isValidPageNumber(totalPages + 1, totalPages)) {
            return false;
          }

          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});
