import { useState, useEffect, lazy, Suspense, memo, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, FileText, ShoppingCart, Loader2, Keyboard, BarChart3, ShoppingBasket, Package } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useKeyboardShortcuts, formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";

// Lazy load tab contents for better performance
const CotacoesTab = lazy(() => import("@/components/compras/CotacoesTab"));
const PedidosTab = lazy(() => import("@/components/compras/PedidosTab"));
const AnaliseTab = lazy(() => import("@/components/compras/AnaliseTab"));
const ListaComprasTab = lazy(() => import("@/components/compras/ListaComprasTab"));
const EmbalagensTab = lazy(() => import("@/components/compras/EmbalagensTab"));
const ProcurementCalculator = lazy(() => import("@/components/compras/ProcurementCalculator"));
const TABS = [
  { value: "cotacoes", icon: FileText, label: "Cotações" },
  { value: "pedidos", icon: ShoppingCart, label: "Pedidos" },
  { value: "lista", icon: ShoppingBasket, label: "Lista" },
  { value: "embalagens", icon: Package, label: "Embalagens" },
  { value: "analise", icon: BarChart3, label: "Análise" },
  { value: "calculadora", icon: Keyboard, label: "Calculadora" }
];

const TabLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className={cn("h-8 w-8 animate-spin", ds.colors.text.primary)} />
  </div>
);

function Compras() {
  const [searchParams, setSearchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get("tab") || "cotacoes";
  });

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && TABS.some(t => t.value === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  // Atalhos de teclado
  const shortcuts = useMemo(() => [
    {
      key: '1',
      action: () => activeTab !== 'calculadora' && handleTabChange('cotacoes'),
      description: 'Ir para Cotações'
    },
    {
      key: '2',
      action: () => activeTab !== 'calculadora' && handleTabChange('pedidos'),
      description: 'Ir para Pedidos'
    },
    {
      key: '3',
      action: () => activeTab !== 'calculadora' && handleTabChange('lista'),
      description: 'Ir para Lista'
    },
    {
      key: '4',
      action: () => activeTab !== 'calculadora' && handleTabChange('embalagens'),
      description: 'Ir para Embalagens'
    },
    {
      key: '5',
      action: () => activeTab !== 'calculadora' && handleTabChange('analise'),
      description: 'Ir para Análise'
    },
    {
      key: '6',
      action: () => handleTabChange('calculadora'),
      description: 'Ir para Calculadora'
    },
    {
      key: 'n',
      ctrl: true,
      action: () => {
        const event = new CustomEvent('compras:nova', { detail: { tab: activeTab } });
        window.dispatchEvent(event);
      },
      description: 'Nova cotação/pedido'
    },
    {
      key: 'f',
      ctrl: true,
      action: () => {
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      },
      description: 'Buscar'
    }
  ], [activeTab]);

  useKeyboardShortcuts({ shortcuts });

  return (
    <PageWrapper>
      {/* Mobile Bottom Navigation Bar */}
      {isMobile && (
        <div className={cn(
          "md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#16181C]/95 backdrop-blur-xl border-t border-zinc-200 dark:border-zinc-800/50 pb-safe shadow-[0_-4px_24px_-8px_rgba(0,0,0,0.15)]",
        )}>
          <div className="flex items-center justify-between px-2 py-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.value;
              return (
                <button
                  key={tab.value}
                  onClick={() => handleTabChange(tab.value)}
                  className={cn(
                    "relative flex items-center justify-center gap-2 h-12 transition-all duration-300 rounded-full touch-manipulation",
                    isActive 
                      ? "bg-brand text-white px-4 flex-1 shadow-md" 
                      : "text-zinc-500 hover:text-brand dark:text-zinc-400 dark:hover:text-zinc-100 px-3 flex-shrink-0"
                  )}
                  aria-label={tab.label}
                >
                  <tab.icon className={cn("h-[18px] w-[18px] shrink-0 transition-transform duration-300", isActive && "scale-110")} />
                  {isActive && (
                    <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap animate-in fade-in slide-in-from-left-2 duration-300">
                      {tab.label}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className={cn(ds.layout.container.page, "animate-in fade-in zoom-in-95 duration-500", isMobile ? "pb-24" : "")}>
        {/* Page Header - Standardized with Dashboard Style */}
        <div className="flex flex-col gap-4 md:gap-6 mb-4 md:mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-3">
              <div className={cn("hidden sm:flex p-2.5 rounded-xl border transition-all", ds.components.card.root)}>
                <ShoppingBag className="h-6 w-6 text-brand" />
              </div>
              <div>
                <h1 className={cn(ds.typography.size.xl, "md:text-[22px] font-bold text-foreground")}>
                  Compras
                </h1>
                <p className={cn(ds.colors.text.secondary, "text-xs md:text-sm mt-0.5")}>
                  Gerencie cotações e pedidos de compra
                </p>
              </div>
            </div>

            {!isMobile && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className={ds.components.button.ghost}>
                      <Keyboard className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className={ds.components.tooltip.content}>
                    <p className="font-semibold text-xs mb-2">Atalhos de teclado:</p>
                    <ul className="text-xs space-y-1">
                      {shortcuts.map((s, i) => (
                        <li key={i} className="flex justify-between gap-3">
                          <span className={ds.colors.text.secondary}>{s.description}</span>
                          <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{formatShortcut(s)}</kbd>
                        </li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          {/* Desktop Tabs Navigation (Hidden on Mobile) */}
          <div className="hidden md:block pb-1 border-b border-zinc-200/70 dark:border-zinc-800 bg-transparent">
            <TabsList className={ds.components.tabs.clean.list}>
              {TABS.map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={ds.components.tabs.clean.trigger}
                >
                  <tab.icon className={cn("h-4 w-4 mr-2", activeTab === tab.value ? "text-brand" : "opacity-70")} />
                  {tab.label}
                  {activeTab === tab.value && (
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2.5px] bg-brand shadow-[0_0_12px_hsl(var(--brand)/0.5)] rounded-full transition-all" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-6 md:mt-6 overflow-hidden">
            <Suspense fallback={<TabLoader />}>
              <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 md:slide-in-from-right-4 duration-300 ease-out fill-mode-forwards">
                {activeTab === "cotacoes" && <CotacoesTab />}
                {activeTab === "pedidos" && <PedidosTab />}
                {activeTab === "analise" && <AnaliseTab />}
                {activeTab === "lista" && <ListaComprasTab />}
                {activeTab === "embalagens" && <EmbalagensTab />}
                {activeTab === "calculadora" && <ProcurementCalculator />}
              </div>
            </Suspense>
          </div>
        </Tabs>
      </div>
    </PageWrapper>
  );
}

export default memo(Compras);


