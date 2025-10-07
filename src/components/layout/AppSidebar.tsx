import { BarChart3, Package, Building2, FileText, ShoppingCart, History, TrendingUp, Settings, Home, MoreHorizontal } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
// import logoImage from "@/assets/logo.png";
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

// Componente da Logo com fallback robusto - SEM SCROLL
function LogoComponent() {
  const [showFallback, setShowFallback] = useState(false);
  
  return (
    <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
      {!showFallback ? (
        <img 
          src="/logo.png" 
          alt="Logo da Empresa" 
          className="w-12 h-12 object-contain flex-shrink-0"
          onLoad={() => {
            console.log('✅ Logo carregada com sucesso!');
          }}
          onError={(e) => {
            console.log('❌ Logo não carregou, usando fallback');
            setShowFallback(true);
          }}
        />
      ) : (
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-500 to-gray-600 flex items-center justify-center shadow-lg flex-shrink-0">
          <TrendingUp className="h-5 w-5 text-white drop-shadow-sm" />
        </div>
      )}
    </div>
  );
}

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="mobile-nav-button flex flex-col items-center justify-center transition-all duration-200 rounded-2xl group relative overflow-hidden backdrop-blur-sm h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] text-gray-500 hover:text-gray-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/90 hover:shadow-lg touch-manipulation active:bg-gray-200">
          {/* Efeito de brilho no hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full transition-transform duration-700 group-hover:translate-x-full opacity-0 group-hover:opacity-100"></div>
          
          {/* Container do ícone com efeito */}
          <div className="flex items-center justify-center mb-1 relative z-10 transition-all duration-300 w-7 h-7 rounded-xl group-hover:bg-white/60 group-hover:shadow-md">
            <MoreHorizontal className="h-4 w-4 transition-all duration-200 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
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
              <MoreHorizontal className="h-4 w-4 text-white" />
            </div>
            <DialogTitle className="text-lg font-bold bg-gradient-to-r from-blue-900 to-purple-800 bg-clip-text text-transparent">
              Mais Opções
            </DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="p-4">
          {/* Grid de itens */}
          <div className="grid grid-cols-1 gap-3">
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
                  "flex items-center gap-3 p-4 rounded-xl transition-all duration-200 group relative overflow-hidden hover:scale-105 active:scale-95",
                  isItemActive
                    ? `bg-gradient-to-br ${itemColor} shadow-lg text-white ring-2 ring-white/20`
                    : "bg-white/80 hover:bg-white hover:shadow-lg text-gray-700 hover:text-gray-900 border border-gray-200/60 hover:border-blue-300"
                )}
              >
                {/* Ícone */}
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 shadow-lg",
                  isItemActive 
                    ? "bg-white/20 backdrop-blur-sm" 
                    : `bg-gradient-to-br ${itemColor} group-hover:scale-110`
                )}>
                  <item.icon className={cn(
                    "h-5 w-5 transition-all duration-200",
                    isItemActive 
                      ? "text-white" 
                      : "text-white"
                  )} />
                </div>

                {/* Texto */}
                <div className="flex-1 min-w-0">
                  <div className={cn(
                    "font-semibold text-base transition-all duration-200 truncate",
                    isItemActive 
                      ? "text-white" 
                      : "text-gray-900 group-hover:text-blue-900"
                  )}>
                    {item.title}
                  </div>
                  <div className={cn(
                    "text-xs transition-all duration-200 truncate mt-0.5",
                    isItemActive 
                      ? "text-white/80" 
                      : "text-gray-500 group-hover:text-blue-600"
                  )}>
                    Navegar para {item.title}
                  </div>
                </div>
              </NavLink>
            );
          })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  // Reset de transformações ao mudar de página
  useEffect(() => {
    // Força reset de todas as transformações nos botões mobile
    const mobileButtons = document.querySelectorAll('.mobile-nav-button');
    mobileButtons.forEach((button) => {
      const element = button as HTMLElement;
      element.style.transform = '';
      element.style.scale = '';
    });
  }, [location.pathname]);

  return (
    <>
      {/* Desktop Sidebar - Apenas para desktop */}
      <div className="hidden md:flex w-20 h-screen bg-gradient-to-b from-white via-slate-50 to-gray-100 flex-col z-50 shadow-xl border-r border-gray-200/60 overflow-hidden">
        {/* Logo da Empresa */}
        <div className="flex items-center justify-center h-16 border-b border-gray-200/60 bg-gradient-to-r from-slate-50/80 to-gray-50/80 px-2 flex-shrink-0">
          <NavLink 
            to="/" 
            className="w-14 h-14 rounded-xl bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg shadow-gray-500/20 ring-1 ring-gray-100/50 overflow-hidden hover:scale-105 transition-all duration-200 hover:shadow-xl hover:shadow-gray-500/30"
          >
            <LogoComponent />
          </NavLink>
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-white/96 via-slate-50/96 to-gray-100/96 border-t border-gray-200/50 shadow-2xl backdrop-blur-xl">
        {/* Linha decorativa superior */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200/60 to-transparent"></div>
        
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
                  "mobile-nav-button flex flex-col items-center justify-center transition-all duration-200 rounded-2xl group relative overflow-hidden backdrop-blur-sm",
                  "h-14 px-2 py-1.5 min-w-0 flex-1 max-w-[75px] touch-manipulation",
                  isItemActive
                    ? `bg-gradient-to-br ${itemColor} shadow-xl ring-2 ring-white/60`
                    : "text-gray-500 hover:text-gray-700 hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100/90 hover:shadow-lg active:bg-gray-200"
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
                    "h-4 w-4 transition-all duration-200 flex-shrink-0",
                    isItemActive 
                      ? "text-white drop-shadow-md" 
                      : "text-gray-500 group-hover:text-gray-700"
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