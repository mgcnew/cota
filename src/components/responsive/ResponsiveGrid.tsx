import * as React from "react";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/useBreakpoint";

/**
 * Grid column configuration for different breakpoints
 */
export interface GridConfig {
  /**
   * Number of columns on mobile (width < 768px)
   * @default 2
   */
  mobile?: number;
  /**
   * Number of columns on tablet (768px <= width < 1024px)
   * @default 2
   */
  tablet?: number;
  /**
   * Number of columns on desktop (width >= 1024px)
   * @default 4
   */
  desktop?: number;
}

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Grid items to render
   */
  children: React.ReactNode;
  /**
   * Grid configuration for different breakpoints
   */
  config?: GridConfig;
  /**
   * Gap between grid items
   * @default 'md'
   */
  gap?: 'sm' | 'md' | 'lg';
  /**
   * Additional CSS class name
   */
  className?: string;
}

/**
 * Gap classes for grid spacing
 */
const gapClasses = {
  sm: 'gap-2 sm:gap-3 lg:gap-4',      // 8px, 12px, 16px
  md: 'gap-3 sm:gap-4 lg:gap-6',      // 12px, 16px, 24px
  lg: 'gap-4 sm:gap-6 lg:gap-8',      // 16px, 24px, 32px
} as const;

/**
 * Grid column classes for different breakpoints
 * Maps breakpoint to number of columns
 */
const gridColsClasses: Record<number, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
  5: 'grid-cols-5',
  6: 'grid-cols-6',
} as const;

/**
 * ResponsiveGrid - A grid component that adapts column count to screen size
 * 
 * Features:
 * - 2 columns on mobile (width < 768px)
 * - 2-3 columns on tablet (768px <= width < 1024px)
 * - 4 columns on desktop (width >= 1024px)
 * - Responsive gap spacing
 * - Customizable column configuration
 * 
 * @example
 * ```tsx
 * <ResponsiveGrid gap="md">
 *   {items.map(item => (
 *     <ResponsiveCard key={item.id}>
 *       {item.content}
 *     </ResponsiveCard>
 *   ))}
 * </ResponsiveGrid>
 * ```
 * 
 * @example
 * ```tsx
 * // Custom column configuration
 * <ResponsiveGrid
 *   config={{ mobile: 1, tablet: 2, desktop: 3 }}
 *   gap="lg"
 * >
 *   {items.map(item => (
 *     <Card key={item.id}>{item.content}</Card>
 *   ))}
 * </ResponsiveGrid>
 * ```
 * 
 * Requirements: 3.2, 3.3, 3.4
 */
export function ResponsiveGrid({
  children,
  config = {
    mobile: 2,    // 2 columns on mobile (Requirement 3.2)
    tablet: 2,    // 2-3 columns on tablet (Requirement 3.3)
    desktop: 4,   // 4 columns on desktop (Requirement 3.4)
  },
  gap = 'md',
  className,
  ...props
}: ResponsiveGridProps): JSX.Element {
  const { current: breakpoint } = useBreakpoint();

  // Determine current column count based on breakpoint
  const mobileColsClass = gridColsClasses[config.mobile ?? 2];
  const tabletColsClass = gridColsClasses[config.tablet ?? 2];
  const desktopColsClass = gridColsClasses[config.desktop ?? 4];

  // Build responsive grid classes
  const gridClasses = cn(
    'grid',
    mobileColsClass,
    `sm:${tabletColsClass}`,
    `lg:${desktopColsClass}`,
    gapClasses[gap],
    'w-full',
    className
  );

  return (
    <div
      className={gridClasses}
      {...props}
    >
      {children}
    </div>
  );
}

export default ResponsiveGrid;
