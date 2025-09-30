import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Search, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ThemeToggle } from "@/components/ui/theme-toggle";
export function AppLayout() {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
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
  return <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="h-14 md:h-16 border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center justify-between h-full px-3 md:px-6">
              <div className="flex items-center gap-2 md:gap-4 min-w-0">
                <SidebarTrigger className="text-muted-foreground hover:text-foreground shrink-0" />
                <h1 className="text-base md:text-xl font-semibold text-foreground truncate">{getPageTitle()}</h1>
              </div>
              
              {/* Global Search - Hidden on mobile */}
              <div className="hidden lg:flex items-center gap-4 flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input placeholder="Buscar cotações, produtos, fornecedores..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10 bg-background/50 border-border/50 focus:border-primary/50" />
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex items-center gap-1 md:gap-2 shrink-0">
                <ThemeToggle />
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-9 w-9 md:h-10 md:w-10 p-0">
                  <Bell className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground h-9 w-9 md:h-10 md:w-10 p-0">
                  <User className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>;
}