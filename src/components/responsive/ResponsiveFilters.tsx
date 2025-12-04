import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Filter, X, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

export interface ResponsiveFiltersProps {
  /**
   * Filter content to render
   */
  children: React.ReactNode;
  /**
   * Title for the filter drawer (mobile)
   */
  title?: string;
  /**
   * Description for the filter drawer (mobile)
   */
  description?: string;
  /**
   * Number of active filters (for badge display)
   */
  activeFiltersCount?: number;
  /**
   * Callback when filters are applied (mobile drawer)
   */
  onApply?: () => void;
  /**
   * Callback when filters are reset
   */
  onReset?: () => void;
  /**
   * Custom trigger button text
   */
  triggerText?: string;
  /**
   * Additional class name for the container
   */
  className?: string;
  /**
   * Additional class name for the trigger button
   */
  triggerClassName?: string;
  /**
   * Whether to show the reset button in the drawer footer
   */
  showReset?: boolean;
  /**
   * Custom apply button text
   */
  applyText?: string;
  /**
   * Custom reset button text
   */
  resetText?: string;
}

/**
 * ResponsiveFilters - A filter component that shows inline on desktop and collapses to a drawer on mobile.
 * 
 * Features:
 * - Shows filter content inline on desktop (width >= 768px)
 * - Collapses to a button that opens a drawer on mobile (width < 768px)
 * - Shows badge with active filter count
 * - Includes apply and reset buttons in mobile drawer
 * 
 * @example
 * ```tsx
 * <ResponsiveFilters
 *   title="Filtros"
 *   activeFiltersCount={2}
 *   onApply={() => console.log('Applied')}
 *   onReset={() => console.log('Reset')}
 * >
 *   <CategorySelect ... />
 *   <DateRangePicker ... />
 * </ResponsiveFilters>
 * ```
 * 
 * Requirements: 9.4
 */
export function ResponsiveFilters({
  children,
  title = "Filtros",
  description,
  activeFiltersCount = 0,
  onApply,
  onReset,
  triggerText = "Filtros",
  className,
  triggerClassName,
  showReset = true,
  applyText = "Aplicar filtros",
  resetText = "Limpar",
}: ResponsiveFiltersProps): JSX.Element {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = React.useState(false);

  const hasActiveFilters = activeFiltersCount > 0;

  const handleApply = React.useCallback(() => {
    onApply?.();
    setIsOpen(false);
  }, [onApply]);

  const handleReset = React.useCallback(() => {
    onReset?.();
  }, [onReset]);

  // Desktop: Render filters inline
  if (!isMobile) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        {children}
      </div>
    );
  }

  // Mobile: Render as button + drawer
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn(
          "h-10 min-h-[44px] min-w-[44px] touch-target gap-2",
          hasActiveFilters && "border-primary/50 bg-primary/5",
          triggerClassName
        )}
      >
        <Filter className="h-4 w-4" />
        <span>{triggerText}</span>
        {hasActiveFilters && (
          <Badge 
            variant="secondary" 
            className="ml-1 h-5 min-w-[20px] px-1.5 bg-primary text-primary-foreground text-xs"
          >
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[85vh] overflow-hidden flex flex-col">
          <DrawerHeader className="text-left border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <DrawerTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  {title}
                </DrawerTitle>
                {description && (
                  <DrawerDescription className="mt-1">
                    {description}
                  </DrawerDescription>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DrawerHeader>

          {/* Scrollable filter content */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-4">
              {children}
            </div>
          </div>

          <DrawerFooter className="border-t pt-4">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-muted-foreground">
                {hasActiveFilters ? (
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} ativo{activeFiltersCount > 1 ? 's' : ''}
                  </span>
                ) : (
                  <span>Nenhum filtro ativo</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {showReset && hasActiveFilters && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleReset}
                    className="h-10 min-h-[44px]"
                  >
                    {resetText}
                  </Button>
                )}
                <Button
                  onClick={handleApply}
                  size="sm"
                  className="h-10 min-h-[44px] bg-gradient-to-r from-primary to-primary/80"
                >
                  {applyText}
                </Button>
              </div>
            </div>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}

export default ResponsiveFilters;
