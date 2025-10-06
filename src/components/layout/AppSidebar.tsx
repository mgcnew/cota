import { BarChart3, Package, Building2, FileText, ShoppingCart, History, TrendingUp, Settings, Home, MoreHorizontal } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useState } from "react";
const menuItems = [
  {
    title: "Home",
    url: "/",
    icon: Home,
  },
  {
    title: "Produtos",
    url: "/produtos",
    icon: Package,
  },
  {
    title: "Fornecedores",
    url: "/fornecedores",
    icon: Building2,
  },
  {
    title: "Cotações",
    url: "/cotacoes",
    icon: FileText,
  },
  {
    title: "Pedidos",
    url: "/pedidos",
    icon: ShoppingCart,
  },
  {
    title: "Histórico",
    url: "/historico",
    icon: History,
  },
  {
    title: "Relatórios",
    url: "/relatorios",
    icon: TrendingUp,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Configurações",
    url: "/configuracoes",
    icon: Settings,
  },
];

// Cores para os gradientes dos botões
const colors = [
  'from-blue-500 to-blue-600',
  'from-orange-500 to-amber-500', 
  'from-indigo-500 to-blue-500',
  'from-teal-500 to-cyan-500',
  'from-pink-500 to-rose-500',
  'from-slate-500 to-gray-500',
  'from-purple-500 to-violet-500',
  'from-green-500 to-emerald-500',
  'from-red-500 to-rose-500'
];

// Componente do botão "Mais" para mobile - Versão compacta
function MobileMoreButton({ remainingItems }: { remainingItems: any[] }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex flex-col items-center justify-center transition-all duration-300 rounded-2xl group relative overflow-hidden backdrop-blur-sm h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] text-gray-500 hover:text-gray-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/90 hover:scale-105 hover:shadow-lg active:scale-95 touch-manipulation active:bg-gray-100">
          {/* Efeito de brilho no hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>
          
          {/* Container do ícone com efeito */}
          <div className="flex items-center justify-center mb-1 relative z-10 transition-all duration-300 w-7 h-7 rounded-xl group-hover:bg-white/60 group-hover:shadow-md">
            <MoreHorizontal className="h-4 w-4 transition-all duration-300 flex-shrink-0 text-gray-500 group-hover:text-gray-700 group-hover:scale-110" />
          </div>

          <span className="text-[9px] font-bold text-center leading-tight transition-all duration-300 truncate max-w-[65px] relative z-10 tracking-wide text-gray-600 group-hover:text-gray-800 group-hover:font-extrabold">
            Mais
          </span>
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        side="top" 
        align="center"
        className="w-72 p-3 mb-2 bg-white/95 backdrop-blur-xl border border-gray-200/60 shadow-xl rounded-2xl"
        sideOffset={8}
      >
        {/* Header compacto */}
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-gray-100">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
            <MoreHorizontal className="h-3 w-3 text-white" />
          </div>
          <span className="font-semibold text-sm text-gray-800">Mais Opções</span>
        </div>
        
        {/* Grid compacto de itens */}
        <div className="grid grid-cols-2 gap-2">
          {remainingItems.map((item, index) => {
            const isItemActive = location.pathname === item.url || 
              (item.url === "/" && location.pathname === "/");
            const itemColor = colors[(index + 4) % colors.length];
            
            return (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === "/"}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2 p-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                  isItemActive
                    ? `bg-gradient-to-br ${itemColor} shadow-md text-white`
                    : "bg-gray-50/80 hover:bg-white hover:shadow-md text-gray-700 hover:text-gray-900 border border-gray-100/50 hover:border-gray-200"
                )}
              >
                {/* Ícone compacto */}
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                  isItemActive 
                    ? "bg-white/20 backdrop-blur-sm" 
                    : "bg-white/60 group-hover:bg-white group-hover:shadow-sm"
                )}>
                  <item.icon className={cn(
                    "h-4 w-4 transition-all duration-200",
                    isItemActive 
                      ? "text-white" 
                      : "text-gray-600 group-hover:text-gray-700"
                  )} />
                </div>

                {/* Texto compacto */}
                <span className={cn(
                  "font-medium text-sm transition-all duration-200 truncate",
                  isItemActive 
                    ? "text-white" 
                    : "text-gray-700 group-hover:text-gray-900"
                )}>
                  {item.title}
                </span>
              </NavLink>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  return (
    <>
      {/* Desktop Sidebar - Apenas para desktop */}
      <div className="hidden md:flex w-20 h-screen bg-gradient-to-b from-white via-gray-50 to-slate-100 flex-col z-50 shadow-xl border-r border-gray-200/60">
        {/* Logo com Destaque */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200/60 bg-gradient-to-r from-blue-50/80 to-purple-50/80">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 via-purple-500 to-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20 ring-1 ring-blue-100/50">
            <TrendingUp className="h-4 w-4 text-white" />
          </div>
        </div>

        {/* Menu Items com Hierarquia */}
        <div
          className="flex-1 py-4 px-2 pb-6 overflow-y-auto [&::-webkit-scrollbar]:hidden"
          style={{
            msOverflowStyle: 'none',
            scrollbarWidth: 'none',
          }}
        >
          <TooltipProvider delayDuration={200}>
            <div className="space-y-1">
              {menuItems.map((item, index) => {
                const isItemActive = isActive(item.url);
                
                // Cores diferentes para cada item
                const colors = [
                  { bg: 'from-blue-500 to-blue-600', shadow: 'shadow-blue-500/25' },
                  { bg: 'from-orange-500 to-amber-500', shadow: 'shadow-orange-500/25' },
                  { bg: 'from-indigo-500 to-blue-500', shadow: 'shadow-indigo-500/25' },
                  { bg: 'from-teal-500 to-cyan-500', shadow: 'shadow-teal-500/25' },
                  { bg: 'from-pink-500 to-rose-500', shadow: 'shadow-pink-500/25' },
                  { bg: 'from-slate-500 to-gray-500', shadow: 'shadow-slate-500/25' },
                  { bg: 'from-purple-500 to-violet-500', shadow: 'shadow-purple-500/25' },
                  { bg: 'from-green-500 to-emerald-500', shadow: 'shadow-green-500/25' }
                ];
                
                const itemColor = colors[index] || colors[0];

                return (
                  <Tooltip key={item.title}>
                    <TooltipTrigger asChild>
                      <NavLink
                        to={item.url}
                        end={item.url === "/"}
                        className={cn(
                          "flex flex-col items-center justify-center transition-all duration-200 rounded-xl group relative",
                          "h-14 w-full p-1.5 mx-auto",
                          isItemActive
                            ? `bg-gradient-to-br ${itemColor.bg} shadow-lg ${itemColor.shadow} ring-2 ring-white/50`
                            : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 hover:scale-105"
                        )}
                      >
                        {/* Indicador de ativo */}
                        {isItemActive && (
                          <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1 h-7 bg-blue-600 rounded-r-full shadow-lg"></div>
                        )}
                        
                        {/* Ícone otimizado */}
                        <div className="flex items-center justify-center mb-0.5">
                          <item.icon className={cn(
                            "h-4.5 w-4.5 transition-all duration-300 flex-shrink-0",
                            isItemActive ? "text-white drop-shadow-sm" : "text-gray-500 group-hover:text-gray-700"
                          )} />
                        </div>

                        {/* Nome com espaçamento otimizado */}
                        <span className={cn(
                          "text-[8.5px] font-semibold text-center leading-tight transition-all duration-300",
                          "w-full truncate px-0.5",
                          isItemActive ? "text-white/90 drop-shadow-sm" : "text-gray-600 group-hover:text-gray-800"
                        )}>
                          {item.title}
                        </span>
                      </NavLink>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="right" 
                      className="font-medium bg-white text-gray-900 border-gray-200 shadow-xl"
                    >
                      {item.title}
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
          </TooltipProvider>
        </div>
        
        {/* Rodapé com gradiente */}
        <div className="h-4 bg-gradient-to-t from-gray-100 to-transparent"></div>
      </div>

      {/* Mobile Bottom Navigation com Tema Claro */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-white/96 via-gray-50/96 to-slate-100/96 border-t border-gray-200/50 shadow-2xl backdrop-blur-xl">
        {/* Linha decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-200/60 to-transparent"></div>
        
        <div className="flex items-center justify-around px-2 py-3 relative">
          {/* Botões principais (4 primeiros) */}
          {menuItems.slice(0, 4).map((item, index) => {
            const isItemActive = isActive(item.url);
            const itemColor = colors[index];

            return (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === "/"}
                className={cn(
                  "flex flex-col items-center justify-center transition-all duration-300 rounded-2xl group relative overflow-hidden backdrop-blur-sm active:scale-95",
                  "h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] touch-manipulation",
                  isItemActive
                    ? `bg-gradient-to-br ${itemColor} shadow-xl ring-2 ring-white/60 scale-105 transform`
                    : "text-gray-500 hover:text-gray-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/90 hover:scale-105 hover:shadow-lg active:bg-gray-100"
                )}
              >
                {/* Efeito de brilho no hover */}
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full",
                  isItemActive ? "opacity-30" : "opacity-0 group-hover:opacity-100"
                )}></div>
                
                {/* Indicador superior para ativo */}
                {isItemActive && (
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-white/80 rounded-b-full shadow-lg"></div>
                )}
                
                {/* Container do ícone com efeito */}
                <div className={cn(
                  "flex items-center justify-center mb-1 relative z-10 transition-all duration-300 w-7 h-7 rounded-xl",
                  isItemActive 
                    ? "bg-white/20 backdrop-blur-sm shadow-inner" 
                    : "group-hover:bg-white/60 group-hover:shadow-md"
                )}>
                  <item.icon className={cn(
                    "h-4 w-4 transition-all duration-300 flex-shrink-0",
                    isItemActive 
                      ? "text-white drop-shadow-md" 
                      : "text-gray-500 group-hover:text-gray-700 group-hover:scale-110"
                  )} />
                </div>

                <span className={cn(
                  "text-[9px] font-bold text-center leading-tight transition-all duration-300 truncate max-w-[65px] relative z-10 tracking-wide",
                  isItemActive 
                    ? "text-white/95 drop-shadow-sm font-extrabold" 
                    : "text-gray-600 group-hover:text-gray-800 group-hover:font-extrabold"
                )}>
                  {item.title}
                </span>
              </NavLink>
            );
          })}
          
          {/* Botão Mais */}
          <MobileMoreButton remainingItems={menuItems.slice(4)} />
        </div>
      </div>
    </>
  );
}