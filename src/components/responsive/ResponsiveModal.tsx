import * as React from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface ResponsiveModalProps {
  /**
   * Controls whether the modal is open
   */
  open: boolean;
  /**
   * Callback when the open state changes
   */
  onOpenChange: (open: boolean) => void;
  /**
   * Modal title
   */
  title: string;
  /**
   * Optional modal description
   */
  description?: string;
  /**
   * Modal content
   */
  children: React.ReactNode;
  /**
   * Footer content (buttons, actions)
   */
  footer?: React.ReactNode;
  /**
   * Whether to use full height in mobile (default: false)
   */
  mobileFullHeight?: boolean;
  /**
   * Maximum width for desktop dialog
   */
  desktopMaxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  /**
   * Whether to show drag indicator on mobile drawer (default: true)
   */
  showDragIndicator?: boolean;
  /**
   * Additional class name for the content container
   */
  className?: string;
  /**
   * Whether to hide the default close button
   */
  hideClose?: boolean;
}

const maxWidthClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
} as const;

/**
 * ResponsiveModal - A modal component that renders as Drawer on mobile and Dialog on desktop/tablet.
 * 
 * Features:
 * - Renders Drawer (bottom sheet) on mobile (width < 768px)
 * - Renders Dialog (centered modal) on desktop/tablet (width >= 768px)
 * - Applies max-height of 85vh on mobile to avoid status bar overlap
 * - Includes drag indicator on mobile Drawer
 * - Supports internal scroll for extensive content
 * - GPU-accelerated animations for smooth performance
 * 
 * @example
 * ```tsx
 * <ResponsiveModal
 *   open={isOpen}
 *   onOpenChange={setIsOpen}
 *   title="Edit Item"
 *   description="Make changes to your item"
 *   footer={<Button onClick={handleSave}>Save</Button>}
 * >
 *   <form>...</form>
 * </ResponsiveModal>
 * ```
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */
export function ResponsiveModal({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  mobileFullHeight = false,
  desktopMaxWidth = 'lg',
  showDragIndicator = true,
  className,
  hideClose = false,
}: ResponsiveModalProps): JSX.Element {
  const isMobile = useIsMobile();

  // Mobile: Render as Drawer (bottom sheet)
  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className={cn(
            // Max height of 85vh to avoid status bar overlap (Requirement 1.3)
            mobileFullHeight ? "max-h-[85vh]" : "max-h-[85vh]",
            "overflow-hidden flex flex-col will-change-transform",
            className
          )}
        >
          {!hideClose && (
            <div className="absolute right-4 top-4 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
          )}
          
          <DrawerHeader className="text-left flex-shrink-0 pr-12">
            <DrawerTitle>{title}</DrawerTitle>
            {description && (
              <DrawerDescription>{description}</DrawerDescription>
            )}
          </DrawerHeader>
          
          {/* Scrollable content area (Requirement 1.4) */}
          <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-6" style={{ WebkitOverflowScrolling: 'touch' }}>
            {children}
          </div>
          
          {footer && (
            <DrawerFooter className="pt-2 flex-shrink-0 border-t border-border">
              {footer}
            </DrawerFooter>
          )}
        </DrawerContent>
      </Drawer>
    );
  }

  // Desktop/Tablet: Render as Dialog (centered modal)
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideClose={hideClose}
        className={cn(
          maxWidthClasses[desktopMaxWidth],
          className
        )}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="overflow-y-auto overscroll-contain max-h-[70vh] pr-2 custom-scrollbar">
          {children}
        </div>
        
        {footer && (
          <DialogFooter>
            {footer}
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default ResponsiveModal;
