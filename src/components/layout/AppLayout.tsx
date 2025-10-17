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
  return <div className="min-h-screen w-full bg-gradient-to-br from-gray-50 via-slate-50 to-stone-50 overflow-x-hidden">
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
              <Button variant="ghost" size="sm" onClick={() => navigate('/configuracoes')} className="hidden md:flex p-0 rounded-xl h-8 w-8 hover:bg-white/40 hover:ring-1 hover:ring-white/30 hover:shadow-lg backdrop-blur-sm transition-all duration-500 text-gray-500">
                <Settings className="h-3.5 w-3.5 transition-all duration-300" />
              </Button>
              <Button variant="ghost" size="sm" className="p-0 rounded-xl h-8 w-8 hover:bg-white/40 hover:ring-1 hover:ring-white/30 hover:shadow-lg backdrop-blur-sm transition-all duration-500 text-gray-600">
                <Bell className="h-3.5 w-3.5 transition-all duration-500" />
              </Button>
              <Button variant="ghost" size="sm" className="p-0 rounded-xl h-8 w-8 hover:bg-white/40 hover:ring-1 hover:ring-white/30 hover:shadow-lg backdrop-blur-sm transition-all duration-500 text-gray-600">
                <User className="h-3.5 w-3.5 transition-all duration-500" />
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full overflow-hidden pb-20 md:pb-0 relative pt-16 pl-0 md:pl-24 pr-2">
          <div className="min-h-full bg-white/40 backdrop-blur-sm w-full max-w-full overflow-hidden">
            <div className="w-full max-w-full overflow-hidden">
              <SmoothPageTransition>
                <Outlet />
              </SmoothPageTransition>
            </div>
          </div>
        </main>
      </div>

      {/* Global Search Dialog */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>;
}