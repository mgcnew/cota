import { useState, useEffect, memo, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { TopBar } from "./TopBar";
import { SmoothPageTransition } from "./SmoothPageTransition";
import { Settings as SettingsIcon } from "lucide-react"; // Only keep if needed, else empty
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { AIGlobalSearch } from "./AIGlobalSearch";
import { MobileBottomNav } from "./MobileBottomNav";
import { designSystem } from "@/styles/design-system";

export function AppLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const [aiSearchOpen, setAiSearchOpen] = useState(false);

  // Sidebar is permanently collapsed on desktop now
  const isSidebarExpanded = false;

  // Removed unused handleLogout since it will be in Sidebar

  return (
    <div className="app-bg h-screen w-full overflow-hidden flex flex-col">
      {/* Desktop Sidebar (docada, colada na borda esquerda) */}
      <AppSidebar onOpenAI={() => setAiSearchOpen(true)} />

      {/* Topbar (título da página + busca global), alinhada à direita da sidebar */}
      <TopBar sidebarExpanded={isSidebarExpanded} />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 w-full overflow-y-auto overflow-x-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          "pb-20 md:pb-0 md:pt-14",
          isSidebarExpanded ? "md:pl-64" : "md:pl-14"
        )}
      >
        <SmoothPageTransition>
          <Outlet />
        </SmoothPageTransition>
      </main>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />

      {/* AI Search Dialog */}
      <AIGlobalSearch open={aiSearchOpen} onOpenChange={setAiSearchOpen} />
    </div>
  );
}
