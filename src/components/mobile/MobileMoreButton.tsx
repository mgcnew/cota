import { memo, useRef, useCallback, useEffect } from "react";
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
 * Botão "Mais" do menu mobile OTIMIZADO
 * 
 * Estrutura Simplificada:
 * - Perfil (1 item)
 * - Navegação (2 itens): Fornecedores, Lista de Compras
 * - Sistema (1 item): Configurações
 * 
 * Total: 4 itens (rápido e eficiente)
 * Componente memoizado para evitar re-renders
 * 
 * CORREÇÕES IMPLEMENTADAS:
 * - Dialog gerencia seu próprio estado (sem useState conflitante)
 * - useRef para gerenciar timeouts com cleanup
 * - Sem closure incorreta em setTimeout
 * - Classe específica para CSS (mobile-more-dialog)
 */
export const MobileMoreButton = memo<MobileMoreButtonProps>(
  function MobileMoreButton({ remainingItems, onProfileClick, onNavigate, isActive }) {
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const { user } = useAuth();
    const { profile } = useUserProfile();
    const colors = useMobileNavColors();

    // Limpar timeout ao desmontar
    useEffect(() => {
      return () => {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };
    }, []);

    // Handler otimizado: fecha dialog e aguarda animação antes de navegar
    const handleItemClick = useCallback((path: string) => {
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Aguardar animação do dialog (75ms) antes de navegar
      timeoutRef.current = setTimeout(() => {
        onNavigate(path);
      }, 100);
    }, [onNavigate]);

    // Handler para perfil
    const handleProfileClick = useCallback(() => {
      // Limpar timeout anterior se existir
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        onProfileClick();
      }, 100);
    }, [onProfileClick]);

    return (
      <Dialog>
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

        <DialogContent className="mobile-more-dialog w-[90vw] max-w-sm p-0 border shadow-lg rounded-2xl bg-white dark:bg-gray-900">
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

          <div className="p-4 space-y-3 bg-white dark:bg-gray-900">
            {/* Seção Perfil - Compacta */}
            <div>
              <button
                onClick={handleProfileClick}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 active:opacity-70 border border-primary/20 dark:border-primary/30 transition-opacity duration-75 touch-manipulation"
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

            {/* Seção Navegação - Grid Compacto */}
            {remainingItems.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                  Navegação
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {remainingItems.map((item, index) => {
                    const itemActive = isActive(item.url);
                    const itemColor = colors[(index + 4) % colors.length];
                    const ItemIcon = item.icon;
                    
                    return (
                      <button
                        key={item.title}
                        onClick={() => handleItemClick(item.url)}
                        className={cn(
                          "flex flex-col items-center gap-2 p-3 rounded-xl transition-[opacity,transform] duration-75 active:scale-95 active:opacity-70 touch-manipulation",
                          itemActive
                            ? "bg-primary text-white shadow-sm"
                            : "bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                        )}
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-lg flex items-center justify-center",
                            itemActive ? "bg-white/20" : ""
                          )}
                          style={!itemActive ? {
                            backgroundColor: itemColor.from
                          } : undefined}
                        >
                          <ItemIcon className="w-5 h-5 text-white" />
                        </div>
                        <span
                          className={cn(
                            "text-[11px] font-semibold text-center leading-tight",
                            itemActive
                              ? "text-white"
                              : "text-gray-900 dark:text-gray-200"
                          )}
                        >
                          {item.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Seção Sistema - Compacta */}
            <div>
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                Sistema
              </h3>
              <button
                onClick={() => handleItemClick('/dashboard/configuracoes')}
                className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 active:opacity-70 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 transition-opacity duration-75 touch-manipulation"
              >
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-sm">
                  <Settings className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-sm text-gray-900 dark:text-white">Configurações</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Preferências</div>
                </div>
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);

