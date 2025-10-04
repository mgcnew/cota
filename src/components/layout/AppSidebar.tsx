import { BarChart3, Package, Building2, FileText, ShoppingCart, History, TrendingUp, Settings, Home } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
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
];
export function AppSidebar() {
  const location = useLocation();
  const currentPath = location.pathname;
  const isActive = (path: string) => currentPath === path;

  return (
    <>
      {/* Desktop Sidebar com Tema Claro */}
      <div className="w-20 h-screen bg-gradient-to-b from-white via-gray-50 to-slate-100 flex-col z-50 shadow-xl border-r border-gray-200/60">
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-gradient-to-r from-white via-gray-50 to-slate-100 border-t border-gray-200/60 shadow-2xl">
        <div className="flex items-center justify-around px-2 py-3">
          {menuItems.slice(0, 5).map((item, index) => {
            const isItemActive = isActive(item.url);
            
            const colors = [
              'from-blue-500 to-blue-600',
              'from-orange-500 to-amber-500', 
              'from-indigo-500 to-blue-500',
              'from-teal-500 to-cyan-500',
              'from-pink-500 to-rose-500'
            ];

            return (
              <NavLink
                key={item.title}
                to={item.url}
                end={item.url === "/"}
                className={cn(
                  "flex flex-col items-center justify-center transition-all duration-200 rounded-lg relative",
                  "h-12 px-1.5 py-1 min-w-0 flex-1 max-w-[70px]",
                  isItemActive
                    ? `bg-gradient-to-br ${colors[index]} shadow-md ring-1 ring-white/50`
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-100/80"
                )}
              >
                {/* Indicador superior para ativo */}
                {isItemActive && (
                  <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-b-full"></div>
                )}
                
                <div className="flex items-center justify-center mb-0.5">
                  <item.icon className={cn(
                    "h-3.5 w-3.5 transition-all duration-200 flex-shrink-0",
                    isItemActive ? "text-white" : "text-gray-500"
                  )} />
                </div>
                <span className={cn(
                  "text-[10px] font-medium text-center leading-tight transition-all duration-200 truncate max-w-[60px]",
                  isItemActive ? "text-white/95" : "text-gray-600"
                )}>
                  {item.title}
                </span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </>
  );
}