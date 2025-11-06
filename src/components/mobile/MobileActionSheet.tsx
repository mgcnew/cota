import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

interface MobileActionSheetProps {
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Action Sheet otimizado para mobile
 * Bottom sheet para ações rápidas
 */
export function MobileActionSheet({
  trigger,
  title,
  description,
  children,
  open,
  onOpenChange,
}: MobileActionSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl pb-8">
        <SheetHeader>
          <SheetTitle>{title}</SheetTitle>
          {description && <SheetDescription>{description}</SheetDescription>}
        </SheetHeader>
        <div className="mt-6 overflow-y-auto h-full pb-8">{children}</div>
      </SheetContent>
    </Sheet>
  );
}

