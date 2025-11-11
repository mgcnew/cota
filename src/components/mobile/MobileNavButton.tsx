import { memo } from "react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { NavColor } from "@/hooks/mobile/useMobileNavColors";

interface MobileNavButtonProps {
  item: {
    title: string;
    url: string;
    icon: LucideIcon;
  };
  index: number;
  isActive: boolean;
  color: NavColor;
  isDashboard?: boolean;
}

/**
 * Botão de navegação mobile
 * Componente memoizado para evitar re-renders desnecessários
 */
export const MobileNavButton = memo<MobileNavButtonProps>(
  function MobileNavButton({ item, index, isActive, color, isDashboard = false }) {
    const ItemIcon = item.icon;
    const background = isActive ? `linear-gradient(135deg, ${color.from}, ${color.to})` : 'transparent';
    const boxShadow = isActive ? `0 8px 25px -5px ${color.shadow}, 0 4px 10px -3px ${color.shadow}` : 'none';
    const transform = isActive
      ? (isDashboard ? 'translateY(-4px)' : 'translateY(-2px)')
      : (isDashboard ? 'translateY(-4px)' : 'none');
    const iconSizeClass = isDashboard ? "w-8 h-8" : "w-7 h-7";

    return (
      <NavLink
        key={item.title}
        to={item.url}
        end={item.url === "/dashboard"}
        className="mobile-nav-button flex flex-col items-center justify-center transition-[transform,opacity,background-color] duration-150 rounded-2xl group relative overflow-hidden h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] touch-manipulation active:scale-95"
        style={{
          background,
          boxShadow,
          transform,
        }}
        aria-label={item.title}
      >
        {/* Shimmer effect removido para melhor performance em mobile */}

        <div
          className={cn(
            "flex items-center justify-center mb-1 relative z-10 transition-[background-color] duration-150 rounded-xl",
            iconSizeClass,
            isActive
              ? "bg-white/20 shadow-inner"
              : ""
          )}
        >
          <ItemIcon
            className={cn(
              "w-4 h-4 transition-colors duration-150 flex-shrink-0",
              isActive
                ? "text-white drop-shadow-md"
                : "text-gray-500"
            )}
          />
        </div>

        <span
          className={cn(
            "text-[9px] font-bold text-center leading-tight transition-colors duration-150 truncate max-w-[65px] relative z-10 tracking-wide",
            isActive
              ? "text-white drop-shadow-md"
              : "text-gray-600"
          )}
        >
          {item.title}
        </span>
      </NavLink>
    );
  }
);

