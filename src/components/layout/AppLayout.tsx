import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SmoothPageTransition } from "./SmoothPageTransition";
import { Settings, LogOut, Package, Building2, FileText, ShoppingCart, ClipboardList, BookOpen, History, TrendingUp, BarChart3 } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GlobalSearch, GlobalSearchTrigger } from "./GlobalSearch";
import { CompanySelector } from "./CompanySelector";

// Mapeamento de títulos por rota
const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/dashboard/produtos": "Produtos",
  "/dashboard/fornecedores": "Fornecedores",
  "/dashboard/cotacoes": "Cotações",
  "/dashboard/pedidos": "Pedidos",
  "/dashboard/lista-compras": "Lista de Compras",
  "/dashboard/contagem-estoque": "Contagem de Estoque",
  "/dashboard/anotacoes": "Anotações",
  "/dashboard/historico": "Histórico",
  "/dashboard/analytics": "Analytics",
  "/dashboard/relatorios": "Relatórios",
  "/dashboard/configuracoes": "Configurações"
};

const pageIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  "/dashboard": BarChart3,
  "/dashboard/produtos": Package,
  "/dashboard/fornecedores": Building2,
  "/dashboard/cotacoes": FileText,
  "/dashboard/pedidos": ShoppingCart,
  "/dashboard/lista-compras": ShoppingCart,
  "/dashboard/contagem-estoque": ClipboardList,
  "/dashboard/anotacoes": BookOpen,
  "/dashboard/historico": History,
  "/dashboard/analytics": TrendingUp,
  "/dashboard/relatorios": BarChart3,
  "/dashboard/configuracoes": Settings,
};

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const pageTitle = pageTitles[location.pathname] || "";
  const PageIcon = pageIcons[location.pathname] || Package;

  // Estado para controlar o padding baseado na sidebar
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(() => {
    const saved = localStorage.getItem('sidebarExpanded');
    return saved !== null ? saved === 'true' : true;
  });

  // Ouvir mudanças na sidebar
  useEffect(() => {
    const handleSidebarToggle = (e: CustomEvent<{ expanded: boolean }>) => {
      setIsSidebarExpanded(e.detail.expanded);
    };

    window.addEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    return () => {
      window.removeEventListener('sidebarToggle', handleSidebarToggle as EventListener);
    };
  }, []);


  const handleLogout = async () => {
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
  };

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      {/* Desktop Sidebar Flutuante */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col w-full min-h-screen relative">
        {/* Header Fixo Minimalista */}
        <header
          className={cn(
            "fixed top-1 right-1 left-1 md:right-1 z-40 h-16 bg-card/80 backdrop-blur-xl border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 rounded-xl transition-all duration-300 ease-in-out",
            isSidebarExpanded ? "md:left-[17rem]" : "md:left-24"
          )}
        >
          {/* Efeito de vidro minimalista */}
          <>
            {/* Gradiente sutil apenas no modo claro */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-white/40 dark:from-transparent dark:via-transparent dark:to-transparent rounded-xl pointer-events-none"></div>
            {/* Brilho superior sutil */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700/20 to-transparent pointer-events-none"></div>
          </>

          <div className="relative z-10 flex items-center h-full px-2 sm:px-4 md:px-6 w-full max-w-full gap-2 sm:gap-3 md:gap-4 transition-opacity duration-150 md:transition-all md:duration-150">
            {/* Mobile: Espaço para menu hamburger (esquerda) */}
            <div className="md:hidden w-10 flex-shrink-0" />

            {/* Global Search - Centralizada e responsiva */}
            <div className="flex-1 flex items-center justify-center min-w-0">
              <div className="w-full max-w-md md:max-w-xl lg:max-w-2xl">
                <GlobalSearchTrigger onClick={() => setSearchOpen(true)} />
              </div>
            </div>

            {/* Action Buttons - Sempre à direita */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
              <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 transition-all duration-150">
                  <div className="hidden sm:block">
                    <CompanySelector />
                  </div>

                  <Separator orientation="vertical" className="h-6 bg-gray-200 dark:bg-gray-700/50 hidden md:flex" />

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div>
                        <ThemeToggle />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Alternar tema</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate('/dashboard/configuracoes')}
                        className="hidden md:flex p-0 rounded-lg h-9 w-9 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
                      >
                        <Settings className="h-4 w-4 transition-all duration-150" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Configurações</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleLogout}
                        className="hidden md:flex p-0 rounded-lg h-9 w-9 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all duration-200 text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
                      >
                        <LogOut className="h-4 w-4 transition-all duration-150" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p>Sair</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </TooltipProvider>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main
          className={cn(
            "flex-1 w-full pb-20 md:pb-0 relative pt-[4.5rem] transition-all duration-300 ease-in-out overflow-x-hidden overflow-y-auto",
            isSidebarExpanded ? "md:pl-[17rem]" : "md:pl-24"
          )}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="min-h-full w-full max-w-full page-content-wrapper overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="w-full max-w-full overflow-x-hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              <SmoothPageTransition>
                <Outlet />
              </SmoothPageTransition>
            </div>
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}