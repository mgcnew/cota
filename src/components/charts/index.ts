/**
 * Charts Module Index (Requirements 12.4)
 * 
 * This module exports chart-related components and utilities.
 * Recharts is loaded from a separate vendor-charts chunk for better code splitting.
 */

export { 
  ChartSkeleton, 
  LazyChartsProvider,
  // Re-exported recharts components
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
} from './LazyCharts';
