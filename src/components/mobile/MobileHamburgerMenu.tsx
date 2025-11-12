import { memo, useState, useCallback, useEffect } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserAvatar } from "@/components/profile/UserAvatar";
import type { MenuItem } from "@/hooks/mobile/useMobileMenuItems";

interface MobileHamburgerMenuProps {
  menuItems: MenuItem[];
  isActive: (path: string) => boolean;
  onProfileClick: () => void;
}

export const MobileHamburgerMenu = memo<MobileHamburgerMenuProps>(
  function MobileHamburgerMenu({ menuItems, isActive, onProfileClick }) {
    const navigate = useNavigate();
    const location = useLocation();
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const [isOpen, setIsOpen] = useState(false);

    // Fechar menu quando a rota mudar
    useEffect(() => {
      setIsOpen(false);
    }, [location.pathname]);

    const handleNavigate = useCallback((path: string) => {
      navigate(path);
      setIsOpen(false);
    }, [navigate]);

    const handleProfileClick = useCallback(() => {
      onProfileClick();
      setIsOpen(false);
    }, [onProfileClick]);

    return (
      <>
        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden fixed top-4 left-4 z-[70] p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
          aria-label="Menu"
        >
          {isOpen ? (
            <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          ) : (
            <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          )}
        </button>

        {/* Overlay */}
        {isOpen && (
          <div
            className="md:hidden fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}

        {/* Menu Drawer */}
        <div
          className={cn(
            "md:hidden fixed left-0 top-0 bottom-0 z-[65] w-64 bg-white dark:bg-gray-900 shadow-lg transition-transform duration-300 ease-out overflow-y-auto",
            isOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          {/* Header com Perfil */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={handleProfileClick}
              className="w-full flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 hover:from-primary/20 hover:to-primary/10 transition-colors"
            >
              <UserAvatar user={user} profile={profile} size="md" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm text-gray-900 dark:text-white">
                  {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">Ver Perfil</div>
              </div>
            </button>
          </div>

          {/* Menu Items */}
          <nav className="p-4 space-y-1">
            {menuItems.map((item) => {
              const itemActive = isActive(item.url);
              const ItemIcon = item.icon;

              return (
                <button
                  key={item.url}
                  onClick={() => handleNavigate(item.url)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left",
                    itemActive
                      ? "bg-primary text-white"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                  )}
                >
                  <ItemIcon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.title}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </>
    );
  }
);
