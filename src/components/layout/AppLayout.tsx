import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SmoothPageTransition } from "./SmoothPageTransition";
import { Bell, User, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { GlobalSearch, GlobalSearchTrigger } from "./GlobalSearch";

export function AppLayout() {
  const navigate = useNavigate();
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-slate-50 to-stone-50 overflow-x-hidden">
      {/* Desktop Sidebar Flutuante */}
      <AppSidebar />
      
      {/* Main Content Area */}
      <div className="flex flex-col w-full min-h-screen relative">
        {/* Header Fixo Minimalista */}
        <header className="fixed top-2 right-2 left-2 md:left-28 z-40 h-12 bg-white/80 backdrop-blur-xl border border-gray-200/60 hover:border-gray-300/70 rounded-xl transition-all duration-500 ease-out">
          {/* Efeito de vidro gloss - Idêntico à sidebar */}
          <>
            <div className="absolute inset-0 bg-gradient-to-br from-white/40 via-white/10 to-white/30 rounded-xl pointer-events-none"></div>
            <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/50 pointer-events-none"></div>
          </>
          
          <div className="relative z-10 flex items-center justify-between h-full px-4 md:px-6 w-full max-w-full gap-4 transition-all duration-500">
            {/* Global Search - Centralizada com bom espaçamento */}
            <div className="flex-1 flex items-center justify-center max-w-2xl mx-auto">
              <div className="w-full max-w-xl">
                <GlobalSearchTrigger onClick={() => setSearchOpen(true)} />
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center shrink-0 gap-1 transition-all duration-300">
              <div className="hidden md:block">
                <ThemeToggle />
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => navigate('/configuracoes')}
                className="hidden md:flex group p-0 rounded-xl h-8 w-8 hover:bg-gradient-to-br hover:from-slate-100 hover:to-slate-50 hover:ring-1 hover:ring-slate-200/50 hover:shadow-md backdrop-blur-sm transition-all duration-300"
              >
                <Settings className="h-3.5 w-3.5 text-slate-500 group-hover:text-slate-700 transition-all duration-300" />
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="group p-0 rounded-xl h-8 w-8 hover:bg-gradient-to-br hover:from-amber-100 hover:to-yellow-50 hover:ring-1 hover:ring-amber-200/50 hover:shadow-md backdrop-blur-sm transition-all duration-300 relative"
              >
                <Bell className="h-3.5 w-3.5 text-amber-500 group-hover:text-amber-600 transition-all duration-300" />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-gradient-to-br from-red-500 to-orange-500 rounded-full ring-2 ring-white"></span>
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="group p-0 rounded-xl h-8 w-8 hover:bg-gradient-to-br hover:from-blue-100 hover:to-cyan-50 hover:ring-1 hover:ring-blue-200/50 hover:shadow-md backdrop-blur-sm transition-all duration-300"
              >
                <User className="h-3.5 w-3.5 text-blue-500 group-hover:text-blue-600 transition-all duration-300" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full overflow-x-hidden pb-20 md:pb-0 relative pt-16 pl-0 md:pl-24">
          <div className="min-h-full bg-white/40 backdrop-blur-sm w-full max-w-full">
            <div className="w-full max-w-full overflow-x-hidden">
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
