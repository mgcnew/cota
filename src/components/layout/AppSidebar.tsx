import { NavLink } from "react-router-dom";
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
import { MobileHamburgerMenu } from "@/components/mobile/MobileHamburgerMenu";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Package,
  Building2,
  FileText,
  ShoppingCart,
  BarChart3,
  Star,
  ClipboardList,
  StickyNote,
  ShoppingBasket,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";

// Categorias com seus respectivos itens de menu
interface MenuItem {
  title: string;
  url: string;
  icon: any;
}

interface MenuCategory {
  title: string;
  items: MenuItem[];
}

const menuCategories: MenuCategory[] = [
  {
    title: "Visão Geral",
    items: [{ title: "Dashboard", url: "/dashboard", icon: LayoutDashboard }]
  },
  {
    title: "Cadastros",
    items: [
      { title: "Produtos", url: "/dashboard/produtos", icon: Package },
      { title: "Fornecedores", url: "/dashboard/fornecedores", icon: Building2 }
    ]
  },
  {
    title: "Operações",
    items: [
      { title: "Cotações", url: "/dashboard/cotacoes", icon: FileText },
      { title: "Pedidos", url: "/dashboard/pedidos", icon: ShoppingCart },
      { title: "Lista de Compras", url: "/dashboard/lista-compras", icon: ShoppingBasket }
    ]
  },
  {
    title: "Estoque",
    items: [{ title: "Contagem de Estoque", url: "/dashboard/contagem-estoque", icon: ClipboardList }]
  },
  {
    title: "Ferramentas",
    items: [{ title: "Anotações", url: "/dashboard/anotacoes", icon: StickyNote }]
  },
  {
    title: "Análises",
    items: [{ title: "Relatórios", url: "/dashboard/relatorios", icon: BarChart3 }]
  },
  {
    title: "Outros",
    items: [{ title: "Extra", url: "/dashboard/extra", icon: Star }]
  }
];

const menuItems = menuCategories.flatMap(category => category.items);

export function AppSidebar() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const isMobile = useMobile();
  const isDark = theme === 'dark';

  // State para sidebar expandida/colapsada
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved !== null ? saved === 'true' : true;
  });

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const { isActive, profileDialogOpen, handleProfileDialogOpen } = useMobileMenu();
  const { visibleMenuItems } = useMobileMenuItems(menuItems, isMobile);
  const colors = useMobileNavColors();
  useMobileNavScroll();

  // Salvar preferência e notificar AppLayout
  useEffect(() => {
    localStorage.setItem('sidebarExpanded', String(isSidebarExpanded));
    window.dispatchEvent(new CustomEvent('sidebarToggle', { detail: { expanded: isSidebarExpanded } }));
  }, [isSidebarExpanded]);

  const toggleCategory = (categoryTitle: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryTitle)) {
        newSet.delete(categoryTitle);
      } else {
        newSet.add(categoryTitle);
      }
      return newSet;
    });
  };

  return <>
    {/* Desktop Sidebar */}
    <div className={cn(
      "hidden md:flex fixed z-50 left-1 top-1 bottom-1 transition-all duration-300 ease-in-out",
      isSidebarExpanded ? "w-64" : "w-20"
    )}>
      <div className="w-full flex flex-col bg-white dark:bg-[#1C1F26] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-gray-300/80 dark:border-gray-600/50 overflow-hidden">

        {/* Header */}
        <div className={cn(
          "flex items-center h-20 px-4 border-b border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-b from-gray-50/50 to-white dark:from-transparent dark:to-transparent transition-all duration-300",
          isSidebarExpanded ? "gap-3" : "justify-center"
        )}>
          <UserAvatar
            user={user}
            profile={profile}
            size="md"
            showStatus
            clickable
            onClick={() => handleProfileDialogOpen(true)}
          />
          <div className={cn(
            "flex-1 min-w-0 transition-all duration-300 overflow-hidden",
            isSidebarExpanded ? "opacity-100 w-auto" : "opacity-0 w-0 hidden"
          )}>
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              Membro
            </p>
          </div>
        </div>

        {/* Menu Items */}
        <div className="flex-1 flex flex-col py-3 px-3 space-y-0 overflow-y-auto scrollbar-hide">
          {isSidebarExpanded ? (
            // Versão expandida com categorias
            menuCategories.map((category, categoryIndex) => {
              const isCollapsed = collapsedCategories.has(category.title);
              return (
                <div key={category.title} className={categoryIndex > 0 ? "mt-5" : ""}>
                  <button
                    onClick={() => toggleCategory(category.title)}
                    className="w-full flex items-center justify-between px-3 py-3 text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-pink-600 dark:hover:text-pink-400 transition-colors rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <span className="truncate">{category.title}</span>
                    {isCollapsed ? <ChevronRight className="w-3.5 h-3.5 flex-shrink-0" /> : <ChevronDown className="w-3.5 h-3.5 flex-shrink-0" />}
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-1 mt-1.5 pb-2">
                      {category.items.map((item) => {
                        const isItemActive = isActive(item.url);
                        return (
                          <NavLink
                            key={item.title}
                            to={item.url}
                            end={item.url === "/dashboard"}
                            className={cn(
                              "flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group",
                              isItemActive
                                ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60 hover:translate-x-0.5"
                            )}
                          >
                            <item.icon className={cn("w-5 h-5 transition-colors flex-shrink-0", isItemActive ? "text-white" : "text-gray-500 dark:text-gray-400 group-hover:text-pink-600 dark:group-hover:text-pink-400")} />
                            <span className="text-sm font-medium truncate">{item.title}</span>
                          </NavLink>
                        );
                      })}
                    </div>
                  )}

                  {categoryIndex < menuCategories.length - 1 && (
                    <div className="mt-3 mb-2 mx-3 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700/40 to-transparent" />
                  )}
                </div>
              );
            })
          ) : (
            // Versão colapsada - apenas ícones
            <TooltipProvider delayDuration={0}>
              <div className="flex flex-col gap-2 mt-2">
                {visibleMenuItems.map((item, index) => {
                  const isItemActive = isActive(item.url);
                  const itemColor = colors[index % colors.length] || colors[0];
                  return (
                    <Tooltip key={item.title}>
                      <TooltipTrigger asChild>
                        <NavLink
                          to={item.url}
                          end={item.url === "/dashboard"}
                          className={cn(
                            "relative flex items-center justify-center h-10 w-10 mx-auto rounded-xl transition-all duration-300 group",
                            isItemActive
                              ? `bg-gradient-to-br ${itemColor.bg} text-white shadow-lg`
                              : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          )}
                          style={isItemActive ? {
                            boxShadow: isDark ? `0 6px 20px ${itemColor.shadowColor}` : `0 4px 16px ${itemColor.shadowColor}`
                          } : undefined}
                        >
                          <item.icon className={cn("w-5 h-5 transition-colors", isItemActive ? "text-white" : "group-hover:text-gray-900 dark:group-hover:text-white")} />
                        </NavLink>
                      </TooltipTrigger>
                      <TooltipContent side="right" sideOffset={10} className="font-semibold text-sm z-[60]">
                        {item.title}
                      </TooltipContent>
                    </Tooltip>
                  );
                })}
              </div>
            </TooltipProvider>
          )}
        </div>

        {/* Toggle Button */}
        <div className="px-3 py-3 border-t border-gray-200/60 dark:border-gray-700/30">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}
            className={cn(
              "w-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300",
              isSidebarExpanded ? "justify-between px-3" : "justify-center px-0"
            )}
          >
            {isSidebarExpanded && <span className="text-xs font-medium text-gray-500">Recolher menu</span>}
            {isSidebarExpanded ? <PanelLeftClose className="w-4 h-4 text-gray-500" /> : <PanelLeftOpen className="w-4 h-4 text-gray-500" />}
          </Button>
        </div>
      </div>
    </div>

    <MobileHamburgerMenu menuItems={visibleMenuItems} isActive={isActive} onProfileClick={() => handleProfileDialogOpen(true)} />
    <UserProfileDialog open={profileDialogOpen} onOpenChange={handleProfileDialogOpen} />
  </>;
}