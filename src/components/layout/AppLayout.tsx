import { useState, useEffect, memo, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SmoothPageTransition } from "./SmoothPageTransition";
import { Settings, LogOut } from "lucide-react";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { GlobalSearch, GlobalSearchTrigger } from "./GlobalSearch";
import { AIGlobalSearch, AIGlobalSearchTrigger } from "./AIGlobalSearch";
import { CompanySelector } from "./CompanySelector";
import { designSystem } from "@/styles/design-system";

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [searchOpen, setSearchOpen] = useState(false);
  const [aiSearchOpen, setAiSearchOpen] = useState(false);

  // Sidebar is permanently collapsed on desktop now
  const isSidebarExpanded = false;

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

  return (
    <div className="min-h-screen w-full bg-background overflow-x-hidden">
      {/* Desktop Sidebar Flutuante */}
      <AppSidebar />

      {/* Main Content Area */}
      <div className="flex flex-col w-full min-h-screen relative">
        {/* Header Fixo - Apenas Ações (Direita) */}
        <header
          className={cn(
            "fixed top-3 right-3 z-40 h-14 bg-card/80 backdrop-blur-xl border border-border/40 rounded-2xl shadow-sm transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)] flex items-center justify-end px-2 sm:px-4 w-auto min-w-fit",
            designSystem.layout.container.glass
          )}
        >
          {/* Right Side: Actions Only */}
          <div className="relative z-10 flex items-center h-full gap-2 sm:gap-3 md:gap-4">
            {/* AI Search - Button Trigger */}
            <div className="hidden lg:block">
              <AIGlobalSearchTrigger onClick={() => setAiSearchOpen(true)} compact />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 flex-shrink-0">
              <TooltipProvider delayDuration={300}>
                <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2 transition-all duration-150">
                  <div className="hidden sm:block">
                    <CompanySelector />
                  </div>

                  <Separator orientation="vertical" className="h-6 bg-border/50 hidden md:flex" />

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
                        className="hidden md:flex p-0 rounded-lg h-9 w-9 hover:bg-accent transition-all duration-200 text-muted-foreground hover:text-foreground"
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
                        className="hidden md:flex p-0 rounded-lg h-9 w-9 hover:bg-red-500/10 transition-all duration-200 text-red-400 hover:text-red-300"
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

        <main
          className={cn(
            "flex-1 w-full pb-20 md:pb-0 pt-20 lg:pt-0 overflow-x-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
            isSidebarExpanded ? "md:pl-[17.25rem]" : "md:pl-[6.25rem]"
          )}
        >
          <SmoothPageTransition>
            <Outlet />
          </SmoothPageTransition>
        </main>
      </div>

      {/* AI Search Dialog */}
      <AIGlobalSearch open={aiSearchOpen} onOpenChange={setAiSearchOpen} />

      {/* Global Search Dialog (fallback) */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
