import { useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SmoothPageTransition } from "./SmoothPageTransition";
import { Bell, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlobalSearch, GlobalSearchTrigger } from "./GlobalSearch";

// Mapeamento de títulos por rota
const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/produtos": "Produtos",
  "/fornecedores": "Fornecedores",
  "/cotacoes": "Cotações",
  "/pedidos": "Pedidos",
  "/historico": "Histórico",
  "/analytics": "Analytics",
  "/relatorios": "Relatórios",
  "/configuracoes": "Configurações"
};

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const pageTitle = pageTitles[location.pathname] || "";

  return (
    <div className="min-h-screen w-full bg-[#F6F7F9] dark:bg-[#16181D] overflow-x-hidden">
      {/* Desktop Sidebar Flutuante */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col w-full min-h-screen relative">
        {/* Header Fixo Minimalista */}
        <header className="fixed top-1 right-1 left-1 md:right-1 md:left-24 z-40 h-16 bg-white/80 dark:bg-[#1C1F26]/95 backdrop-blur-xl border border-sidebar-border shadow-sm dark:shadow-none hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-black/20 rounded-xl transition-all duration-300 ease-out">
          {/* Efeito de vidro minimalista */}
          <>
            {/* Gradiente sutil apenas no modo claro */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/60 via-white/30 to-white/40 dark:from-transparent dark:via-transparent dark:to-transparent rounded-xl pointer-events-none"></div>
            {/* Brilho superior sutil */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-gray-700/20 to-transparent pointer-events-none"></div>
          </>

          <div className="relative z-10 flex items-center justify-between h-full px-4 md:px-6 w-full max-w-full gap-4 transition-opacity duration-200 md:transition-all md:duration-300">
            {/* Título da Página - Lado Esquerdo */}
            {pageTitle && (
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 dark:from-blue-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent hidden md:block tracking-tight leading-tight">
                {pageTitle}
              </h1>
            )}
            
            {/* Global Search - Centralizada com bom espaçamento */}
            <div className={`flex-1 flex items-center ${pageTitle ? 'justify-end md:justify-center' : 'justify-center'} max-w-2xl ${pageTitle ? 'md:mx-0' : 'mx-auto'}`}>
              <div className="w-full max-w-xl">
                <GlobalSearchTrigger onClick={() => setSearchOpen(true)} />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center shrink-0 gap-1 transition-all duration-300">
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')} className="hidden md:flex p-0 rounded-xl h-8 w-8 hover:bg-white/40 hover:ring-1 hover:ring-white/30 hover:shadow-lg md:backdrop-blur-sm transition-opacity duration-200 text-gray-500">
                <Settings className="h-3.5 w-3.5 transition-all duration-300" />
              </Button>
              <Button variant="ghost" size="sm" className="p-0 rounded-xl h-8 w-8 hover:bg-gray-100 md:hover:bg-white/40 md:hover:ring-1 md:hover:ring-white/30 md:hover:shadow-lg md:backdrop-blur-sm transition-opacity duration-200 text-gray-600">
                <Bell className="h-3.5 w-3.5 transition-opacity duration-200" />
              </Button>
              <Button variant="ghost" size="sm" className="p-0 rounded-xl h-8 w-8 hover:bg-gray-100 md:hover:bg-white/40 md:hover:ring-1 md:hover:ring-white/30 md:hover:shadow-lg md:backdrop-blur-sm transition-opacity duration-200 text-gray-600">
                <User className="h-3.5 w-3.5 transition-opacity duration-200" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full overflow-x-hidden pb-20 md:pb-0 relative pt-[4.5rem] md:pl-20 transition-none">
          <div className="min-h-full w-full max-w-full">
            <div className="w-full max-w-full">
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