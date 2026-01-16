import * as React from "react";
import { memo } from "react";
import { cn } from "@/lib/utils";

export interface GridConfig {
  mobile?: number;
  tablet?: number;
  desktop?: number;
}

export interface ResponsiveGridProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  config?: GridConfig;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

const gapClasses = {
  sm: 'gap-3',
  md: 'gap-3 sm:gap-4',
  lg: 'gap-4 sm:gap-6',
} as const;

// Pre-defined responsive grid classes to ensure Tailwind JIT picks them up
const gridConfigs: Record<string, string> = {
  '1-1-1': 'grid-cols-1 sm:grid-cols-1 lg:grid-cols-1',
  '1-2-2': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2',
  '1-2-3': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  '1-2-4': 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
  '2-2-2': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-2',
  '2-2-3': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3',
  '2-2-4': 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-4',
  '2-3-4': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
  '2-3-6': 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
  '1-3-4': 'grid-cols-1 sm:grid-cols-3 lg:grid-cols-4',
};

export const ResponsiveGrid = memo(function ResponsiveGrid({
  children,
  config = { mobile: 2, tablet: 2, desktop: 4 },
  gap = 'md',
  className,
  ...props
}: ResponsiveGridProps): JSX.Element {
  const { mobile = 2, tablet = 2, desktop = 4 } = config;
  const configKey = `${mobile}-${tablet}-${desktop}`;
  const gridClass = gridConfigs[configKey] || gridConfigs['2-2-4'];

  return (
    <div className={cn('grid w-full', gridClass, gapClasses[gap], className)} {...props}>
      {children}
    </div>
  );
});

export default ResponsiveGrid;
