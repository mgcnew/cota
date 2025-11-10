import { Button } from "@/components/ui/button";
import { forwardRef } from "react";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFABProps {
  onClick?: () => void;
  label?: string;
  icon?: React.ReactNode;
  className?: string;
}

/**
 * Floating Action Button otimizado para mobile
 * Aparece apenas em dispositivos móveis
 */
export const MobileFAB = forwardRef<HTMLButtonElement, MobileFABProps>(
  function MobileFAB({ onClick, label = "Adicionar", icon, className }, ref) {
    return (
      <div className="fixed bottom-20 right-4 z-50 md:hidden">
        <Button
          ref={ref}
          onClick={onClick}
          className={cn(
            "fixed bottom-20 right-6 h-14 w-14 rounded-full shadow-lg z-40",
            "bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800",
            "text-white",
            "flex items-center justify-center",
            "transition-all duration-200 hover:scale-110 active:scale-95",
            className
          )}
          aria-label={label}
        >
          {icon || <Plus className="h-6 w-6" />}
        </Button>
      </div>
    );
  }
);

