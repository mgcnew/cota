import { useState, useEffect } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useAuth } from "@/components/auth/AuthProvider";
import { useUserProfile } from "@/hooks/useUserProfile";
import { UserAvatar } from "@/components/profile/UserAvatar";
import { UserProfileDialog } from "@/components/profile/UserProfileDialog";
import { 
  LayoutDashboard,
  Package, 
  Building2, 
  FileText, 
  ShoppingCart, 
  History, 
  BarChart3, 
  TrendingUp,
  Star,
  MoreHorizontal,
  Settings,
  User,
  ClipboardList
} from 'lucide-react';


// Menu items com ícones do Lucide React (recomendados)
const menuItems = [{
  title: "Dashboard",
  url: "/dashboard",
  icon: LayoutDashboard
}, {
  title: "Produtos",
  url: "/dashboard/produtos",
  icon: Package
}, {
  title: "Fornecedores",
  url: "/dashboard/fornecedores",
  icon: Building2
}, {
  title: "Cotações",
  url: "/dashboard/cotacoes",
  icon: FileText
}, {
  title: "Pedidos",
  url: "/dashboard/pedidos",
  icon: ShoppingCart
}, {
  title: "Contagem de Estoque",
  url: "/dashboard/contagem-estoque",
  icon: ClipboardList
}, {
  title: "Histórico",
  url: "/dashboard/historico",
  icon: History
}, {
  title: "Relatórios",
  url: "/dashboard/relatorios",
  icon: BarChart3
}, {
  title: "Analytics",
  url: "/dashboard/analytics",
  icon: TrendingUp
}, {
  title: "Extra",
  url: "/dashboard/extra",
  icon: Star
}];

// Cores para os itens com efeitos aprimorados
const colors = [{
  bg: 'from-blue-500 to-blue-600',
  shadow: 'shadow-blue-500/25',
  from: '#3b82f6',
  to: '#2563eb',
  shadowColor: 'rgba(59, 130, 246, 0.25)',
  glow: 'shadow-blue-400/50'
}, {
  bg: 'from-orange-500 to-amber-500',
  shadow: 'shadow-orange-500/25',
  from: '#f97316',
  to: '#f59e0b',
  shadowColor: 'rgba(249, 115, 22, 0.25)',
  glow: 'shadow-orange-400/50'
}, {
  bg: 'from-indigo-500 to-blue-500',
  shadow: 'shadow-indigo-500/25',
  from: '#6366f1',
  to: '#3b82f6',
  shadowColor: 'rgba(99, 102, 241, 0.25)',
  glow: 'shadow-indigo-400/50'
}, {
  bg: 'from-teal-500 to-cyan-500',
  shadow: 'shadow-teal-500/25',
  from: '#14b8a6',
  to: '#06b6d4',
  shadowColor: 'rgba(20, 184, 166, 0.25)',
  glow: 'shadow-teal-400/50'
}, {
  bg: 'from-pink-500 to-rose-500',
  shadow: 'shadow-pink-500/25',
  from: '#ec4899',
  to: '#f43f5e',
  shadowColor: 'rgba(236, 72, 153, 0.25)',
  glow: 'shadow-pink-400/50'
}, {
  bg: 'from-slate-500 to-gray-500',
  shadow: 'shadow-slate-500/25',
  from: '#64748b',
  to: '#6b7280',
  shadowColor: 'rgba(100, 116, 139, 0.25)',
  glow: 'shadow-slate-400/50'
}, {
  bg: 'from-purple-500 to-violet-500',
  shadow: 'shadow-purple-500/25',
  from: '#a855f7',
  to: '#8b5cf6',
  shadowColor: 'rgba(168, 85, 247, 0.25)',
  glow: 'shadow-purple-400/50'
}, {
  bg: 'from-green-500 to-emerald-500',
  shadow: 'shadow-green-500/25',
  from: '#22c55e',
  to: '#10b981',
  shadowColor: 'rgba(34, 197, 94, 0.25)',
  glow: 'shadow-green-400/50'
}, {
  bg: 'from-fuchsia-500 to-pink-500',
  shadow: 'shadow-fuchsia-500/25',
  from: '#d946ef',
  to: '#ec4899',
  shadowColor: 'rgba(217, 70, 239, 0.25)',
  glow: 'shadow-fuchsia-400/50'
}];

// Componente do botÃ£o "Mais" para mobile
function MobileMoreButtonContent({
  remainingItems,
  setProfileDialogOpen,
  navigate
}: {
  remainingItems: any[];
  setProfileDialogOpen: (open: boolean) => void;
  navigate: (path: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mobile-nav-button flex flex-col items-center justify-center transition-all duration-200 rounded-2xl group relative overflow-hidden backdrop-blur-sm h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] text-gray-500 hover:text-gray-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/90 hover:shadow-lg touch-manipulation active:bg-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>

          <div className="flex items-center justify-center mb-1 relative z-10 transition-all duration-300 w-7 h-7 rounded-xl group-hover:bg-white/60 group-hover:shadow-md">
            <MoreHorizontal className="w-4 h-4 transition-all duration-200 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
          </div>

          <span className="text-[9px] font-bold text-center leading-tight transition-all duration-300 truncate max-w-[65px] relative z-10 tracking-wide text-gray-600 group-hover:text-gray-800 group-hover:font-extrabold">
            Mais
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="w-[90vw] max-w-sm p-0 border-0 shadow-2xl rounded-2xl bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl">
        <DialogHeader className="px-3 py-2.5 border-b border-gray-100/60 dark:border-gray-700/60 bg-gradient-to-r from-blue-50/80 to-purple-50/80 dark:from-blue-900/40 dark:to-purple-900/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <MoreHorizontal className="w-4 h-4 text-white" />
            </div>
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-blue-900 to-purple-800 dark:from-blue-200 dark:to-purple-200 bg-clip-text text-transparent">
              Mais Opções
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-3 space-y-4 bg-white/95 dark:bg-gray-900/95">
          {/* Seção Perfil */}
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-3 px-1">
              Perfil
            </h3>
            <button 
              onClick={() => {
                setOpen(false);
                setProfileDialogOpen(true);
              }}
              className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 hover:from-blue-100 hover:to-purple-100 dark:hover:from-blue-900/30 dark:hover:to-purple-900/30 border border-blue-200/60 dark:border-blue-700/40 transition-all duration-200 shadow-sm hover:shadow-md"
            >
              <UserAvatar user={user} profile={profile} size="md" />
              <div className="flex-1 text-left">
                <div className="font-semibold text-sm text-gray-900 dark:text-white">
                  {profile?.full_name || user?.email?.split('@')[0] || 'Usuário'}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</div>
              </div>
            </button>
          </div>

          {/* Seção Principal - Navegação */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-300 uppercase tracking-wider mb-3 px-1">
              Navegação
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {remainingItems.map((item, index) => {
              const isItemActive = location.pathname === item.url || item.url === "/" && location.pathname === "/";
              const itemColor = colors[(index + 4) % colors.length];
              return <NavLink key={item.title} to={item.url} end={item.url === "/"} onClick={() => setOpen(false)} className={cn("flex flex-col items-center gap-2 p-2.5 rounded-xl transition-all duration-200 group relative overflow-hidden hover:scale-[1.02] active:scale-95", isItemActive ? `bg-gradient-to-br ${itemColor.bg} shadow-md text-white ring-2 ring-white/20 dark:ring-white/10` : "bg-white/85 dark:bg-gray-800/85 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md text-gray-700 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300 dark:hover:border-blue-500")}>
                    <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200", isItemActive ? "bg-white/20 backdrop-blur-sm" : `bg-gradient-to-br ${itemColor.bg} group-hover:scale-105`)}>
                      <item.icon className="w-[18px] h-[18px] transition-all duration-200 text-white" />
                    </div>
                    <div className={cn("text-xs font-semibold transition-all duration-200 text-center", isItemActive ? "text-white" : "text-gray-900 dark:text-gray-200 group-hover:text-blue-900 dark:group-hover:text-blue-300")}>{item.title}</div>
                  </NavLink>;
            })}
            </div>
          </div>

          {/* Seção Configurações */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 px-1">
              Sistema
            </h3>
            <div className="space-y-2">
              <button onClick={() => {
              setOpen(false);
              navigate('/dashboard/configuracoes');
            }} className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-white/85 dark:bg-gray-800/85 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-sm">
                  <Settings className="w-[18px] h-[18px] text-white" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm text-gray-900 dark:text-white">Configurações</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">Ajustes do sistema</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>;
}

function MobileMoreButton({
  remainingItems,
  setProfileDialogOpen,
  navigate
}: {
  remainingItems: any[];
  setProfileDialogOpen: (open: boolean) => void;
  navigate: (path: string) => void;
}) {
  return <MobileMoreButtonContent 
    remainingItems={remainingItems} 
    setProfileDialogOpen={setProfileDialogOpen}
    navigate={navigate}
  />;
}

export function AppSidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const [isScrolled, setIsScrolled] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const { theme } = useTheme();
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const isDark = theme === 'dark';
  const mobilePrimaryOrder = ["/pedidos", "/cotacoes", "/", "/produtos"];
  const primaryMobileItems = mobilePrimaryOrder
    .map(path => menuItems.find(item => item.url === path))
    .filter((item): item is typeof menuItems[number] => Boolean(item));
  const remainingMobileItems = menuItems.filter(item => !mobilePrimaryOrder.includes(item.url));

  // Hook para detectar scroll e aplicar animaÃ§Ãµes no sidebar
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      setIsScrolled(scrollTop > 20);
    };
    window.addEventListener('scroll', handleScroll, {
      passive: true
    });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Reset de transformaÃ§Ãµes ao mudar de pÃ¡gina
  useEffect(() => {
    const mobileButtons = document.querySelectorAll('.mobile-nav-button');
    mobileButtons.forEach(button => {
      const element = button as HTMLElement;
      element.style.transform = '';
      element.style.scale = '';
    });
  }, [location.pathname]);
  return <>
      {/* Desktop Sidebar - Premium Final */}
      <div className="hidden md:flex fixed z-50 w-20 left-1 top-1 bottom-1">
        {/* Container Principal com Profundidade */}
        <div className="w-full flex flex-col bg-white dark:bg-[#1C1F26] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-gray-300/80 dark:border-gray-600/50">
          
          {/* Header com Avatar do Usuário - Nível 1 */}
          <div className="flex items-center justify-center h-20 px-4 border-b border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-b from-gray-50/50 to-white dark:from-transparent dark:to-transparent">
            <UserAvatar
              user={user}
              profile={profile}
              size="md"
              showStatus
              clickable
              onClick={() => setProfileDialogOpen(true)}
            />
          </div>

          {/* Menu Items - Nível 2 com Hierarquia */}
          <div className="flex-1 flex flex-col justify-start py-4 px-3 space-y-2 overflow-y-auto scrollbar-hide">
            <TooltipProvider delayDuration={200}>
              {menuItems.map((item, index) => {
                const isItemActive = isActive(item.url);
                const itemColor = colors[index] || colors[0];
                
                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <NavLink 
                        to={item.url} 
                        end={item.url === "/"}
                        className={cn(
                          "relative flex items-center justify-center h-12 rounded-xl transition-[background-color,box-shadow] duration-300 group",
                          isItemActive 
                            ? `bg-gradient-to-br ${itemColor.bg}`
                            : "bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)]"
                        )}
                        style={isItemActive ? {
                          boxShadow: isDark 
                            ? `0 6px 20px ${itemColor.shadowColor}` 
                            : `0 4px 16px ${itemColor.shadowColor}, 0 2px 8px ${itemColor.shadowColor}`
                        } : undefined}
                      >
                        <item.icon 
                          className={cn(
                            "w-[22px] h-[22px] transition-colors duration-300",
                            isItemActive 
                              ? "text-white" 
                              : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                          )} 
                        />
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      sideOffset={20} 
                      className="font-semibold text-sm px-3.5 py-2 rounded-xl bg-white/95 dark:bg-gray-900/95 text-gray-900 dark:text-white shadow-[0_10px_30px_rgba(15,23,42,0.18)] dark:shadow-[0_10px_30px_rgba(15,23,42,0.35)] border border-white/60 dark:border-gray-700/70 backdrop-blur-xl"
                    >
                      <div className="flex items-center gap-2">
                        <span className="inline-flex h-2 w-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></span>
                        <span className="tracking-wide uppercase text-xs font-bold text-gray-500 dark:text-gray-400">{index + 1}</span>
                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</span>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Premium */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1C1F26]/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-700/40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)] rounded-t-3xl">

        <div className="flex items-center justify-around px-2 py-3 relative">
          {/* Botões principais personalizados */}
          {primaryMobileItems.map((item, index) => {
          const isItemActive = isActive(item.url);
          const itemColor = colors[index % colors.length];
          const isDashboard = item.url === "/";
          const background = isItemActive ? `linear-gradient(135deg, ${itemColor.from}, ${itemColor.to})` : 'transparent';
          const boxShadow = isItemActive ? `0 8px 25px -5px ${itemColor.shadow}, 0 4px 10px -3px ${itemColor.shadow}` : 'none';
          const transform = isItemActive
            ? (isDashboard ? 'translateY(-4px) scale(1.07)' : 'translateY(-2px) scale(1.05)')
            : (isDashboard ? 'translateY(-4px)' : 'none');
          const iconSizeClass = isDashboard ? "w-8 h-8" : "w-7 h-7";
          return <NavLink key={item.title} to={item.url} end={item.url === "/"} className="mobile-nav-button flex flex-col items-center justify-center transition-all duration-200 rounded-2xl group relative overflow-hidden backdrop-blur-sm h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] touch-manipulation active:bg-gray-200" style={{
            background,
            boxShadow,
            transform
          }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>

                <div className={cn("flex items-center justify-center mb-1 relative z-10 transition-all duration-300 rounded-xl",
                  iconSizeClass,
                  isItemActive ? "bg-white/20 backdrop-blur-sm shadow-inner" : "group-hover:bg-white/60 group-hover:shadow-md"
                )}>
                  <item.icon className={cn("w-4 h-4 transition-all duration-200 flex-shrink-0", isItemActive ? "text-white drop-shadow-md" : "text-gray-500 group-hover:text-gray-700")} />
                </div>

                <span className={cn("text-[9px] font-bold text-center leading-tight transition-all duration-300 truncate max-w-[65px] relative z-10 tracking-wide",
                  isItemActive ? "text-white drop-shadow-md" : "text-gray-600 group-hover:text-gray-800 group-hover:font-extrabold"
                )}>
                  {item.title}
                </span>
              </NavLink>;
        })}

          {/* Botão Mais */}
          <MobileMoreButton 
            remainingItems={remainingMobileItems} 
            setProfileDialogOpen={setProfileDialogOpen}
            navigate={navigate}
          />
        </div>
      </div>

      {/* Dialog de Perfil */}
      <UserProfileDialog
        open={profileDialogOpen}
        onOpenChange={setProfileDialogOpen}
      />
    </>;
}