import * as React from "react";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/useBreakpoint";

export interface ResponsiveFormActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Form action buttons
   */
  children: React.ReactNode;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Alignment of buttons in desktop mode
   * @default 'end'
   */
  align?: 'start' | 'center' | 'end' | 'between';
  /**
   * Whether to reverse button order in mobile (primary on top)
   * @default true
   */
  reverseMobileOrder?: boolean;
}

/**
 * Alignment classes for desktop layout
 */
const alignmentClasses: Record<string, string> = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
};

/**
 * ResponsiveFormActions - A form actions container that adapts to different screen sizes
 * 
 * Features:
 * - Stacks buttons vertically in mobile with primary button on top
 * - Maintains horizontal layout in desktop
 * - Responsive spacing and button sizing
 * - Touch-friendly button heights in mobile (44px minimum)
 * 
 * @example
 * ```tsx
 * <ResponsiveFormActions>
 *   <Button variant="outline">Cancel</Button>
 *   <Button type="submit">Save</Button>
 * </ResponsiveFormActions>
 * ```
 * 
 * Requirements: 4.3
 */
export function ResponsiveFormActions({
  children,
  className,
  align = 'end',
  reverseMobileOrder = true,
  ...props
}: ResponsiveFormActionsProps): JSX.Element {
  const { isMobile } = useBreakpoint();

  // Convert children to array for manipulation
  const childArray = React.Children.toArray(children);
  
  // In mobile, reverse order so primary button (usually last) appears on top
  const orderedChildren = isMobile && reverseMobileOrder 
    ? [...childArray].reverse() 
    : childArray;

  return (
    <div
      className={cn(
        // Base styling
        'w-full',
        // Mobile: vertical stack with full-width buttons
        isMobile && [
          'flex flex-col gap-3',
          // Ensure buttons are full width and have touch target height
          '[&_button]:w-full [&_button]:min-h-[44px]',
        ],
        // Desktop: horizontal layout with alignment
        !isMobile && [
          'flex flex-row gap-3',
          alignmentClasses[align],
        ],
        className
      )}
      {...props}
    >
      {orderedChildren}
    </div>
  );
}

export default ResponsiveFormActions;
