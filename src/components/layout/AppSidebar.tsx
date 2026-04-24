import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Package,
  Building2,
  ShoppingCart,
  BarChart3,
  ClipboardList,
  Flag,
  StickyNote,
  ScanLine,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  LogOut,
  Settings,
  LucideIcon,

  Sun,
  Moon,
  Monitor
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CompanySelector } from "./CompanySelector";
import { WhatsAppNotificationBell } from "@/components/whatsapp/WhatsAppNotificationBell";

interface AppSidebarProps {
  onOpenAI?: () => void;
}

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
    items: [
      { title: "Anotações", url: "/dashboard/anotacoes", icon: StickyNote },
      { title: "Etiquetas", url: "/dashboard/etiquetas", icon: ScanLine },
      { title: "Faixas", url: "/dashboard/faixas", icon: Flag }
    ]
  },
  {
    title: "Análises",
    items: [{ title: "Relatórios", url: "/dashboard/relatorios", icon: BarChart3 }]
  }
];

const allMenuItems = menuCategories.flatMap((c) => c.items);

export function AppSidebar({ onOpenAI }: AppSidebarProps = {}) {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { theme, setTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sidebar is permanently collapsed on desktop
  const isSidebarExpanded = false;

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    () => new Set(menuCategories.map((c) => c.title))
  );

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

  const menuItems = useMemo(() => allMenuItems, []);


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
        <div 
          onClick={() => setProfileDialogOpen(true)}
          className="relative shrink-0 cursor-pointer overflow-hidden rounded-xl ring-2 ring-border/10 shadow-lg w-14 h-14 hover:opacity-80 transition-opacity bg-white flex items-center justify-center p-0.5"
          title="Abrir Perfil"
        >
          <img 
            src="/logo.png" 
            alt="Logo Empresa" 
            className="w-full h-full object-contain drop-shadow-sm scale-[1.05]"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
        </div>
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

      {/* FOOTER ACTIONS */}
      <div className="mt-auto flex flex-col items-center w-full pb-6 pt-4 gap-4 px-2 relative z-10">
        
        {/* Assistente de IA - Destacado e Flutuante */}
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                onClick={onOpenAI}
                className={cn(
                  "relative group w-10 h-10 p-0 rounded-xl flex items-center justify-center transition-all duration-300 overflow-hidden outline-none ring-0",
                  "bg-brand/10 text-brand hover:bg-brand/20 border-transparent",
                  "active:scale-95 mx-auto"
                )}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-6 h-6 relative z-10 group-hover:scale-110 transition-transform duration-300"
                >
                  <path d="M10.5 0C10.5 5.8 15.2 10.5 21 10.5C15.2 10.5 10.5 15.2 10.5 21C10.5 15.2 5.8 10.5 0 10.5C5.8 10.5 10.5 5.8 10.5 0Z" />
                  <path d="M20.5 3C20.5 4.933 22.067 6.5 24 6.5C22.067 6.5 20.5 8.067 20.5 10C20.5 8.067 18.933 6.5 17 6.5C18.933 6.5 20.5 4.933 20.5 3Z" />
                </svg>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={16} className="font-semibold text-xs border border-brand/20 shadow-lg shadow-brand/10">Assistente IA</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        {/* User Profile / Config Controls */}
        <DropdownMenu>
          <TooltipProvider delayDuration={0}>
            <Tooltip>
              <TooltipTrigger asChild>
                <DropdownMenuTrigger asChild>
                  <div 
                    className={cn(
                      "w-10 h-10 rounded-xl bg-muted/50 hover:bg-accent flex items-center justify-center overflow-hidden cursor-pointer",
                      "transition-all duration-300 hover:scale-105 active:scale-95 group relative border border-border mx-auto text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-semibold text-sm transition-colors uppercase">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </span>
                    )}
                  </div>
                </DropdownMenuTrigger>
              </TooltipTrigger>
              <TooltipContent side="right" sideOffset={16} className="font-semibold text-xs">Menu do Usuário</TooltipContent>
            </Tooltip>
          </TooltipProvider>

          <DropdownMenuContent side="right" sideOffset={20} align="end" className="w-64 rounded-2xl border-border/40 shadow-2xl bg-card/95 backdrop-blur-xl p-2 z-[60]">
            <DropdownMenuLabel className="font-normal px-2 py-2">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-bold leading-none">{profile?.full_name || "Usuário"}</p>
                <p className="text-[11px] leading-tight text-muted-foreground line-clamp-1">{user?.email}</p>
              </div>
            </DropdownMenuLabel>
            
            <DropdownMenuSeparator className="bg-border/50 my-1" />

            {/* Alternância de Empresas, caso tenha mais de uma */}
            <div className="px-2 py-1.5 w-full">
              <CompanySelector />
            </div>

            <DropdownMenuItem onClick={() => navigate('/dashboard/faixas')} className="cursor-pointer rounded-xl py-2.5">
              <Flag className="mr-3 h-4 w-4 text-brand" />
              <span className="font-medium text-sm">Faixas</span>
            </DropdownMenuItem>

            <DropdownMenuItem onClick={() => navigate('/dashboard/configuracoes')} className="cursor-pointer rounded-xl py-2.5">
              <Settings className="mr-3 h-4 w-4 opacity-70" />
              <span className="font-medium text-sm">Configurações</span>
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="cursor-pointer rounded-xl py-2.5">
              {theme === 'dark' ? <Sun className="mr-3 h-4 w-4 text-emerald-400" /> : <Moon className="mr-3 h-4 w-4 text-indigo-400" />}
              <span className="font-medium text-sm">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
            </DropdownMenuItem>
            
            <DropdownMenuSeparator className="bg-border/50 my-1" />
            
            <DropdownMenuItem onClick={handleLogout} className="cursor-pointer rounded-xl py-2.5 text-red-500 hover:text-red-600 focus:text-red-500 hover:bg-red-500/10 focus:bg-red-500/10 transition-colors">
              <LogOut className="mr-3 h-4 w-4 opacity-80" />
              <span className="font-bold text-sm">Sair do Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Notificações WhatsApp */}
        <WhatsAppNotificationBell />

      </div>
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
            aria-label="Menu"
            className="md:hidden fixed top-3 right-3 z-[100] h-12 w-12 rounded-2xl bg-background/40 backdrop-blur-xl border border-white/5 shadow-xl active:scale-90 transition-all group overflow-hidden touch-manipulation"
          >
            <div className="relative w-6 h-6">
              <span className={cn(
                "absolute top-1.5 left-0 w-6 h-0.5 bg-foreground rounded-full transition-all duration-300 ease-out",
                mobileMenuOpen ? "translate-y-1.5 rotate-45" : ""
              )} />
              <span className={cn(
                "absolute top-3 left-0 w-6 h-0.5 bg-foreground rounded-full transition-all duration-300 ease-out",
                mobileMenuOpen ? "opacity-0 -translate-x-2" : "opacity-100"
              )} />
              <span className={cn(
                "absolute top-4.5 left-0 w-6 h-0.5 bg-foreground rounded-full transition-all duration-200 ease-out",
                mobileMenuOpen ? "top-[1.125rem] -rotate-45" : "top-[1.125rem]"
              )} />
            </div>
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className={cn(
            "p-0 w-[85%] max-w-[300px] border-l border-white/5 shadow-2xl",
            "bg-gradient-to-b from-background/95 to-background/98 backdrop-blur-2xl"
          )}
        >
          <div className="w-full h-full flex flex-col">
            {/* Mobile Header - Compact & Premium */}
            <div className="px-6 py-6 flex items-center justify-between border-b border-white/5 bg-background/50 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div 
                  onClick={() => {
                    navigate('/dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="p-1.5 rounded-xl bg-white shadow-md ring-1 ring-brand/10 w-10 h-10 active:scale-95 transition-transform cursor-pointer overflow-hidden"
                >
                  <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-foreground tracking-tight">Cota Aki</h3>
                  <p className="text-[10px] text-muted-foreground font-medium opacity-70">Sistema Gestor</p>
                </div>
              </div>
              <WhatsAppNotificationBell />
            </div>

            {/* Mobile Menu Items - Optimized Density */}
            <nav className="flex-1 py-4 px-3 overflow-y-auto overscroll-contain custom-scrollbar bg-transparent">
              <div className="grid grid-cols-1 gap-1">
                {menuItems.map((item) => {
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
                        "flex items-center gap-4 px-4 py-3 rounded-2xl transition-all duration-200 relative group",
                        "active:scale-[0.98]",
                        isActive
                          ? "bg-brand/10 text-brand font-bold shadow-[0_4px_12px_-4px_rgba(var(--brand-rgb),0.2)]"
                          : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {isActive && (
                        <div className="absolute left-1 w-1.5 h-6 bg-brand rounded-full animate-in fade-in zoom-in duration-300" />
                      )}
                      <Icon className={cn("w-5 h-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-brand" : "opacity-70 group-hover:opacity-100")} />
                      <span className="text-sm tracking-tight">{item.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            </nav>

            {/* Mobile Footer - Action Bar Icons */}
            <div className="mt-auto p-4 bg-muted/30 backdrop-blur-xl rounded-t-[32px] border-t border-white/5">
              <div className="flex items-center justify-around w-full">
                {/* User Profile Avatar */}
                <button
                  onClick={() => {
                    setProfileDialogOpen(true);
                    setMobileMenuOpen(false);
                  }}
                  className="group relative flex flex-col items-center gap-1 p-2 active:scale-90 transition-all"
                >
                  <div className="relative">
                    <UserAvatar 
                      user={user} 
                      profile={profile} 
                      size="md" 
                      className="ring-2 ring-brand/10 group-hover:ring-brand/30 transition-all shrink-0" 
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-background rounded-full flex items-center justify-center border border-brand/20">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    </div>
                  </div>
                </button>

                {/* Theme Toggle */}
                <button
                  onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                  className="p-4 rounded-2xl text-muted-foreground hover:bg-background hover:text-foreground active:scale-95 transition-all group"
                  title="Alternar Tema"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-6 h-6 text-brand transition-transform group-hover:rotate-45" />
                  ) : (
                    <Moon className="w-6 h-6 text-brand transition-transform group-hover:-rotate-12" />
                  )}
                </button>

                {/* Settings Icon */}
                <button
                  onClick={() => {
                    navigate('/dashboard/configuracoes');
                    setMobileMenuOpen(false);
                  }}
                  className="p-4 rounded-2xl text-muted-foreground hover:bg-background hover:text-foreground active:scale-95 transition-all group"
                  title="Configurações"
                >
                  <Settings className="w-6 h-6 opacity-80 group-hover:opacity-100 group-hover:rotate-45 transition-all" />
                </button>

                {/* Logout Icon */}
                <button
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="p-4 rounded-2xl text-red-500/80 hover:bg-red-500/10 active:scale-95 transition-all group"
                  title="Sair"
                >
                  <LogOut className="w-6 h-6 opacity-90 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                </button>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <UserProfileDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
    </>
  );
}

