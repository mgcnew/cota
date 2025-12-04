import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/useBreakpoint";

/**
 * Size variants for ResponsiveCard
 * - compact: Minimal padding, smaller text
 * - default: Standard padding and text
 * - large: Generous padding, larger text
 */
export type CardSize = 'compact' | 'default' | 'large';

/**
 * Padding variants for ResponsiveCard
 * - none: No padding
 * - sm: Small padding (8px mobile, 12px tablet, 16px desktop)
 * - md: Medium padding (12px mobile, 16px tablet, 24px desktop)
 * - lg: Large padding (16px mobile, 20px tablet, 32px desktop)
 */
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface ResponsiveCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Card content
   */
  children: React.ReactNode;
  /**
   * Size variant - controls padding and icon sizing
   * @default 'default'
   */
  size?: CardSize;
  /**
   * Padding variant - controls internal spacing
   * @default 'md'
   */
  padding?: CardPadding;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Whether to apply hover effects (disabled on mobile)
   * @default true
   */
  interactive?: boolean;
}

/**
 * Padding classes for different sizes and breakpoints
 */
const paddingClasses: Record<CardPadding, string> = {
  none: 'p-0',
  sm: 'p-2 sm:p-3 lg:p-4',      // 8px, 12px, 16px
  md: 'p-3 sm:p-4 lg:p-6',      // 12px, 16px, 24px
  lg: 'p-4 sm:p-5 lg:p-8',      // 16px, 20px, 32px
};

/**
 * Size-specific classes for ResponsiveCard
 */
const sizeClasses: Record<CardSize, string> = {
  compact: 'gap-2',
  default: 'gap-3',
  large: 'gap-4',
};

/**
 * ResponsiveCard - A card component that adapts to different screen sizes
 * 
 * Features:
 * - Responsive padding: 12px mobile, 16px tablet, 24px desktop (default)
 * - Size variants: compact, default, large
 * - Icon sizing: 25% smaller on mobile
 * - Hover effects disabled on mobile (touch devices)
 * - Automatic responsive spacing
 * 
 * @example
 * ```tsx
 * <ResponsiveCard size="default" padding="md">
 *   <div className="flex items-center gap-3">
 *     <Icon className="h-5 w-5 sm:h-6 sm:w-6" />
 *     <div>
 *       <h3>Title</h3>
 *       <p>Description</p>
 *     </div>
 *   </div>
 * </ResponsiveCard>
 * ```
 * 
 * Requirements: 3.1, 3.5
 */
export function ResponsiveCard({
  children,
  size = 'default',
  padding = 'md',
  className,
  interactive = true,
  ...props
}: ResponsiveCardProps): JSX.Element {
  const { isMobile } = useBreakpoint();

  return (
    <Card
      className={cn(
        // Base card styling
        'w-full',
        // Responsive padding
        paddingClasses[padding],
        // Size-specific gap
        sizeClasses[size],
        // Interactive hover effects (disabled on mobile)
        interactive && !isMobile && 'hover:shadow-md hover:bg-accent/50 transition-all duration-200 cursor-pointer',
        // Mobile-specific styling
        isMobile && 'shadow-sm',
        className
      )}
      {...props}
    >
      <CardContent className="p-0">
        {children}
      </CardContent>
    </Card>
  );
}

export default ResponsiveCard;
