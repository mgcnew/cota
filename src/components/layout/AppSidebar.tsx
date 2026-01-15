import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { useState, useEffect, useCallback, memo } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Package,
  Building2,
  ShoppingCart,
  BarChart3,
  ClipboardList,
  StickyNote,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  LogOut,
  Settings,
  LucideIcon
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useToast } from "@/hooks/use-toast";

interface MenuItem {
  title: string;
  url: string;
  icon: LucideIcon;
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
      { title: "Compras", url: "/dashboard/compras", icon: ShoppingCart }
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
  }
];

const allMenuItems = menuCategories.flatMap((c) => c.items);

export function AppSidebar() {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem("sidebarExpanded");
    return saved !== null ? saved === "true" : true;
  });

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    () => new Set(menuCategories.map((c) => c.title))
  );

  useEffect(() => {
    localStorage.setItem("sidebarExpanded", String(isSidebarExpanded));
    window.dispatchEvent(
      new CustomEvent("sidebarToggle", { detail: { expanded: isSidebarExpanded } })
    );
  }, [isSidebarExpanded]);

  const toggleCategory = useCallback((categoryTitle: string) => {
    setCollapsedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(categoryTitle)) {
        newSet.delete(categoryTitle);
      } else {
        newSet.add(categoryTitle);
      }
      return newSet;
    });
  }, []);

  const collapseOtherCategories = useCallback((keepOpen: string) => {
    setCollapsedCategories(
      new Set(menuCategories.filter((c) => c.title !== keepOpen).map((c) => c.title))
    );
  }, []);

  const handleLogout = useCallback(async () => {
    try {
      await signOut();
      toast({
        title: "Logout realizado com sucesso!",
        description: "Você saiu do sistema.",
      });
      navigate("/", { replace: true });
    } catch (error) {
      toast({
        title: "Erro ao sair",
        description: "Ocorreu um erro ao fazer logout. Tente novamente.",
        variant: "destructive",
      });
    }
  }, [signOut, toast, navigate]);

  // Fechar menu mobile ao navegar
  const handleMobileNavigation = useCallback(() => {
    setMobileMenuOpen(false);
  }, []);


  const SidebarContent = ({
    expanded = true,
    mobile = false
  }: {
    expanded?: boolean;
    mobile?: boolean;
  }) => (
    <div className="w-full h-full flex flex-col bg-card overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          "flex items-center h-16 px-4 border-b border-gray-200 dark:border-gray-700/50 transition-all duration-300",
          expanded ? "gap-3" : "justify-center"
        )}
      >
        <UserAvatar
          user={user}
          profile={profile}
          size="md"
          showStatus
          clickable
          onClick={() => setProfileDialogOpen(true)}
        />
        {expanded && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
              {profile?.full_name || user?.email?.split("@")[0] || "Usuário"}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Membro</p>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col py-3 px-2 overflow-y-auto scrollbar-hide">
        {expanded ? (
          menuCategories.map((category, idx) => {
            const isCollapsed = collapsedCategories.has(category.title);
            return (
              <div key={category.title} className={idx > 0 ? "mt-4" : ""}>
                <button
                  onClick={() => toggleCategory(category.title)}
                  className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg transition-colors text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-pink-600 dark:hover:text-pink-400"
                >
                  <span>{category.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-1 mt-1 px-1">
                    {category.items.map((item) => (
                      <NavLink
                        key={item.title}
                        to={item.url}
                        end={item.url === "/dashboard"}
                        onClick={() => collapseOtherCategories(category.title)}
                        className={({ isActive }) =>
                          cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group",
                            isActive
                              ? "bg-gradient-to-r from-pink-500 to-rose-500 shadow-lg shadow-pink-500/25"
                              : "hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:translate-x-0.5"
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              className={cn(
                                "w-5 h-5 transition-colors flex-shrink-0",
                                isActive
                                  ? "text-white"
                                  : "text-gray-500 dark:text-gray-300 group-hover:text-pink-600 dark:group-hover:text-pink-400"
                              )}
                            />
                            <span
                              className={cn(
                                "text-sm font-medium truncate transition-colors",
                                isActive
                                  ? "text-white"
                                  : "text-gray-700 dark:text-gray-200 group-hover:text-pink-600 dark:group-hover:text-pink-400"
                              )}
                            >
                              {item.title}
                            </span>
                          </>
                        )}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <TooltipProvider delayDuration={0}>
            <div className="flex flex-col gap-2 mt-2">
              {allMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.url === "/dashboard" 
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.url);
                
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.url}
                        className={cn(
                          "flex items-center justify-center h-10 w-10 mx-auto rounded-lg transition-all duration-200",
                          isActive 
                            ? "shadow-lg shadow-pink-500/25" 
                            : "hover:bg-gray-100 dark:hover:bg-gray-700/50"
                        )}
                        style={{
                          backgroundColor: isActive ? '#ec4899' : undefined
                        }}
                      >
                        <Icon
                          className="w-5 h-5"
                          style={{
                            color: isActive ? '#ffffff' : (isDark ? '#d1d5db' : '#374151')
                          }}
                        />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={12}
                      className="font-medium text-sm z-[60] bg-gray-900 text-white border-0 shadow-lg"
                    >
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
      {!mobile && (
        <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700/50">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarExpanded(!expanded)}
            className={cn(
              "w-full transition-all duration-200 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50 hover:text-pink-600 dark:hover:text-pink-400",
              expanded ? "justify-between px-3" : "justify-center px-0"
            )}
          >
            {expanded && <span className="text-xs font-medium">Recolher</span>}
            {expanded ? (
              <PanelLeftClose className="w-4 h-4" />
            ) : (
              <PanelLeftOpen className="w-4 h-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );


  return (
    <>
      {/* Desktop Sidebar */}
      <div
        className={cn(
          "hidden md:flex fixed z-50 left-0.5 top-0.5 bottom-0.5 transition-all duration-300 ease-in-out",
          isSidebarExpanded ? "w-64" : "w-20"
        )}
      >
        <div className="w-full h-full rounded-2xl overflow-hidden shadow-lg shadow-black/10 dark:shadow-black/30 border border-subtle bg-card">
          <SidebarContent expanded={isSidebarExpanded} />
        </div>
      </div>

      {/* Mobile Sidebar - Otimizado para performance */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-3 left-3 z-50 h-11 w-11 rounded-lg bg-white/95 dark:bg-gray-900/95 border border-gray-200 dark:border-gray-700/50 text-gray-700 dark:text-gray-300 shadow-sm active:scale-95 transition-transform duration-100"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="p-0 w-[280px] border-r border-subtle bg-card will-change-transform"
        >
          <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
          <SheetDescription className="sr-only">
            Menu principal da aplicação
          </SheetDescription>
          
          {/* Mobile Menu Content - Simplificado para performance */}
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 h-14 px-4 border-b border-gray-200 dark:border-gray-700/50 flex-shrink-0">
              <UserAvatar
                user={user}
                profile={profile}
                size="sm"
                showStatus
                clickable
                onClick={() => {
                  setProfileDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {profile?.full_name || user?.email?.split("@")[0] || "Usuário"}
                </p>
              </div>
            </div>

            {/* Menu Items - Lista direta sem animações pesadas */}
            <nav className="flex-1 py-2 px-2 overflow-y-auto overscroll-contain">
              {allMenuItems.map((item) => {
                const Icon = item.icon;
                const isActive = item.url === "/dashboard" 
                  ? location.pathname === "/dashboard"
                  : location.pathname.startsWith(item.url);
                
                return (
                  <NavLink
                    key={item.title}
                    to={item.url}
                    onClick={handleMobileNavigation}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5",
                      isActive
                        ? "bg-pink-500 text-white"
                        : "text-gray-700 dark:text-gray-200 active:bg-gray-100 dark:active:bg-gray-700/50"
                    )}
                  >
                    <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "text-gray-500 dark:text-gray-400")} />
                    <span className="text-sm font-medium">{item.title}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Footer Actions */}
            <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700/50 flex-shrink-0">
              <button
                onClick={() => {
                  navigate('/dashboard/configuracoes');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 active:bg-gray-100 dark:active:bg-gray-700/50"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Configurações</span>
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-red-600 dark:text-red-400 active:bg-red-50 dark:active:bg-red-950/20"
              >
                <LogOut className="w-5 h-5" />
                <span className="text-sm font-medium">Sair</span>
              </button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <UserProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
  );
}
