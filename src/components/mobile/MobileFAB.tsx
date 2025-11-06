import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface MobileFABProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

/**
 * Floating Action Button otimizado para mobile
 * Aparece apenas em dispositivos móveis
 */
export function MobileFAB({ onClick, label, className }: MobileFABProps) {
  return (
    <div className="fixed bottom-20 right-4 z-50 md:hidden">
      <Button
        onClick={onClick}
        size="lg"
        className={cn(
          "h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-200",
          "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700",
          "text-white border-0",
          className
        )}
      >
        <Plus className="h-6 w-6" />
      </Button>
      {label && (
        <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          {label}
        </div>
      )}
    </div>
  );
}

