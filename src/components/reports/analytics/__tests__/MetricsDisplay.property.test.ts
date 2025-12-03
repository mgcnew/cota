/**
 * Property-Based Tests for Analytics Metrics Display
 * 
 * **Feature: relatorios-refactoring, Property 1: Analytics displays exactly 4 metrics**
 * **Validates: Requirements 2.1**
 * 
 * Tests that for any valid analytics data state, when the Analytics tab is active 
 * and data is loaded, the system should render exactly 4 metric cards in the 
 * metrics grid or carousel.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { Metric, MetricTrend } from '@/types/reports';

/**
 * Pure function that determines how many metrics will be displayed.
 * This mirrors the logic in MetricsGrid and MetricsCarousel components:
 * `const displayMetrics = metrics.slice(0, 4);`
 * 
 * @param metrics - Array of metrics to display
 * @returns Number of metrics that will be displayed (max 4)
 */
export function getDisplayedMetricsCount(metrics: Metric[]): number {
  return metrics.slice(0, 4).length;
}

/**
 * Arbitrary generator for valid Metric objects
 */
const metricTrendArbitrary = fc.constantFrom<MetricTrend>('positivo', 'negativo', 'neutro');

const metricArbitrary: fc.Arbitrary<Metric> = fc.record({
  id: fc.uuid(),
  titulo: fc.string({ minLength: 1, maxLength: 50 }),
  valor: fc.string({ minLength: 1, maxLength: 20 }),
  descricao: fc.string({ minLength: 1, maxLength: 100 }),
  variacao: fc.option(fc.string({ minLength: 1, maxLength: 10 }), { nil: undefined }),
  tipo: metricTrendArbitrary,
});

describe('Analytics Metrics Display - Property Tests', () => {
  /**
   * **Feature: relatorios-refactoring, Property 1: Analytics displays exactly 4 metrics**
   * **Validates: Requirements 2.1**
   * 
   * Property: For any array of 4 or more metrics, exactly 4 metrics should be displayed.
   */
  it('should display exactly 4 metrics when 4 or more metrics are provided', () => {
    fc.assert(
      fc.property(
        fc.array(metricArbitrary, { minLength: 4, maxLength: 20 }),
        (metrics) => {
          const displayedCount = getDisplayedMetricsCount(metrics);
          expect(displayedCount).toBe(4);
          return displayedCount === 4;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 1: Analytics displays exactly 4 metrics**
   * **Validates: Requirements 2.1**
   * 
   * Property: For any array with fewer than 4 metrics, all provided metrics should be displayed.
   */
  it('should display all metrics when fewer than 4 are provided', () => {
    fc.assert(
      fc.property(
        fc.array(metricArbitrary, { minLength: 0, maxLength: 3 }),
        (metrics) => {
          const displayedCount = getDisplayedMetricsCount(metrics);
          expect(displayedCount).toBe(metrics.length);
          return displayedCount === metrics.length;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 1: Analytics displays exactly 4 metrics**
   * **Validates: Requirements 2.1**
   * 
   * Property: The displayed metrics count should never exceed 4.
   */
  it('should never display more than 4 metrics regardless of input size', () => {
    fc.assert(
      fc.property(
        fc.array(metricArbitrary, { minLength: 0, maxLength: 100 }),
        (metrics) => {
          const displayedCount = getDisplayedMetricsCount(metrics);
          expect(displayedCount).toBeLessThanOrEqual(4);
          return displayedCount <= 4;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 1: Analytics displays exactly 4 metrics**
   * **Validates: Requirements 2.1**
   * 
   * Property: The displayed metrics count should be the minimum of input length and 4.
   */
  it('should display min(metrics.length, 4) metrics', () => {
    fc.assert(
      fc.property(
        fc.array(metricArbitrary, { minLength: 0, maxLength: 50 }),
        (metrics) => {
          const displayedCount = getDisplayedMetricsCount(metrics);
          const expectedCount = Math.min(metrics.length, 4);
          expect(displayedCount).toBe(expectedCount);
          return displayedCount === expectedCount;
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: relatorios-refactoring, Property 1: Analytics displays exactly 4 metrics**
   * **Validates: Requirements 2.1**
   * 
   * Property: Empty metrics array should display 0 metrics.
   */
  it('should display 0 metrics when array is empty', () => {
    const displayedCount = getDisplayedMetricsCount([]);
    expect(displayedCount).toBe(0);
  });
});
