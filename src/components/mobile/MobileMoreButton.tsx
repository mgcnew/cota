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
            className={cn(
              // Layout
              "flex flex-col items-center justify-center gap-1",
              "relative flex-1 min-w-0 h-16 px-2",
              
              // Touch optimization
              "touch-manipulation select-none",
              
              // Transições otimizadas
              "transition-[opacity,transform] duration-75 ease-out",
              
              // Active state
              "active:scale-95 active:opacity-70"
            )}
            aria-label="Mais opções"
          >
            <div className="relative">
              <MoreHorizontal className="w-6 h-6 text-gray-500 dark:text-gray-400" strokeWidth={2} />
            </div>
            <span className="text-[10px] font-semibold text-center leading-tight truncate max-w-full text-gray-600 dark:text-gray-400">
              Mais
            </span>
          </button>
        </DialogTrigger>

        <DialogContent className="w-[90vw] max-w-sm p-0 border shadow-lg rounded-2xl bg-white dark:bg-gray-900">
          <DialogHeader className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <MoreHorizontal className="w-5 h-5 text-white" />
              </div>
              <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                Mais Opções
              </DialogTitle>
            </div>
          </DialogHeader>

          <div className="p-4 space-y-4 bg-white dark:bg-gray-900">
            {/* Seção Perfil */}
            <div className="mb-4">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Perfil
              </h3>
              <button
                onClick={() => {
                  setOpen(false);
                  onProfileClick();
                }}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 active:opacity-70 border border-gray-200 dark:border-gray-700 transition-opacity duration-75"
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
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Navegação
              </h3>
                <div className="grid grid-cols-2 gap-3">
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
                          "flex flex-col items-center gap-2 p-3 rounded-xl transition-[opacity,transform] duration-75 active:scale-95 active:opacity-70",
                          itemActive
                            ? "bg-primary text-white shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                        )}
                      >
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={!itemActive ? {
                            background: `linear-gradient(135deg, ${itemColor.from}, ${itemColor.to})`
                          } : { background: 'rgba(255,255,255,0.2)' }}
                        >
                          <ItemIcon className="w-5 h-5 text-white" />
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-semibold text-center",
                            itemActive
                              ? "text-white"
                              : "text-gray-900 dark:text-gray-200"
                          )}
                        >
                          {item.title}
                        </span>
                      </NavLink>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seção Configurações */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Sistema
              </h3>
              <div className="space-y-2">
                <button
                  onClick={() => handleItemClick('/dashboard/configuracoes')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 active:opacity-70 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-opacity duration-75"
                >
                  <div className="w-10 h-10 rounded-lg bg-gray-600 dark:bg-gray-700 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-sm text-gray-900 dark:text-white">Configurações</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Preferências do app</div>
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

