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
import { designSystem } from "@/styles/design-system";

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
    <div className={cn("w-full h-full flex flex-col overflow-hidden", expanded ? "px-3 py-4" : "items-center py-4")}>
      {/* Header */}
      <div
        className={cn(
          "flex items-center mb-6 transition-all duration-300",
          expanded ? "px-2 gap-3" : "justify-center"
        )}
      >
        <UserAvatar
          user={user}
          profile={profile}
          size="md"
          showStatus
          clickable
          onClick={() => setProfileDialogOpen(true)}
          className="ring-2 ring-border/10 shadow-lg"
        />
        {expanded && (
          <div className="flex-1 min-w-0 animate-in fade-in slide-in-from-left-2 duration-300">
            <p className="text-sm font-semibold text-foreground truncate">
              {profile?.full_name || user?.email?.split("@")[0] || "Usuário"}
            </p>
            <p className="text-xs text-muted-foreground truncate">Membro</p>
          </div>
        )}
      </div>

      {/* Menu Items */}
      <div className="flex-1 flex flex-col space-y-1 overflow-y-auto custom-scrollbar pr-1">
        {expanded ? (
          menuCategories.map((category, idx) => {
            const isCollapsed = collapsedCategories.has(category.title);
            return (
              <div key={category.title} className={idx > 0 ? "mt-6" : ""}>
                <button
                  onClick={() => toggleCategory(category.title)}
                  className="w-full flex items-center justify-between px-2 py-1.5 mb-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
                >
                  <span className="opacity-70 group-hover:opacity-100 transition-opacity">{category.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 opacity-50 text-brand" />
                  ) : (
                    <ChevronDown className="w-3 h-3 opacity-50" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {category.items.map((item) => (
                      <NavLink
                        key={item.title}
                        to={item.url}
                        end={item.url === "/dashboard"}
                        onClick={() => collapseOtherCategories(category.title)}
                        className={({ isActive }) =>
                          cn(
                            designSystem.layout.sidebar.item.base,
                            isActive
                              ? designSystem.layout.sidebar.item.active
                              : designSystem.layout.sidebar.item.inactive
                          )
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <item.icon
                              className={cn(
                                "w-4 h-4 transition-colors relative z-10",
                                isActive
                                  ? designSystem.layout.sidebar.item.icon.active
                                  : designSystem.layout.sidebar.item.icon.inactive
                              )}
                            />
                            <span className="text-sm font-medium relative z-10">
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
            <div className="flex flex-col gap-2 mt-2 items-center w-full">
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
                          "relative flex items-center justify-center w-10 h-10 mx-auto transition-all duration-300 group rounded-none",
                          isActive
                            ? "text-brand shadow-[inset_0_-2px_0_0_hsl(var(--brand))] bg-transparent"
                            : "text-muted-foreground hover:text-foreground hover:bg-transparent"
                        )}
                      >
                        <Icon
                          className={cn("w-5 h-5 transition-transform group-hover:scale-110", isActive && "text-brand")}
                        />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent
                      side="right"
                      sideOffset={12}
                      className="font-medium text-xs"
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
        <div className={cn("pt-4 mt-2 border-t border-white/5", expanded ? "px-2" : "flex justify-center")}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsSidebarExpanded(!expanded)}
            className={cn(
              "w-full transition-all duration-200 text-muted-foreground hover:text-foreground hover:bg-white/5",
              expanded ? "justify-between px-3" : "h-10 w-10 p-0 justify-center rounded-xl"
            )}
          >
            {expanded && <span className="text-xs font-medium">Recolher Menu</span>}
            {expanded ? (
              <PanelLeftClose className="w-4 h-4 opacity-50" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 opacity-50" />
            )}
          </Button>
        </div>
      )}
    </div>
  );


  return (
    <>
      {/* Desktop Sidebar (Floating) */}
      <div
        className={cn(
          "hidden md:flex fixed z-50 left-3 top-3 bottom-3 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          isSidebarExpanded ? "w-64" : "w-20"
        )}
      >
        <div className={designSystem.layout.sidebar.wrapper}>
          <SidebarContent expanded={isSidebarExpanded} />
        </div>
      </div>

      {/* Mobile Sidebar */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden fixed top-3 left-3 z-[60] h-10 w-10 rounded-xl bg-background/80 backdrop-blur-md border border-border shadow-sm active:scale-95 transition-all"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className={cn("p-0 w-[280px] border-r border-white/5", designSystem.layout.container.glass)}
        >
          <div className="w-full h-full flex flex-col">
            {/* Mobile Header */}
            <div className="flex items-center gap-3 h-16 px-4 border-b border-white/5">
              <UserAvatar
                user={user}
                profile={profile}
                size="sm"
                clickable
                onClick={() => {
                  setProfileDialogOpen(true);
                  setMobileMenuOpen(false);
                }}
              />
              <div className="flex items-center gap-2">
                <Package className={cn("w-5 h-5", designSystem.colors.brand.primary)} />
                <span className="font-bold text-white tracking-tight">Cota Aki</span>
              </div>
            </div>

            {/* Mobile Menu Items */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-1">
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
                      "flex items-center gap-3 px-3 py-3 rounded-xl transition-all active:scale-[0.98]",
                      isActive
                        ? designSystem.layout.sidebar.item.active
                        : designSystem.layout.sidebar.item.inactive
                    )}
                  >
                    <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-brand" : "opacity-70")} />
                    <span className="text-sm font-medium">{item.title}</span>
                  </NavLink>
                );
              })}
            </nav>

            {/* Mobile Footer */}
            <div className="p-4 border-t border-border space-y-2">
              <button
                onClick={() => {
                  navigate('/dashboard/configuracoes');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span className="text-sm font-medium">Configurações</span>
              </button>
              <button
                onClick={() => {
                  handleLogout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-3 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors"
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

