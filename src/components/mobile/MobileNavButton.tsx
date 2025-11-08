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
      ? (isDashboard ? 'translateY(-4px) scale(1.07)' : 'translateY(-2px) scale(1.05)')
      : (isDashboard ? 'translateY(-4px)' : 'none');
    const iconSizeClass = isDashboard ? "w-8 h-8" : "w-7 h-7";

    return (
      <NavLink
        key={item.title}
        to={item.url}
        end={item.url === "/dashboard"}
        className="mobile-nav-button flex flex-col items-center justify-center transition-all duration-200 rounded-2xl group relative overflow-hidden backdrop-blur-sm h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] touch-manipulation active:bg-gray-200"
        style={{
          background,
          boxShadow,
          transform,
        }}
        aria-label={item.title}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full opacity-0 group-hover:opacity-100" />

        <div
          className={cn(
            "flex items-center justify-center mb-1 relative z-10 transition-all duration-300 rounded-xl",
            iconSizeClass,
            isActive
              ? "bg-white/20 backdrop-blur-sm shadow-inner"
              : "group-hover:bg-white/60 group-hover:shadow-md"
          )}
        >
          <ItemIcon
            className={cn(
              "w-4 h-4 transition-all duration-200 flex-shrink-0",
              isActive
                ? "text-white drop-shadow-md"
                : "text-gray-500 group-hover:text-gray-700"
            )}
          />
        </div>

        <span
          className={cn(
            "text-[9px] font-bold text-center leading-tight transition-all duration-300 truncate max-w-[65px] relative z-10 tracking-wide",
            isActive
              ? "text-white drop-shadow-md"
              : "text-gray-600 group-hover:text-gray-800 group-hover:font-extrabold"
          )}
        >
          {item.title}
        </span>
      </NavLink>
    );
  }
);

