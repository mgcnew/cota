import { Icon } from '@iconify/react';
import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// Logo Component
function LogoComponent() {
  return <div className="w-10 h-10 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-lg flex items-center justify-center shadow-lg relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-lg"></div>
      <div className="relative z-10 font-bold text-white text-lg tracking-tight">
        B
      </div>
    </div>;
}

// Menu items com ícones coloridos do Iconify
const menuItems = [{
  title: "Dashboard",
  url: "/",
  icon: "fluent:home-32-filled"
}, {
  title: "Produtos",
  url: "/produtos",
  icon: "fluent:box-32-filled"
}, {
  title: "Fornecedores",
  url: "/fornecedores",
  icon: "fluent:building-32-filled"
}, {
  title: "Cotações",
  url: "/cotacoes",
  icon: "fluent:document-text-32-filled"
}, {
  title: "Pedidos",
  url: "/pedidos",
  icon: "fluent:shopping-bag-32-filled"
}, {
  title: "Histórico",
  url: "/historico",
  icon: "fluent:history-32-filled"
}, {
  title: "Relatórios",
  url: "/relatorios",
  icon: "fluent:data-bar-vertical-32-filled"
}, {
  title: "Analytics",
  url: "/analytics",
  icon: "fluent:data-trending-32-filled"
}, {
  title: "Locuções AI",
  url: "/locucoes",
  icon: "fluent:mic-sparkle-32-filled"
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
function MobileMoreButton({
  remainingItems
}: {
  remainingItems: any[];
}) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  return <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mobile-nav-button flex flex-col items-center justify-center transition-all duration-200 rounded-2xl group relative overflow-hidden backdrop-blur-sm h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] text-gray-500 hover:text-gray-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/90 hover:shadow-lg touch-manipulation active:bg-gray-200">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>

          <div className="flex items-center justify-center mb-1 relative z-10 transition-all duration-300 w-7 h-7 rounded-xl group-hover:bg-white/60 group-hover:shadow-md">
            <Icon icon="fluent:more-horizontal-32-filled" width="16" height="16" className="transition-all duration-200 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
          </div>

          <span className="text-[9px] font-bold text-center leading-tight transition-all duration-300 truncate max-w-[65px] relative z-10 tracking-wide text-gray-600 group-hover:text-gray-800 group-hover:font-extrabold">
            Mais
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="w-[90vw] max-w-md p-0 border-0 shadow-2xl rounded-2xl bg-white/95 backdrop-blur-xl">
        <DialogHeader className="px-4 py-3 border-b border-gray-100/60 bg-gradient-to-r from-blue-50/80 to-purple-50/80">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg">
              <Icon icon="fluent:more-horizontal-32-filled" width="16" height="16" className="text-white" />
            </div>
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-blue-900 to-purple-800 bg-clip-text text-transparent">
              Mais OpÃ§Ãµes
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="p-4 max-h-[70vh] overflow-y-auto">
          {/* Seção Principal - Navegação */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
              Navegação
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {remainingItems.map((item, index) => {
              const isItemActive = location.pathname === item.url || item.url === "/" && location.pathname === "/";
              const itemColor = colors[(index + 4) % colors.length];
              return <NavLink key={item.title} to={item.url} end={item.url === "/"} onClick={() => setOpen(false)} className={cn("flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden hover:scale-[1.02] active:scale-95", isItemActive ? `bg-gradient-to-br ${itemColor.bg} shadow-lg text-white ring-2 ring-white/20 dark:ring-white/10` : "bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-700/80 hover:shadow-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-gray-700/60 hover:border-blue-300 dark:hover:border-blue-500")}>
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 shadow-sm", isItemActive ? "bg-white/20 backdrop-blur-sm" : `bg-gradient-to-br ${itemColor.bg} group-hover:scale-110`)}>
                      <Icon icon={item.icon} width="16" height="16" className="transition-all duration-200 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={cn("font-medium text-sm transition-all duration-200 truncate", isItemActive ? "text-white" : "text-gray-900 dark:text-gray-200 group-hover:text-blue-900 dark:group-hover:text-blue-300")}>
                        {item.title}
                      </div>
                    </div>
                  </NavLink>;
            })}
            </div>
          </div>

          {/* Seção Ações Rápidas */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
              Ações Rápidas
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => {
              setOpen(false);
              window.location.href = '/cotacoes';
            }} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95">
                <Icon icon="fluent:document-text-32-filled" width="20" height="20" />
                <span className="text-xs font-medium">Nova Cotação</span>
              </button>

              <button onClick={() => {
              setOpen(false);
              window.location.href = '/relatorios';
            }} className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 active:scale-95">
                <Icon icon="fluent:data-bar-vertical-32-filled" width="20" height="20" />
                <span className="text-xs font-medium">Relatório</span>
              </button>
            </div>
          </div>

          {/* Seção Configurações */}
          <div>
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3 px-1">
              Sistema
            </h3>
            <div className="space-y-2">
              <button onClick={() => {
              setOpen(false);
              window.location.href = '/configuracoes';
            }} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 hover:shadow-md text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white border border-gray-200/60 dark:border-gray-700/60 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-200 hover:scale-[1.02] active:scale-95">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-500 to-gray-600 flex items-center justify-center shadow-sm">
                  <Icon icon="fluent:settings-32-filled" width="16" height="16" className="text-white" />
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
export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;
  const [isScrolled, setIsScrolled] = useState(false);

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
        <div className="w-full flex flex-col bg-white dark:bg-[#1C1F26] rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] dark:shadow-[0_8px_30px_rgba(0,0,0,0.4)] border border-gray-300/80 dark:border-gray-600/50 overflow-hidden">
          
          {/* Header com Logo - Nível 1 */}
          <div className="flex items-center justify-center h-20 px-4 border-b border-gray-200/60 dark:border-gray-700/30 bg-gradient-to-b from-gray-50/50 to-white dark:from-transparent dark:to-transparent">
            <NavLink 
              to="/" 
              className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-[0_4px_12px_rgba(99,102,241,0.3)] dark:shadow-[0_4px_16px_rgba(99,102,241,0.4)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.4)] dark:hover:shadow-[0_6px_24px_rgba(99,102,241,0.5)] hover:scale-105 transition-all duration-300 relative overflow-hidden group"
            >
              {/* Efeito de brilho no hover */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 font-bold text-white text-xl tracking-tight drop-shadow-lg">
                B
              </div>
            </NavLink>
          </div>

          {/* Menu Items - Nível 2 com Hierarquia */}
          <div className="flex-1 flex flex-col justify-start py-4 px-3 space-y-2">
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
                          "relative flex items-center justify-center h-12 rounded-xl transition-all duration-300 group",
                          isItemActive 
                            ? `bg-gradient-to-br ${itemColor.bg} shadow-[0_4px_16px_${itemColor.shadowColor},0_2px_8px_${itemColor.shadowColor}] dark:shadow-[0_6px_20px_${itemColor.shadowColor}] scale-105` 
                            : "bg-gray-100 dark:bg-gray-800/40 hover:bg-gray-200 dark:hover:bg-gray-700/60 shadow-[0_1px_3px_rgba(0,0,0,0.08)] dark:shadow-none hover:shadow-[0_2px_8px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:scale-105"
                        )}
                      >
                        {/* Indicador lateral premium */}
                        {isItemActive && (
                          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-6 bg-white rounded-r-full shadow-[0_0_8px_rgba(255,255,255,0.6)]"></div>
                        )}
                        
                        {/* Ícone com profundidade */}
                        <div className={cn(
                          "flex items-center justify-center transition-all duration-300",
                          isItemActive && "drop-shadow-[0_2px_4px_rgba(0,0,0,0.2)]"
                        )}>
                          <Icon 
                            icon={item.icon} 
                            className={cn(
                              "transition-all duration-300",
                              isItemActive 
                                ? "text-white" 
                                : "text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-white"
                            )} 
                            width="22" 
                            height="22" 
                          />
                        </div>
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      sideOffset={20} 
                      className="font-semibold text-sm bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-0 shadow-[0_4px_16px_rgba(0,0,0,0.2)] dark:shadow-[0_4px_16px_rgba(255,255,255,0.2)] px-3 py-2 rounded-lg"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </TooltipProvider>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation - Premium */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#1C1F26]/95 backdrop-blur-xl border-t border-gray-200/60 dark:border-gray-700/40 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.3)]">

        <div className="flex items-center justify-around px-2 py-3 relative">
          {/* BotÃµes principais (4 primeiros) */}
          {menuItems.slice(0, 4).map((item, index) => {
          const isItemActive = isActive(item.url);
          const itemColor = colors[index];
          return <NavLink key={item.title} to={item.url} end={item.url === "/"} className="mobile-nav-button flex flex-col items-center justify-center transition-all duration-200 rounded-2xl group relative overflow-hidden backdrop-blur-sm h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] touch-manipulation active:bg-gray-200" style={{
            background: isItemActive ? `linear-gradient(135deg, ${itemColor.from}, ${itemColor.to})` : 'transparent',
            boxShadow: isItemActive ? `0 8px 25px -5px ${itemColor.shadow}, 0 4px 10px -3px ${itemColor.shadow}` : 'none',
            transform: isItemActive ? 'translateY(-2px) scale(1.05)' : 'none'
          }}>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>

                <div className={cn("flex items-center justify-center mb-1 relative z-10 transition-all duration-300 w-7 h-7 rounded-xl", isItemActive ? "bg-white/20 backdrop-blur-sm shadow-inner" : "group-hover:bg-white/60 group-hover:shadow-md")}>
                  <Icon icon={item.icon} width="16" height="16" className={cn("transition-all duration-200 flex-shrink-0", isItemActive ? "text-white drop-shadow-md" : "text-gray-500 group-hover:text-gray-700")} />
                </div>

                <span className={cn("text-[9px] font-bold text-center leading-tight transition-all duration-300 truncate max-w-[65px] relative z-10 tracking-wide", isItemActive ? "text-white drop-shadow-md" : "text-gray-600 group-hover:text-gray-800 group-hover:font-extrabold")}>
                  {item.title}
                </span>
              </NavLink>;
        })}

          {/* BotÃ£o Mais */}
          <MobileMoreButton remainingItems={menuItems.slice(4)} />
        </div>
      </div>
    </>;
}