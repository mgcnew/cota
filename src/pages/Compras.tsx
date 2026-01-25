import { useState, useEffect, lazy, Suspense, memo, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, FileText, ShoppingCart, Loader2, Keyboard, BarChart3, ShoppingBasket, Package } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useKeyboardShortcuts, formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { designSystem } from "@/styles/design-system";
import { cn } from "@/lib/utils";

// Lazy load tab contents for better performance
const CotacoesTab = lazy(() => import("@/components/compras/CotacoesTab"));
const PedidosTab = lazy(() => import("@/components/compras/PedidosTab"));
const AnaliseTab = lazy(() => import("@/components/compras/AnaliseTab"));
const ListaComprasTab = lazy(() => import("@/components/compras/ListaComprasTab"));
const EmbalagensTab = lazy(() => import("@/components/compras/EmbalagensTab"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className={cn("h-8 w-8 animate-spin", designSystem.colors.text.primary)} />
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
    if (tab && (tab === "cotacoes" || tab === "pedidos" || tab === "analise" || tab === "lista" || tab === "embalagens")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  // Atalhos de teclado
  const shortcuts = useMemo(() => [
    {
      key: '1',
      action: () => handleTabChange('cotacoes'),
      description: 'Ir para Cotações'
    },
    {
      key: '2',
      action: () => handleTabChange('pedidos'),
      description: 'Ir para Pedidos'
    },
    {
      key: '3',
      action: () => handleTabChange('lista'),
      description: 'Ir para Lista'
    },
    {
      key: '4',
      action: () => handleTabChange('embalagens'),
      description: 'Ir para Embalagens'
    },
    {
      key: '5',
      action: () => handleTabChange('analise'),
      description: 'Ir para Análise'
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
      <div className={designSystem.layout.container.page}>
        {/* Header da Página */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className={cn("p-2.5 rounded-xl border transition-all", designSystem.components.card.root)}>
              <ShoppingBag className="h-6 w-6 text-[#83E509]" />
            </div>
            <h1 className={cn(designSystem.typography.size["2xl"], designSystem.typography.weight.bold, designSystem.colors.text.primary)}>
              Compras
            </h1>
          </div>

          {!isMobile && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className={designSystem.components.button.ghost}>
                    <Keyboard className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className={designSystem.components.tooltip.content}>
                  <p className="font-semibold text-xs mb-2">Atalhos de teclado:</p>
                  <ul className="text-xs space-y-1">
                    {shortcuts.map((s, i) => (
                      <li key={i} className="flex justify-between gap-3">
                        <span className={designSystem.colors.text.secondary}>{s.description}</span>
                        <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{formatShortcut(s)}</kbd>
                      </li>
                    ))}
                  </ul>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
          {/* Tabs - Estilizadas conforme Design System Clean */}
          <div className={cn(
            "pb-1 border-b !bg-transparent !bg-none",
            designSystem.colors.border.subtle,
            isMobile ? "sticky top-0 z-10 bg-background/95 backdrop-blur-sm -mx-4 px-4 overflow-x-auto scrollbar-none" : ""
          )}>
            <TabsList className={designSystem.components.tabs.clean.list}>
              {[
                { value: "cotacoes", icon: FileText, label: "Cotações" },
                { value: "pedidos", icon: ShoppingCart, label: "Pedidos" },
                { value: "lista", icon: ShoppingBasket, label: "Lista" },
                { value: "embalagens", icon: Package, label: "Embalagens" },
                { value: "analise", icon: BarChart3, label: "Análise" }
              ].map((tab) => (
                <TabsTrigger
                  key={tab.value}
                  value={tab.value}
                  className={designSystem.components.tabs.clean.trigger}
                >
                  <tab.icon className={cn("h-4 w-4 mr-2", activeTab === tab.value ? "text-[#83E509]" : "opacity-70")} />
                  {tab.label}
                  {activeTab === tab.value && (
                    <div className="absolute bottom-[-2px] left-0 right-0 h-[2.5px] bg-[#83E509] shadow-[0_0_12px_rgba(131,229,9,0.5)] rounded-full transition-all" />
                  )}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <div className="mt-6">
            <Suspense fallback={<TabLoader />}>
              {activeTab === "cotacoes" && <CotacoesTab />}
              {activeTab === "pedidos" && <PedidosTab />}
              {activeTab === "analise" && <AnaliseTab />}
              {activeTab === "lista" && <ListaComprasTab />}
              {activeTab === "embalagens" && <EmbalagensTab />}
            </Suspense>
          </div>
        </Tabs>
      </div>
    </PageWrapper>
  );
}

export default memo(Compras);

