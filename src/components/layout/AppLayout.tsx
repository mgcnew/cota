import { useState, useEffect, memo, useCallback } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { SmoothPageTransition } from "./SmoothPageTransition";
import { Settings as SettingsIcon } from "lucide-react"; // Only keep if needed, else empty
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

import { GlobalSearch } from "./GlobalSearch";
import { AIGlobalSearch } from "./AIGlobalSearch";
import { MobileBottomNav } from "./MobileBottomNav";
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

  // Removed unused handleLogout since it will be in Sidebar

  return (
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col">
      {/* Desktop Sidebar Flutuante */}
      <AppSidebar onOpenAI={() => setAiSearchOpen(true)} />

      {/* Main Content Area */}
      <main
        className={cn(
          "flex-1 w-full overflow-y-auto overflow-x-hidden transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1)]",
          "pb-20 md:pb-6 pt-3 md:mt-3 md:mb-3",
          isSidebarExpanded ? "md:pl-[17rem] md:pr-3" : "md:pl-[4.25rem] md:pr-3"
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

      {/* Global Search Dialog (fallback) */}
      <GlobalSearch open={searchOpen} onOpenChange={setSearchOpen} />
    </div>
  );
}
