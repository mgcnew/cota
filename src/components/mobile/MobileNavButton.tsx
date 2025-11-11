import { memo } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface MobileNavButtonProps {
  item: {
    title: string;
    url: string;
    icon: LucideIcon;
  };
  isActive: boolean;
  primaryColor: string;
}

/**
 * Botão de navegação mobile - Redesign otimizado
 * 
 * Princípios:
 * - Flat design (sem gradientes)
 * - Apenas opacity e transform (GPU accelerated)
 * - Feedback imediato (< 50ms)
 * - Touch optimized (44px mínimo)
 * - Zero hover effects
 */
export const MobileNavButton = memo<MobileNavButtonProps>(
  function MobileNavButton({ item, isActive, primaryColor }) {
    const ItemIcon = item.icon;

    return (
      <NavLink
        to={item.url}
        end={item.url === "/dashboard"}
        className={cn(
          // Layout e estrutura
          "flex flex-col items-center justify-center gap-1",
          "relative flex-1 min-w-0 h-16 px-2",
          
          // Touch optimization
          "touch-manipulation select-none",
          
          // Transições otimizadas (apenas opacity e transform)
          "transition-[opacity,transform] duration-75 ease-out",
          
          // Active state (feedback imediato)
          "active:scale-95 active:opacity-70",
          
          // Estados visuais
          isActive
            ? "" // Sem classes extras quando ativo
            : "opacity-100"
        )}
        style={{
          // Usar CSS inline para cores dinâmicas (melhor performance que classes)
          WebkitTapHighlightColor: 'transparent',
        }}
        aria-label={item.title}
        aria-current={isActive ? "page" : undefined}
      >
        {/* Indicador superior quando ativo */}
        {isActive && (
          <div 
            className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 rounded-full"
            style={{ backgroundColor: primaryColor }}
          />
        )}

        {/* Ícone */}
        <div className="relative">
          <ItemIcon
            className={cn(
              "w-6 h-6 transition-colors duration-75",
              isActive
                ? "text-current"
                : "text-gray-500 dark:text-gray-400"
            )}
            style={isActive ? { color: primaryColor } : undefined}
            strokeWidth={isActive ? 2.5 : 2}
          />
        </div>

        {/* Label */}
        <span
          className={cn(
            "text-[10px] font-semibold text-center leading-tight truncate max-w-full",
            "transition-colors duration-75",
            isActive
              ? "text-current"
              : "text-gray-600 dark:text-gray-400"
          )}
          style={isActive ? { color: primaryColor } : undefined}
        >
          {item.title}
        </span>
      </NavLink>
    );
  }
);

