import { NavLink, useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { useMobile } from "@/contexts/MobileProvider";
import { useMobileMenu } from "@/hooks/mobile/useMobileMenu";
import { useMobileMenuItems } from "@/hooks/mobile/useMobileMenuItems";
import { useMobileNavScroll } from "@/hooks/mobile/useMobileNavScroll";
import { useMobileNavColors } from "@/hooks/mobile/useMobileNavColors";
import { MobileNavButton } from "@/components/mobile/MobileNavButton";
import { MobileMoreButton } from "@/components/mobile/MobileMoreButton";
import { 
  LayoutDashboard,
  Package, 
  Building2, 
  FileText, 
  ShoppingCart, 
  BarChart3, 
  Star,
  ClipboardList,
  StickyNote
} from 'lucide-react';


// Menu items com ícones do Lucide React (recomendados)
const menuItems = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard
}, {
  title: "Produtos",
  url: "/dashboard/produtos",
  icon: Package
}, {
  title: "Fornecedores",
  url: "/dashboard/fornecedores",
  icon: Building2
}, {
  title: "Cotações",
  url: "/dashboard/cotacoes",
  icon: FileText
}, {
  title: "Pedidos",
  url: "/dashboard/pedidos",
  icon: ShoppingCart
}, {
  title: "Contagem de Estoque",
  url: "/dashboard/contagem-estoque",
  icon: ClipboardList
}, {
  title: "Anotações",
  url: "/dashboard/anotacoes",
  icon: StickyNote
}, {
  title: "Relatórios",
  url: "/dashboard/relatorios",
  icon: BarChart3
}, {
  title: "Extra",
  url: "/dashboard/extra",
  icon: Star
}];



export function AppSidebar() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const isMobile = useMobile();
  const isDark = theme === 'dark';
  
  // Hooks dedicados para menu mobile
  const {
    isActive,
    profileDialogOpen,
    handleProfileDialogOpen,
    handleNavigateAndClose,
  } = useMobileMenu();
  
  const { visibleMenuItems, primaryMobileItems, remainingMobileItems } = useMobileMenuItems(
    menuItems,
    isMobile
  );
  
  useMobileNavScroll();
  
  const colors = useMobileNavColors();
  
  // Handler para navegação
  const handleNavigate = (path: string) => {
    navigate(path);
  };
  return <>
      {/* Desktop Sidebar - Premium Final */}
      <div className="hidden md:flex fixed z-50 w-20 left-1 top-1 bottom-1">
        {/* Container Principal com Profundidade */}
        <div className="w-full flex flex-col bg-white dark:bg-[#1C1F26] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-gray-300/80 dark:border-gray-600/50">
          
          {/* Header com Avatar do Usuário - Nível 1 */}
          <div className="flex items-center justify-center h-20 px-4 border-b border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-b from-gray-50/50 to-white dark:from-transparent dark:to-transparent">
            <UserAvatar
              user={user}
              profile={profile}
              size="md"
              showStatus
              clickable
              onClick={() => handleProfileDialogOpen(true)}
            />
          </div>

          {/* Menu Items - Nível 2 com Hierarquia */}
          <div className="flex-1 flex flex-col justify-start py-4 px-3 space-y-2 overflow-y-auto scrollbar-hide">
            <TooltipProvider delayDuration={200}>
              {visibleMenuItems.map((item, index) => {
                const isItemActive = isActive(item.url);
                const itemColor = colors[index] || colors[0];
                
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/dashboard"}
                        className={cn(
                          "relative flex items-center justify-center h-12 rounded-xl transition-[background-color,box-shadow] duration-300 group",
                          isItemActive 
                            ? `bg-gradient-to-br ${itemColor.bg}`
                            : "bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                        )}
                        style={isItemActive ? {
                          boxShadow: isDark 
                            ? `0 6px 20px ${itemColor.shadowColor}` 
                            : `0 4px 16px ${itemColor.shadowColor}, 0 2px 8px ${itemColor.shadowColor}`
                        } : undefined}
                      >
                        <item.icon 
                          className={cn(
                            "w-[22px] h-[22px] transition-colors duration-300",
                            isItemActive 
                              ? "text-white" 
                              : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                          )} 
                        />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      sideOffset={20} 
                      className="font-semibold text-sm px-3.5 py-2 rounded-xl bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] dark:shadow-[0_10px_30px_rgba(15,23,42,0.35)] border border-white/60 dark:border-gray-700/70 backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                        <span className="tracking-wide uppercase text-xs font-bold text-gray-500 dark:text-gray-400">{index + 1}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Premium */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1C1F26]/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-700/40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] rounded-t-3xl">

        <div className="flex items-center justify-around px-2 py-3 relative">
          {/* Botões principais personalizados */}
          {primaryMobileItems.map((item, index) => {
            const itemActive = isActive(item.url);
            const itemColor = colors[index % colors.length];
            const isDashboard = item.url === "/dashboard";
            
            return (
              <MobileNavButton
                key={item.title}
                item={item}
                index={index}
                isActive={itemActive}
                color={itemColor}
                isDashboard={isDashboard}
              />
            );
          })}

          {/* Botão Mais */}
          <MobileMoreButton
            remainingItems={remainingMobileItems}
            onProfileClick={() => handleProfileDialogOpen(true)}
            onNavigate={handleNavigate}
            isActive={isActive}
          />
        </div>
      </div>

      {/* Dialog de Perfil */}
      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={handleProfileDialogOpen}
      />
    </>;
}