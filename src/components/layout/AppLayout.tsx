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
    <div className="min-h-screen w-full bg-gray-50 md:bg-gradient-to-br md:from-gray-50 md:via-slate-50 md:to-stone-50 dark:bg-gray-900 dark:md:from-gray-900 dark:md:via-gray-950 dark:md:to-slate-950 overflow-x-hidden">
      {/* Desktop Sidebar Flutuante */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col w-full min-h-screen relative">
        {/* Header Fixo Minimalista */}
        <header className="fixed top-1 right-1 left-1 md:right-1 md:left-[5.5rem] z-40 h-12 bg-white dark:bg-gray-900 md:bg-white/80 md:dark:bg-gray-900/80 md:backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300/70 dark:hover:border-gray-600/70 rounded-xl transition-opacity duration-200 md:transition-all md:duration-300 ease-out">
          {/* Efeito de vidro gloss - Apenas desktop */}
          <>
            <div className="hidden md:block absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-white/30 dark:from-gray-800/40 dark:via-gray-900/10 dark:to-gray-800/30 rounded-xl pointer-events-none"></div>
            <div className="hidden md:block absolute inset-0 rounded-xl ring-1 ring-inset ring-white/50 dark:ring-gray-700/50 pointer-events-none"></div>
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
        <main className="flex-1 w-full overflow-x-hidden pb-20 md:pb-0 relative pt-[3.75rem] pl-0 md:pl-[5rem] pr-0">
          <div className="min-h-full bg-transparent md:bg-white/40 md:dark:bg-gray-900/40 md:backdrop-blur-sm w-full max-w-full">
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