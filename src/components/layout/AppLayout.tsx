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
  const [isScrolled, setIsScrolled] = useState(false);
  
  // Atualiza o horário a cada minuto
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Atualiza a cada minuto
    
    return () => clearInterval(timer);
  }, []);

  // Hook para detectar scroll e aplicar animações no header
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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
      {/* Desktop Sidebar Flutuante - Renderizado independentemente */}
      <AppSidebar />
      
      {/* Main Content Area - Responsivo sem margem fixa */}
      <div className="flex flex-col w-full min-h-screen relative">
        {/* Header Fixo Sempre Compacto - Respeitando espaço do menu */}
        <header className="fixed top-2 right-2 left-28 z-40 h-12 bg-white/20 backdrop-blur-2xl shadow-2xl rounded-2xl border border-white/40 ring-1 ring-white/20 transition-all duration-500 ease-out">
          {/* Efeito de vidro sempre aplicado */}
          <>
            {/* Gradiente de fundo para efeito vidro */}
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-white/10 rounded-2xl"></div>
            {/* Reflexo superior */}
            <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/20 to-transparent rounded-t-2xl"></div>
            {/* Brilho sutil */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/20 via-transparent to-purple-50/20 rounded-2xl"></div>
            {/* Sombra interna */}
            <div className="absolute inset-0 shadow-inner rounded-2xl"></div>
          </>
          <div className="relative z-10 flex items-center justify-between h-full pl-4 pr-4 md:pl-6 md:pr-8 w-full max-w-full overflow-hidden transition-all duration-500">
            <div className="flex items-center gap-3 min-w-0">
              {/* Saudação dinâmica com nome do usuário */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="bg-gradient-to-b from-gray-500 to-slate-600 rounded-full flex-shrink-0 w-1.5 h-6 transition-all duration-500"></div>
                
                {user ? (
                  <>
                    {/* Desktop - Saudação sempre compacta */}
                    <div className="hidden sm:flex items-center gap-2 animate-in fade-in-0 slide-in-from-left-4 duration-500 scale-90">
                      {(() => {
                        const greeting = getGreeting();
                        const GreetingIcon = greeting.icon;
                        return (
                          <>
                            <div className="rounded-lg backdrop-blur-sm shadow-lg p-1 bg-white/40 ring-1 ring-white/30 transition-all duration-500">
                              <GreetingIcon className={`${greeting.color} flex-shrink-0 h-3 w-3 transition-all duration-300`} />
                            </div>
                            <span className="font-medium text-gray-700 truncate text-xs transition-all duration-300">
                              <span className="font-semibold text-gray-900">{getUserName()}</span>
                            </span>
                          </>
                        );
                      })()}
                    </div>
                    
                    {/* Mobile - Sempre compacto */}
                    <div className="sm:hidden flex items-center gap-1 animate-in fade-in-0 slide-in-from-left-4 duration-500 scale-90">
                      {(() => {
                        const greeting = getGreeting();
                        const GreetingIcon = greeting.icon;
                        return (
                          <>
                            <div className="rounded-md backdrop-blur-sm shadow-lg p-0.5 bg-white/40 ring-1 ring-white/30 transition-all duration-500">
                              <GreetingIcon className={`${greeting.color} flex-shrink-0 h-2.5 w-2.5 transition-all duration-300`} />
                            </div>
                            <span className="font-semibold text-gray-900 truncate text-xs max-w-[60px] transition-all duration-300">
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
            
            {/* Global Search - Sempre compacto */}
            <div className="hidden lg:flex items-center gap-4 flex-1 max-w-md mx-4 transition-all duration-300">
              <GlobalSearchTrigger onClick={() => setSearchOpen(true)} />
            </div>
            
            {/* Mobile Search Button - Sempre compacto */}
            <div className="lg:hidden flex-1 flex justify-center max-w-[150px] transition-all duration-300">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setSearchOpen(true)}
                className="text-gray-500 hover:text-gray-700 rounded-xl h-8 px-2 text-xs hover:bg-white/40 hover:ring-1 hover:ring-white/30 hover:shadow-lg backdrop-blur-sm transition-all duration-500"
              >
                Buscar
              </Button>
            </div>
            
            {/* Action Buttons - Sempre compactos */}
            <div className="flex items-center shrink-0 gap-1 scale-90 transition-all duration-300">
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              {/* Configurações - Sempre compacto */}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/configuracoes')}
                className="hidden md:flex text-gray-500 hover:text-gray-700 p-0 rounded-xl h-8 w-8 hover:bg-white/40 hover:ring-1 hover:ring-white/30 hover:shadow-lg backdrop-blur-sm transition-all duration-500"
              >
                <Settings className="h-3.5 w-3.5 transition-all duration-300" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 p-0 rounded-xl h-8 w-8 hover:bg-white/40 hover:ring-1 hover:ring-white/30 hover:shadow-lg backdrop-blur-sm transition-all duration-500"
              >
                <Bell className="h-3.5 w-3.5 transition-all duration-500" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-gray-500 hover:text-gray-700 p-0 rounded-xl h-8 w-8 hover:bg-white/40 hover:ring-1 hover:ring-white/30 hover:shadow-lg backdrop-blur-sm transition-all duration-500"
              >
                <User className="h-3.5 w-3.5 transition-all duration-500" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content - Responsivo com padding para header fixo e mobile navigation */}
        <main className="flex-1 w-full overflow-x-hidden pb-20 md:pb-0 relative pt-16 md:pl-24">
          <div className="min-h-full bg-white/40 backdrop-blur-sm w-full max-w-full">
            <div className="w-full max-w-full overflow-x-hidden">
              <Outlet />
            </div>
          </div>
        </main>
      </div>



      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}