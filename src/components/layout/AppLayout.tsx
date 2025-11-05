import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SmoothPageTransition } from "./SmoothPageTransition";
import { MobilePageTransition } from "./MobilePageTransition";
import { useMobile } from "@/contexts/MobileProvider";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";

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
  "/dashboard/contagem-estoque": "Contagem de Estoque",
  "/dashboard/anotacoes": "Anotações",
  "/dashboard/historico": "Histórico",
  "/dashboard/analytics": "Analytics",
  "/dashboard/relatorios": "Relatórios",
  "/dashboard/configuracoes": "Configurações"
};

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const isMobile = useMobile();
  const pageTitle = pageTitles[location.pathname] || "";

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
    <div className="min-h-screen w-full bg-[#F6F7F9] dark:bg-[#16181D] overflow-x-hidden">
      {/* Desktop Sidebar Flutuante */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col w-full min-h-screen relative">
        {/* Header Fixo Minimalista */}
        <header className="fixed top-1 right-1 left-1 md:right-1 md:left-24 z-40 h-16 bg-white/80 dark:bg-[#1C1F26]/95 backdrop-blur-xl border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 rounded-xl transition-all duration-150 ease-out">
          {/* Efeito de vidro minimalista */}
          <>
            {/* Gradiente sutil apenas no modo claro */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-white/40 dark:from-transparent dark:via-transparent dark:to-transparent rounded-xl pointer-events-none"></div>
            {/* Brilho superior sutil */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700/20 to-transparent pointer-events-none"></div>
          </>

          <div className="relative z-10 flex items-center justify-between h-full px-4 md:px-6 w-full max-w-full gap-3 md:gap-4 transition-opacity duration-150 md:transition-all md:duration-150">
            {/* Título da Página - Lado Esquerdo */}
            {pageTitle && (
              <div className="hidden md:flex items-center gap-3 min-w-0">
                <h1 className="text-xl md:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight leading-tight truncate">
                  {pageTitle}
                </h1>
              </div>
            )}
            
            {/* Global Search - Centralizada com bom espaçamento */}
            <div className={`flex-1 flex items-center ${pageTitle ? 'justify-end md:justify-center' : 'justify-center'} max-w-2xl ${pageTitle ? 'md:mx-0' : 'mx-auto'} min-w-0`}>
              <div className="w-full max-w-xl">
                <GlobalSearchTrigger onClick={() => setSearchOpen(true)} />
              </div>
            </div>

            {/* Action Buttons */}
            <TooltipProvider delayDuration={300}>
              <div className="flex items-center shrink-0 gap-1.5 md:gap-2 transition-all duration-150">
                <CompanySelector />
                
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
        </header>

        {/* Main Content */}
        <main className={`flex-1 w-full pb-20 md:pb-0 relative pt-[4.5rem] md:pl-24 transition-none ${isMobile ? 'overflow-hidden' : ''}`}>
          <div className={`min-h-full w-full max-w-full page-content-wrapper ${isMobile ? 'relative overflow-hidden' : ''}`}>
            <div className={`w-full max-w-full ${isMobile ? 'h-full' : ''}`}>
              {isMobile ? (
                <MobilePageTransition>
                  <Outlet />
                </MobilePageTransition>
              ) : (
                <SmoothPageTransition>
                  <Outlet />
                </SmoothPageTransition>
              )}
            </div>
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}