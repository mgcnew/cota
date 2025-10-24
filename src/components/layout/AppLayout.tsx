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
    <div className="min-h-screen w-full bg-[#F6F7F9] dark:bg-gray-900 overflow-x-hidden">
      {/* Desktop Sidebar Flutuante */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col w-full min-h-screen relative">
        {/* Header Fixo Minimalista */}
        <header className="fixed top-1 right-1 left-1 md:right-1 md:left-24 z-40 h-16 bg-white/70 dark:bg-gray-900/70 backdrop-blur-2xl backdrop-saturate-150 border border-white/40 dark:border-gray-700/40 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)] hover:shadow-[0_8px_40px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_40px_rgba(0,0,0,0.5)] rounded-xl transition-all duration-300 ease-out">
          {/* Efeito de vidro gloss - Glassmorphism real */}
          <>
            {/* Gradiente principal do gloss - mais intenso */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/80 via-white/40 to-white/60 dark:from-white/[0.15] dark:via-white/[0.08] dark:to-white/[0.12] rounded-xl pointer-events-none"></div>
            {/* Brilho superior - mais visível */}
            <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-white dark:via-white/40 to-transparent pointer-events-none"></div>
            {/* Brilho inferior sutil */}
            <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-black/5 dark:via-white/5 to-transparent pointer-events-none"></div>
            {/* Ring interno para profundidade - mais visível */}
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/80 dark:ring-white/20 pointer-events-none"></div>
            {/* Reflexo no canto superior esquerdo - mais pronunciado */}
            <div className="absolute -top-8 -left-8 w-48 h-48 bg-gradient-to-br from-white/60 dark:from-white/20 via-white/30 dark:via-white/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
            {/* Reflexo no canto superior direito */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-bl from-white/40 dark:from-white/15 to-transparent rounded-full blur-2xl pointer-events-none"></div>
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