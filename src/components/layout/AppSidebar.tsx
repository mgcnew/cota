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
import { MobileHamburgerMenu } from "@/components/mobile/MobileHamburgerMenu";
import { useState } from "react";
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
  ChevronRight
} from 'lucide-react';

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
    items: [
      {
        title: "Dashboard",
        url: "/dashboard",
        icon: LayoutDashboard
      }
    ]
  },
  {
    title: "Cadastros",
    items: [
      {
        title: "Produtos",
        url: "/dashboard/produtos",
        icon: Package
      },
      {
        title: "Fornecedores",
        url: "/dashboard/fornecedores",
        icon: Building2
      }
    ]
  },
  {
    title: "Operações",
    items: [
      {
        title: "Cotações",
        url: "/dashboard/cotacoes",
        icon: FileText
      },
      {
        title: "Pedidos",
        url: "/dashboard/pedidos",
        icon: ShoppingCart
      },
      {
        title: "Lista de Compras",
        url: "/dashboard/lista-compras",
        icon: ShoppingBasket
      }
    ]
  },
  {
    title: "Estoque",
    items: [
      {
        title: "Contagem de Estoque",
        url: "/dashboard/contagem-estoque",
        icon: ClipboardList
      }
    ]
  },
  {
    title: "Ferramentas",
    items: [
      {
        title: "Anotações",
        url: "/dashboard/anotacoes",
        icon: StickyNote
      }
    ]
  },
  {
    title: "Análises",
    items: [
      {
        title: "Relatórios",
        url: "/dashboard/relatorios",
        icon: BarChart3
      }
    ]
  },
  {
    title: "Outros",
    items: [
      {
        title: "Extra",
        url: "/dashboard/extra",
        icon: Star
      }
    ]
  }
];

// Flatten menu items for mobile compatibility
const menuItems = menuCategories.flatMap(category => category.items);

export function AppSidebar() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const isMobile = useMobile();
  const isDark = theme === 'dark';

  // State para categorias colapsáveis
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // Hooks dedicados para menu mobile
  const {
    isActive,
    profileDialogOpen,
    handleProfileDialogOpen,
  } = useMobileMenu();

  const { visibleMenuItems } = useMobileMenuItems(
    menuItems,
    isMobile
  );

  useMobileNavScroll();

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
    {/* Desktop Sidebar - Expandida com Categorias */}
    <div className="hidden md:flex fixed z-50 w-64 left-1 top-1 bottom-1">
      {/* Container Principal */}
      <div className="w-full flex flex-col bg-white dark:bg-[#1C1F26] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-gray-300/80 dark:border-gray-600/50">

        {/* Header com Avatar do Usuário */}
        <div className="flex items-center gap-3 h-20 px-4 border-b border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-b from-gray-50/50 to-white dark:from-transparent dark:to-transparent">
          <UserAvatar
            user={user}
            profile={profile}
            size="md"
            showStatus
            clickable
            onClick={() => handleProfileDialogOpen(true)}
          />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {profile?.name || user?.email?.split('@')[0] || 'Usuário'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
              {profile?.role || 'Membro'}
            </p>
          </div>
        </div>

        {/* Menu Items com Categorias */}
        <div className="flex-1 flex flex-col py-4 px-3 space-y-1 overflow-y-auto scrollbar-hide">
          {menuCategories.map((category) => {
            const isCollapsed = collapsedCategories.has(category.title);

            return (
              <div key={category.title} className="space-y-1">
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                >
                  <span>{category.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3" />
                  ) : (
                    <ChevronDown className="w-3 h-3" />
                  )}
                </button>

                {/* Category Items */}
                {!isCollapsed && (
                  <div className="space-y-1">
                    {category.items.map((item) => {
                      const isItemActive = isActive(item.url);

                      return (
                        <NavLink
                          key={item.title}
                          to={item.url}
                          end={item.url === "/dashboard"}
                          className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                            isItemActive
                              ? "bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/30"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                          )}
                        >
                          <item.icon
                            className={cn(
                              "w-5 h-5 transition-colors flex-shrink-0",
                              isItemActive
                                ? "text-white"
                                : "text-gray-500 dark:text-gray-400 group-hover:text-gray-700 dark:group-hover:text-white"
                            )}
                          />
                          <span className="text-sm font-medium truncate">
                            {item.title}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>

    {/* Mobile Hamburger Menu */}
    <MobileHamburgerMenu
      menuItems={visibleMenuItems}
      isActive={isActive}
      onProfileClick={() => handleProfileDialogOpen(true)}
    />

    {/* Dialog de Perfil */}
    <UserProfileDialog
      open={profileDialogOpen}
      onOpenChange={handleProfileDialogOpen}
    />
  </>;
}