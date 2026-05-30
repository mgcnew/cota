import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "next-themes";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  MoreHorizontal,
  Building2,
  StickyNote,
  BarChart3,
  Settings,
  LogOut,
  Sun,
  Moon,
  PackageOpen,
  TrendingUp,
  ScanLine,
  User,
} from "lucide-react";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { useToast } from "@/hooks/use-toast";

const MORE_NAV_ITEMS = [
  { label: "Fornecedores", icon: Building2, href: "/dashboard/fornecedores" },
  { label: "Anotações",   icon: StickyNote,  href: "/dashboard/anotacoes"   },
  { label: "Relatórios",  icon: BarChart3,   href: "/dashboard/relatorios"  },
  { label: "Embalagens",  icon: PackageOpen, href: "/dashboard/embalagens" },
  { label: "Análise",     icon: TrendingUp,  href: "/dashboard/analise-compras" },
  { label: "Etiquetas",  icon: ScanLine,    href: "/dashboard/etiquetas" },
];

const MORE_ROUTES = MORE_NAV_ITEMS.map(i => i.href.split("?")[0]);

export function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const { toast } = useToast();

  const [moreOpen, setMoreOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const pathname = location.pathname;
  const searchTab = new URLSearchParams(location.search).get("tab");

  const isExact = (href: string) => pathname === href;
  const isPrefix = (href: string) => pathname.startsWith(href);

  const isDashboard = isExact("/dashboard");
  const isProdutos  = isPrefix("/dashboard/produtos");
  const isCompras   = isPrefix("/dashboard/compras");
  const isMore      = MORE_ROUTES.some(r => isPrefix(r) && !isExact("/dashboard") && !isPrefix("/dashboard/produtos") && !isPrefix("/dashboard/compras"));

  const go = useCallback((href: string) => {
    setMoreOpen(false);
    // href may contain query string
    const [path, qs] = href.split("?");
    navigate(qs ? `${path}?${qs}` : path);
  }, [navigate]);

  const handleLogout = useCallback(async () => {
    setMoreOpen(false);
    try {
      await signOut();
      toast({ title: "Logout realizado com sucesso!" });
      navigate("/", { replace: true });
    } catch {
      toast({ title: "Erro ao sair", variant: "destructive" });
    }
  }, [signOut, navigate, toast]);

  const PrimaryTab = ({
    label,
    icon: Icon,
    active,
    onClick,
  }: {
    label: string;
    icon: React.ElementType;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors touch-manipulation active:scale-95",
        active ? "text-brand" : "text-zinc-400 dark:text-zinc-500"
      )}
    >
      <Icon className={cn("w-5 h-5 transition-transform", active && "scale-110")} />
      <span className={cn("text-[10px] font-semibold tracking-tight", active ? "text-brand" : "text-zinc-400 dark:text-zinc-500")}>
        {label}
      </span>
    </button>
  );

  return (
    <>
      {/* Bottom Nav Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#16181C]/95 backdrop-blur-xl border-t border-border dark:border-white/5 shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.12)]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <div className="flex items-stretch h-16">
          <PrimaryTab label="Dashboard" icon={LayoutDashboard} active={isDashboard} onClick={() => go("/dashboard")} />
          <PrimaryTab label="Produtos"  icon={Package}         active={isProdutos}  onClick={() => go("/dashboard/produtos")} />
          <PrimaryTab label="Compras"   icon={ShoppingCart}    active={isCompras}   onClick={() => go("/dashboard/compras")} />
          <button
            onClick={() => setMoreOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors touch-manipulation active:scale-95",
              isMore ? "text-brand" : "text-zinc-400 dark:text-zinc-500"
            )}
          >
            <MoreHorizontal className={cn("w-5 h-5", isMore && "scale-110")} />
            <span className={cn("text-[10px] font-semibold tracking-tight", isMore ? "text-brand" : "text-zinc-400 dark:text-zinc-500")}>
              Mais
            </span>
          </button>
        </div>
      </div>

      {/* "Mais" Bottom Sheet */}
      <Drawer open={moreOpen} onOpenChange={setMoreOpen}>
        <DrawerContent className="md:hidden rounded-t-2xl pb-safe bg-background border-t border-border dark:border-white/5 focus:outline-none">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-border dark:bg-white/10" />
          </div>

          <div className="px-4 pb-6 pt-2 space-y-4">
            {/* Nav Items Grid */}
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              {MORE_NAV_ITEMS.map(({ label, icon: Icon, href }) => {
                const itemPath = href.split("?")[0];
                const itemTab  = href.includes("?tab=") ? href.split("=")[1] : null;
                const isActive = isPrefix(itemPath) && (!itemTab || searchTab === itemTab) && !isExact("/dashboard") && !isPrefix("/dashboard/produtos");
                return (
                  <button
                    key={href}
                    onClick={() => go(href)}
                    className={cn(
                      "flex flex-col items-center gap-2 py-3 px-1 rounded-xl transition-colors touch-manipulation active:scale-95",
                      isActive
                        ? "bg-brand/10 text-brand"
                        : "text-foreground hover:bg-muted/50"
                    )}
                  >
                    <div className={cn("p-2.5 rounded-xl", isActive ? "bg-brand/15" : "bg-muted/60 dark:bg-white/5")}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-semibold text-center leading-tight">{label}</span>
                  </button>
                );
              })}
            </div>

            {/* Divider */}
            <div className="border-t border-border dark:border-white/5" />

            {/* Utilities Row */}
            <div className="flex items-center gap-2">
              {/* Profile */}
              <button
                onClick={() => { setMoreOpen(false); setProfileOpen(true); }}
                className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl hover:bg-muted/50 active:scale-95 transition-all touch-manipulation"
              >
                <UserAvatar user={user} profile={profile} size="sm" className="ring-2 ring-brand/10" />
                <span className="text-[11px] font-semibold text-foreground">Perfil</span>
              </button>

              {/* Theme */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl hover:bg-muted/50 active:scale-95 transition-all touch-manipulation"
              >
                <div className="p-2 rounded-xl bg-muted/60 dark:bg-white/5">
                  {theme === "dark"
                    ? <Sun className="w-4 h-4 text-amber-400" />
                    : <Moon className="w-4 h-4 text-indigo-400" />
                  }
                </div>
                <span className="text-[11px] font-semibold text-foreground">{theme === "dark" ? "Claro" : "Escuro"}</span>
              </button>

              {/* Settings */}
              <button
                onClick={() => go("/dashboard/configuracoes")}
                className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl hover:bg-muted/50 active:scale-95 transition-all touch-manipulation"
              >
                <div className="p-2 rounded-xl bg-muted/60 dark:bg-white/5">
                  <Settings className="w-4 h-4 text-muted-foreground" />
                </div>
                <span className="text-[11px] font-semibold text-foreground">Config.</span>
              </button>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="flex flex-col items-center gap-1.5 flex-1 py-2 rounded-xl hover:bg-red-500/10 active:scale-95 transition-all touch-manipulation"
              >
                <div className="p-2 rounded-xl bg-red-500/10">
                  <LogOut className="w-4 h-4 text-red-500" />
                </div>
                <span className="text-[11px] font-semibold text-red-500">Sair</span>
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      <UserProfileDialog open={profileOpen} onOpenChange={setProfileOpen} />
    </>
  );
}
