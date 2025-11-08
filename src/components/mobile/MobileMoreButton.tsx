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
            className="mobile-nav-button flex flex-col items-center justify-center transition-all duration-200 rounded-2xl group relative overflow-hidden backdrop-blur-sm h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] text-gray-500 hover:text-gray-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/90 hover:shadow-lg touch-manipulation active:bg-gray-200"
            aria-label="Mais opções"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full opacity-0 group-hover:opacity-100" />
            <div className="flex items-center justify-center mb-1 relative z-10 transition-all duration-300 w-7 h-7 rounded-xl group-hover:bg-white/60 group-hover:shadow-md">
              <MoreHorizontal className="w-4 h-4 transition-all duration-200 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
            </div>
            <span className="text-[9px] font-bold text-center leading-tight transition-all duration-300 truncate max-w-[65px] relative z-10 tracking-wide text-gray-600 group-hover:text-gray-800 group-hover:font-extrabold">
              Mais
            </span>
          </button>
        </DialogTrigger>

        <DialogContent className="w-[90vw] max-w-sm p-0 border-0 shadow-2xl rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
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

          <div className="p-3 space-y-4 bg-white/95 dark:bg-gray-900/95">
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
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 border border-blue-200/60 dark:border-blue-700/40 transition-all duration-200 shadow-sm hover:shadow-md"
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
                          "flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden hover:scale-[1.02] active:scale-95",
                          itemActive
                            ? `bg-gradient-to-br ${itemColor.bg} shadow-md text-white ring-2 ring-white/20 dark:ring-white/10`
                            : "bg-white/85 dark:bg-gray-800/85 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300 dark:hover:border-blue-500"
                        )}
                      >
                        <div
                          className={cn(
                            "w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200",
                            itemActive
                              ? "bg-white/20 backdrop-blur-sm"
                              : `bg-gradient-to-br ${itemColor.bg} group-hover:scale-105`
                          )}
                        >
                          <ItemIcon className="w-[18px] h-[18px] transition-all duration-200 text-white" />
                        </div>
                        <div
                          className={cn(
                            "text-xs font-semibold transition-all duration-200 text-center",
                            itemActive
                              ? "text-white"
                              : "text-gray-900 dark:text-gray-200 group-hover:text-blue-900 dark:group-hover:text-blue-300"
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
                  className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/85 dark:bg-gray-800/85 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200"
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

