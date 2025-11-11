import { memo, useState } from "react";
import { NavLink } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MoreHorizontal, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { useMobileNavColors } from "@/hooks/mobile/useMobileNavColors";
import type { MenuItem } from "@/hooks/mobile/useMobileMenuItems";

interface MobileMoreButtonProps {
  remainingItems: MenuItem[];
  onProfileClick: () => void;
  onNavigate: (path: string) => void;
  isActive: (path: string) => boolean;
}

/**
 * Botão "Mais" do menu mobile
 * Componente memoizado para evitar re-renders desnecessários
 */
export const MobileMoreButton = memo<MobileMoreButtonProps>(
  function MobileMoreButton({ remainingItems, onProfileClick, onNavigate, isActive }) {
    const [open, setOpen] = useState(false);
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const colors = useMobileNavColors();

    const handleItemClick = (path: string) => {
      setOpen(false);
      onNavigate(path);
    };

    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <button 
            className="mobile-nav-button flex flex-col items-center justify-center transition-[transform,opacity] duration-150 rounded-2xl group relative overflow-hidden h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] text-gray-500 touch-manipulation active:scale-95"
            aria-label="Mais opções"
          >
            {/* Shimmer effect removido para melhor performance em mobile */}
            <div className="flex items-center justify-center mb-1 relative z-10 w-7 h-7 rounded-xl">
              <MoreHorizontal className="w-4 h-4 flex-shrink-0 text-gray-500" />
            </div>
            <span className="text-[9px] font-bold text-center leading-tight truncate max-w-[65px] relative z-10 tracking-wide text-gray-600">
              Mais
            </span>
          </button>
        </DialogTrigger>

        <DialogContent className="w-[90vw] max-w-sm p-0 border-0 shadow-2xl rounded-2xl bg-white dark:bg-gray-900">
          <DialogHeader className="px-3 py-2.5 border-b border-gray-100/60 dark:border-gray-700/60 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/40 dark:to-purple-900/40">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
                <MoreHorizontal className="w-4 h-4 text-white" />
              </div>
              <DialogTitle className="text-lg font-bold bg-gradient-to-r from-blue-900 to-purple-800 dark:from-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
                Mais Opções
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-3 space-y-4 bg-white dark:bg-gray-900">
            {/* Seção Perfil */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-3 px-1">
                Perfil
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  onProfileClick();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 active:opacity-80 border border-blue-200/60 dark:border-blue-700/40 transition-opacity duration-150 shadow-sm"
              >
                <UserAvatar user={user} profile={profile} size="md" />
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">
                    {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
                </div>
              </button>
            </div>

            {/* Seção Principal - Navegação */}
            {remainingItems.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-3 px-1">
                  Navegação
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {remainingItems.map((item, index) => {
                    const itemActive = isActive(item.url);
                    const itemColor = colors[(index + 4) % colors.length];
                    const ItemIcon = item.icon;
                    
                    return (
                      <NavLink
                        key={item.title}
                        to={item.url}
                        end={item.url === "/dashboard"}
                        onClick={() => handleItemClick(item.url)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-2.5 rounded-xl transition-[opacity,transform] duration-150 group relative overflow-hidden active:scale-95",
                          itemActive
                            ? `bg-gradient-to-br ${itemColor.bg} shadow-md text-white ring-2 ring-white/20 dark:ring-white/10`
                            : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200/60 dark:border-gray-700/60"
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center",
                            itemActive
                              ? "bg-white/20"
                              : `bg-gradient-to-br ${itemColor.bg}`
                          )}
                        >
                          <ItemIcon className="w-[18px] h-[18px] text-white" />
                        </div>
                        <div
                          className={cn(
                            "text-xs font-semibold text-center",
                            itemActive
                              ? "text-white"
                              : "text-gray-900 dark:text-gray-200"
                          )}
                        >
                          {item.title}
                        </div>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seção Configurações */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
                Sistema
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleItemClick('/dashboard/configuracoes')}
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white dark:bg-gray-800 active:opacity-80 text-gray-700 dark:text-gray-300 border border-gray-200/60 dark:border-gray-700/60 transition-opacity duration-150"
                >
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-sm">
                    <Settings className="w-[18px] h-[18px] text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-medium text-sm text-gray-900 dark:text-white">Configurações</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Ajustes do sistema</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

