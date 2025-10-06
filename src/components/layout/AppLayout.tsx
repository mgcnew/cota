import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Bell, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlobalSearch, GlobalSearchTrigger } from "./GlobalSearch";
export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);
  
  const getPageTitle = () => {
    const path = location.pathname;
    const titles: Record<string, string> = {
      "/": "Dashboard",
      "/produtos": "Produtos",
      "/fornecedores": "Fornecedores",
      "/cotacoes": "Cotações",
      "/pedidos": "Pedidos",
      "/historico": "Histórico",
      "/relatorios": "Relatórios",
      "/analytics": "Analytics",
      "/configuracoes": "Configurações"
    };
    return titles[path] || "Sistema de Cotações";
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50 overflow-x-hidden">
      {/* Desktop Sidebar - Apenas para desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-full z-40">
        <AppSidebar />
      </div>
      
      {/* Main Content Area - Responsivo */}
      <div className="flex flex-col w-full md:ml-20 min-h-screen relative">
        {/* Header Elevado - Responsivo */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between h-full pl-3 pr-6 md:pl-3 md:pr-12 w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent truncate">
                  {getPageTitle()}
                </h1>
              </div>
            </div>
            
            {/* Global Search - Apenas desktop */}
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-lg mx-8">
              <GlobalSearchTrigger onClick={() => setSearchOpen(true)} />
            </div>
            
            {/* Mobile Search Button */}
            <div className="lg:hidden flex-1 flex justify-center max-w-[200px]">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchOpen(true)}
                className="text-gray-500 hover:text-gray-700 hover:bg-white/60 h-9 px-3 rounded-xl transition-all duration-200 text-sm"
              >
                Buscar...
              </Button>
            </div>
            
            {/* Action Buttons - Responsivos */}
            <div className="flex items-center gap-1 md:gap-2 shrink-0">
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/configuracoes')}
                className="text-gray-500 hover:text-gray-700 hover:bg-white/60 h-9 w-9 md:h-10 md:w-10 p-0 rounded-xl transition-all duration-200"
              >
                <Settings className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-white/60 h-9 w-9 md:h-10 md:w-10 p-0 rounded-xl transition-all duration-200">
                <Bell className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
              <Button variant="ghost" size="sm" className="text-gray-500 hover:text-gray-700 hover:bg-white/60 h-9 w-9 md:h-10 md:w-10 p-0 rounded-xl transition-all duration-200">
                <User className="h-4 w-4 md:h-5 md:w-5" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content - Responsivo com padding para mobile navigation */}
        <main className="flex-1 w-full overflow-x-hidden pb-20 md:pb-0 relative">
          <div className="min-h-full bg-white/30 backdrop-blur-sm w-full max-w-full">
            <div className="w-full max-w-full overflow-x-hidden">
              <Outlet />
            </div>
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Apenas mobile */}
      <div className="md:hidden">
        <AppSidebar />
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}