import * as React from "react";
import { cn } from "@/lib/utils";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { Label } from "@/components/ui/label";

export interface ResponsiveFormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Label text for the form field
   */
  label?: string;
  /**
   * Whether the field is required
   */
  required?: boolean;
  /**
   * Error message to display
   */
  error?: string;
  /**
   * Helper text to display below the input
   */
  helperText?: string;
  /**
   * HTML id for the input element (used for label association)
   */
  htmlFor?: string;
  /**
   * Form field content (input, select, etc.)
   */
  children: React.ReactNode;
  /**
   * Additional CSS class name
   */
  className?: string;
  /**
   * Layout direction - auto will stack vertically on mobile
   * @default 'auto'
   */
  layout?: 'auto' | 'vertical' | 'horizontal';
}

/**
 * ResponsiveFormField - A form field wrapper that adapts to different screen sizes
 * 
 * Features:
 * - Stacks fields vertically in mobile (full width)
 * - Applies minimum height of 44px for inputs (touch target)
 * - Responsive spacing and typography
 * - Error and helper text support
 * 
 * @example
 * ```tsx
 * <ResponsiveFormField label="Email" required error={errors.email}>
 *   <Input type="email" placeholder="Enter email" />
 * </ResponsiveFormField>
 * ```
 * 
 * Requirements: 4.1, 4.2
 */
export function ResponsiveFormField({
  label,
  required,
  error,
  helperText,
  htmlFor,
  children,
  className,
  layout = 'auto',
  ...props
}: ResponsiveFormFieldProps): JSX.Element {
  const { isMobile } = useBreakpoint();
  const id = React.useId();
  const fieldId = htmlFor || id;

  // Determine if layout should be vertical
  const isVertical = layout === 'vertical' || (layout === 'auto' && isMobile);

  return (
    <div
      className={cn(
        // Base styling
        'w-full',
        // Layout direction
        isVertical ? 'flex flex-col space-y-2' : 'flex flex-row items-center gap-4',
        // Mobile-specific: full width stacking
        isMobile && 'space-y-2',
        className
      )}
      {...props}
    >
      {label && (
        <Label
          htmlFor={fieldId}
          className={cn(
            // Base label styling
            'text-sm font-medium',
            // Mobile: minimum 12px font size
            isMobile ? 'text-xs min-h-[12px]' : 'text-sm',
            // Horizontal layout: fixed width for alignment
            !isVertical && 'w-32 shrink-0',
            // Error state
            error && 'text-destructive'
          )}
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
      )}
      
      <div className={cn('flex-1 w-full', isVertical && 'w-full')}>
        {/* Wrap children to apply touch target styling */}
        <div
          className={cn(
            // Mobile: ensure minimum touch target height of 44px
            isMobile && '[&_input]:min-h-[44px] [&_select]:min-h-[44px] [&_textarea]:min-h-[44px] [&_button]:min-h-[44px]',
            // Full width inputs
            '[&_input]:w-full [&_select]:w-full [&_textarea]:w-full'
          )}
        >
          {children}
        </div>
        
        {/* Helper text */}
        {helperText && !error && (
          <p className={cn(
            'text-muted-foreground mt-1',
            isMobile ? 'text-xs' : 'text-sm'
          )}>
            {helperText}
          </p>
        )}
        
        {/* Error message */}
        {error && (
          <p className={cn(
            'text-destructive font-medium mt-1',
            isMobile ? 'text-xs' : 'text-sm'
          )}>
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

export default ResponsiveFormField;
