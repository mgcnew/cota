/**
 * Lazy Loading for Chart Components (Requirements 12.4)
 * 
 * This module provides lazy-loaded versions of chart components.
 * Charts are loaded from a separate vendor-charts chunk to reduce initial bundle size.
 * 
 * The vite.config.ts manualChunks configuration ensures recharts is in its own chunk.
 * Components that use recharts will automatically load the vendor-charts chunk.
 * 
 * Usage:
 * ```tsx
 * import { LazyChartsProvider, ChartSkeleton } from '@/components/charts/LazyCharts';
 * 
 * // Wrap chart components with Suspense
 * <Suspense fallback={<ChartSkeleton height={300} />}>
 *   <MyChartComponent />
 * </Suspense>
 * ```
 */

import { Suspense, ReactNode } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

// Chart loading skeleton
export function ChartSkeleton({ height = 300, className = '' }: { height?: number; className?: string }) {
  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <Skeleton className="h-full w-full rounded-lg" />
    </div>
  );
}

// Type for chart wrapper props
interface ChartWrapperProps {
  children: ReactNode;
  height?: number;
  fallback?: ReactNode;
  className?: string;
}

/**
 * Wrapper component that provides a loading fallback for chart components
 * Use this to wrap any component that imports from recharts
 */
export function LazyChartsProvider({ children, height = 300, fallback, className }: ChartWrapperProps) {
  return (
    <Suspense fallback={fallback || <ChartSkeleton height={height} className={className} />}>
      {children}
    </Suspense>
  );
}

/**
 * Re-export recharts components for convenience
 * These will be loaded from the vendor-charts chunk due to vite configuration
 */
export { 
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
  ComposedChart,
} from 'recharts';
