import { useState, useEffect, lazy, Suspense, memo, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, FileText, ShoppingCart, Loader2, Keyboard, BarChart3, ShoppingBasket, Package } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";
import { useKeyboardShortcuts, formatShortcut } from "@/hooks/useKeyboardShortcuts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy load tab contents for better performance
const CotacoesTab = lazy(() => import("@/components/compras/CotacoesTab"));
const PedidosTab = lazy(() => import("@/components/compras/PedidosTab"));
const AnaliseTab = lazy(() => import("@/components/compras/AnaliseTab"));
const ListaComprasTab = lazy(() => import("@/components/compras/ListaComprasTab"));
const EmbalagensTab = lazy(() => import("@/components/compras/EmbalagensTab"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
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
        // Dispara evento customizado para abrir dialog de nova cotação/pedido
        const event = new CustomEvent('compras:nova', { detail: { tab: activeTab } });
        window.dispatchEvent(event);
      },
      description: 'Nova cotação/pedido'
    },
    {
      key: 'f',
      ctrl: true,
      action: () => {
        // Foca no campo de busca
        const searchInput = document.querySelector('[data-search-input]') as HTMLInputElement;
        if (searchInput) searchInput.focus();
      },
      description: 'Buscar'
    }
  ], [activeTab]);

  useKeyboardShortcuts({ shortcuts });

  return (
    <PageWrapper>
      <div className="page-container">
        {/* Tabs minimalistas */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          {/* Header - Mobile: empilhado, Desktop: lado a lado */}
          <div className={`flex ${isMobile ? 'flex-col gap-3' : 'items-center justify-between'} mb-4`}>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Compras</h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Indicador de atalhos - apenas desktop */}
              {!isMobile && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                        <Keyboard className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[200px]">
                      <p className="font-semibold text-xs mb-2">Atalhos de teclado:</p>
                      <ul className="text-xs space-y-1">
                        {shortcuts.map((s, i) => (
                          <li key={i} className="flex justify-between gap-3">
                            <span className="text-muted-foreground">{s.description}</span>
                            <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">{formatShortcut(s)}</kbd>
                          </li>
                        ))}
                      </ul>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              
              {/* Tabs - Mobile: scroll horizontal, Desktop: inline */}
              <div className={isMobile ? 'w-full overflow-x-auto scrollbar-hide -mx-1 px-1' : ''}>
                <TabsList className={`h-9 p-0.5 bg-muted/60 rounded-lg ${isMobile ? 'w-max' : ''}`}>
                  <TabsTrigger 
                    value="cotacoes" 
                    className={`h-8 ${isMobile ? 'px-2.5 text-[11px]' : 'px-3 text-xs'} font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md`}
                  >
                    <FileText className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-3.5 w-3.5 mr-1.5'}`} />
                    Cotações
                  </TabsTrigger>
                  <TabsTrigger 
                    value="pedidos"
                    className={`h-8 ${isMobile ? 'px-2.5 text-[11px]' : 'px-3 text-xs'} font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md`}
                  >
                    <ShoppingCart className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-3.5 w-3.5 mr-1.5'}`} />
                    Pedidos
                  </TabsTrigger>
                  <TabsTrigger 
                    value="lista"
                    className={`h-8 ${isMobile ? 'px-2.5 text-[11px]' : 'px-3 text-xs'} font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md`}
                  >
                    <ShoppingBasket className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-3.5 w-3.5 mr-1.5'}`} />
                    Lista
                  </TabsTrigger>
                  <TabsTrigger 
                    value="embalagens"
                    className={`h-8 ${isMobile ? 'px-2.5 text-[11px]' : 'px-3 text-xs'} font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md`}
                  >
                    <Package className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-3.5 w-3.5 mr-1.5'}`} />
                    Embalagens
                  </TabsTrigger>
                  <TabsTrigger 
                    value="analise"
                    className={`h-8 ${isMobile ? 'px-2.5 text-[11px]' : 'px-3 text-xs'} font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md`}
                  >
                    <BarChart3 className={`${isMobile ? 'h-3 w-3 mr-1' : 'h-3.5 w-3.5 mr-1.5'}`} />
                    Análise
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>
          </div>

          <TabsContent value="cotacoes" className="mt-0">
            <Suspense fallback={<TabLoader />}>
              <CotacoesTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="pedidos" className="mt-0">
            <Suspense fallback={<TabLoader />}>
              <PedidosTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="analise" className="mt-0">
            <Suspense fallback={<TabLoader />}>
              <AnaliseTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="lista" className="mt-0">
            <Suspense fallback={<TabLoader />}>
              <ListaComprasTab />
            </Suspense>
          </TabsContent>

          <TabsContent value="embalagens" className="mt-0">
            <Suspense fallback={<TabLoader />}>
              <EmbalagensTab />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </PageWrapper>
  );
}

export default memo(Compras);
