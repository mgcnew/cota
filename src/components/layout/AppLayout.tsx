import { useState, useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { Bell, User, Settings, Sun, Moon, Sunset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlobalSearch, GlobalSearchTrigger } from "./GlobalSearch";
import { useAuth } from "@/components/auth/AuthProvider";
export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Atualiza o horário a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto
    
    return () => clearInterval(timer);
  }, []);
  
  const getGreeting = () => {
    const hour = currentTime.getHours();
    
    if (hour >= 5 && hour < 12) {
      return { text: "Bom dia", icon: Sun, color: "text-yellow-600" };
    } else if (hour >= 12 && hour < 18) {
      return { text: "Boa tarde", icon: Sunset, color: "text-orange-600" };
    } else {
      return { text: "Boa noite", icon: Moon, color: "text-indigo-600" };
    }
  };
  
  const getUserName = () => {
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name.split(' ')[0]; // Primeiro nome
    }
    if (user?.email) {
      return user.email.split('@')[0]; // Nome do email
    }
    return "Usuário";
  };
  
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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-slate-50 to-stone-50 overflow-x-hidden">
      {/* Desktop Sidebar - Apenas para desktop */}
      <div className="hidden md:block fixed left-0 top-0 h-full z-40">
        <AppSidebar />
      </div>
      
      {/* Main Content Area - Responsivo */}
      <div className="flex flex-col w-full md:ml-20 min-h-screen relative">
        {/* Header Elevado - Responsivo */}
        <header className="h-16 bg-white/80 backdrop-blur-xl border-b border-white/20 sticky top-0 z-30 shadow-sm">
          <div className="flex items-center justify-between h-full pl-3 pr-6 md:pl-3 md:pr-12 w-full max-w-full overflow-hidden">
            <div className="flex items-center gap-3 min-w-0">
              {/* Saudação dinâmica com nome do usuário */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-gray-500 to-slate-600 rounded-full flex-shrink-0"></div>
                
                {user ? (
                  <>
                    {/* Desktop - Saudação completa */}
                    <div className="hidden sm:flex items-center gap-2 animate-in fade-in-0 slide-in-from-left-4 duration-500">
                      {(() => {
                        const greeting = getGreeting();
                        const GreetingIcon = greeting.icon;
                        return (
                          <>
                            <div className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
                              <GreetingIcon className={`h-3.5 w-3.5 ${greeting.color} flex-shrink-0`} />
                            </div>
                            <span className="text-sm font-medium text-gray-700 truncate">
                              {greeting.text}, <span className="font-semibold text-gray-900">{getUserName()}</span>
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Mobile - Só o nome com ícone */}
                    <div className="sm:hidden flex items-center gap-1 animate-in fade-in-0 slide-in-from-left-4 duration-500">
                      {(() => {
                        const greeting = getGreeting();
                        const GreetingIcon = greeting.icon;
                        return (
                          <>
                            <div className="p-1 rounded-md bg-white/60 backdrop-blur-sm shadow-sm">
                              <GreetingIcon className={`h-3 w-3 ${greeting.color} flex-shrink-0`} />
                            </div>
                            <span className="text-xs font-semibold text-gray-900 truncate max-w-[80px]">
                              {getUserName()}
                            </span>
                          </>
                        );
                      })()}
                    </div>
                  </>
                ) : (
                  /* Fallback quando não logado */
                  <div className="hidden sm:flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-white/60 backdrop-blur-sm shadow-sm">
                      <User className="h-3.5 w-3.5 text-gray-500 flex-shrink-0" />
                    </div>
                    <span className="text-sm font-medium text-gray-500 truncate">
                      Sistema de Cotações
                    </span>
                  </div>
                )}
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
              {/* Configurações - Apenas Desktop */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/configuracoes')}
                className="hidden md:flex text-gray-500 hover:text-gray-700 hover:bg-white/60 h-9 w-9 md:h-10 md:w-10 p-0 rounded-xl transition-all duration-200"
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
          <div className="min-h-full bg-white/40 backdrop-blur-sm w-full max-w-full">
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