import { useEffect, useCallback } from 'react';

/**
 * Prefetch functions for lazy-loaded pages
 * These are used to preload pages that the user is likely to navigate to next
 * Requirements: 16.5 - Preload likely next pages
 */

// Dashboard prefetch - used after login
export const prefetchDashboard = () => import('../pages/Dashboard');

// Products prefetch - commonly accessed from dashboard
export const prefetchProdutos = () => import('../pages/Produtos');

// Suppliers prefetch - commonly accessed from dashboard
export const prefetchFornecedores = () => import('../pages/Fornecedores');

// Compras prefetch - unified page for quotes and orders
export const prefetchCompras = () => import('../pages/Compras');

/**
 * Hook to prefetch pages on mount or after a delay
 * @param prefetchFn - The prefetch function to call
 * @param delay - Optional delay in ms before prefetching (default: 1000ms)
 */
export function usePrefetch(
  prefetchFn: () => Promise<unknown>,
  delay: number = 1000
): void {
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchFn().catch(() => {
        // Silently fail - prefetch is an optimization, not critical
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [prefetchFn, delay]);
}

/**
 * Hook to prefetch multiple pages
 * @param prefetchFns - Array of prefetch functions
 * @param delay - Optional delay in ms before prefetching (default: 1000ms)
 */
export function usePrefetchMultiple(
  prefetchFns: Array<() => Promise<unknown>>,
  delay: number = 1000
): void {
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchFns.forEach(fn => {
        fn().catch(() => {
          // Silently fail - prefetch is an optimization, not critical
        });
      });
    }, delay);

    return () => clearTimeout(timer);
  }, [prefetchFns, delay]);
}

/**
 * Returns a callback to manually trigger prefetch
 * Useful for prefetching on hover or focus events
 */
export function usePrefetchCallback(
  prefetchFn: () => Promise<unknown>
): () => void {
  return useCallback(() => {
    prefetchFn().catch(() => {
      // Silently fail
    });
  }, [prefetchFn]);
}
