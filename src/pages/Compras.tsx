import { useState, useEffect, lazy, Suspense, memo, useMemo, Component } from "react";
import type { ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { ShoppingBag, LayoutList, Loader2, Keyboard, BarChart3, Package } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { designSystem as ds } from "@/styles/design-system";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

class ChunkErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };

  static getDerivedStateFromError(error: Error) {
    const isChunkError =
      error.message.includes('Failed to fetch dynamically imported module') ||
      error.message.includes('Loading chunk') ||
      error.message.includes('Importing a module script failed');
    if (isChunkError && !sessionStorage.getItem('chunk-reload')) {
      sessionStorage.setItem('chunk-reload', '1');
      window.location.reload();
    }
    return { hasError: true };
  }

  componentDidUpdate() {
    if (this.state.hasError) sessionStorage.removeItem('chunk-reload');
  }

  render() {
    if (this.state.hasError) return null;
    return this.props.children;
  }
}

// Lazy load tab contents for better performance
const ProdutosTab = lazy(() => import("@/components/compras/ProdutosTab"));
const AnaliseTab = lazy(() => import("@/components/compras/AnaliseTab"));
const ListaComprasTab = lazy(() => import("@/components/compras/ListaComprasTab"));
const EmbalagensTab = lazy(() => import("@/components/compras/EmbalagensTab"));
const ProcurementCalculator = lazy(() => import("@/components/compras/ProcurementCalculator"));

const TABS = [
  { value: "produtos", icon: LayoutList, label: "Produtos" },
  { value: "embalagens", icon: Package, label: "Embalagens" },
  { value: "analise", icon: BarChart3, label: "Análise" },
  { value: "calculadora", icon: Keyboard, label: "Calculadora" },
];

const TabLoader = () => (
  <div className="flex items-center justify-center py-24">
    <Loader2 className={cn("h-8 w-8 animate-spin", ds.colors.text.primary)} />
  </div>
);

function Compras() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get("tab");
    // redirect legacy tab values
    if (tab === "cotacoes" || tab === "pedidos") return "produtos";
    return tab || "produtos";
  });

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (!tab) return;
    if (tab === "cotacoes" || tab === "pedidos") {
      setActiveTab("produtos");
      setSearchParams({ tab: "produtos" }, { replace: true });
    } else if (TABS.some(t => t.value === tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  const shortcuts = useMemo(() => [
    { key: '1', action: () => activeTab !== 'calculadora' && handleTabChange('produtos'), description: 'Ir para Produtos' },
    { key: '2', action: () => activeTab !== 'calculadora' && handleTabChange('embalagens'), description: 'Ir para Embalagens' },
    { key: '3', action: () => activeTab !== 'calculadora' && handleTabChange('analise'), description: 'Ir para Análise' },
    { key: '4', action: () => handleTabChange('calculadora'), description: 'Ir para Calculadora' },
    {
      key: 'n', ctrl: true,
      action: () => window.dispatchEvent(new CustomEvent('compras:nova', { detail: { tab: activeTab } })),
      description: 'Nova cotação/pedido'
    },
    {
      key: 'f', ctrl: true,
      action: () => (document.querySelector('[data-search-input]') as HTMLInputElement)?.focus(),
      description: 'Buscar'
    },
  ], [activeTab]);

  useKeyboardShortcuts({ shortcuts });

  return (
    <PageWrapper>
      <div className={ds.layout.container.page}>
        {/* Page Header */}
        <div className="flex items-center gap-3 pb-5 border-b border-border dark:border-zinc-800">
          <div className={cn("hidden sm:flex p-2.5 rounded-xl border transition-all", ds.components.card.root)}>
            <ShoppingBag className="h-5 w-5 text-brand" />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-foreground leading-tight">Compras</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Gerencie cotações e pedidos de compra</p>
          </div>
        </div>

        {/* Desktop Tab Bar */}
        <div className="hidden md:block mb-8">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList variant="line" className="overflow-x-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none' }}>
              {TABS.map((tab) => (
                <TabsTrigger key={tab.value} value={tab.value} variant="line" className="gap-2 px-5 py-3">
                  <tab.icon className={cn(
                    "h-3.5 w-3.5 transition-colors duration-150",
                    activeTab === tab.value ? "text-brand" : "opacity-40"
                  )} />
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>

        {/* Tab Content */}
        <ChunkErrorBoundary>
          <Suspense fallback={<TabLoader />}>
            <div key={activeTab} className="animate-page-enter">
              {activeTab === "produtos" && <ProdutosTab />}
              {activeTab === "analise" && <AnaliseTab />}
              {activeTab === "lista" && <ListaComprasTab />}
              {activeTab === "embalagens" && <EmbalagensTab />}
              {activeTab === "calculadora" && <ProcurementCalculator />}
            </div>
          </Suspense>
        </ChunkErrorBoundary>
      </div>
    </PageWrapper>
  );
}

export default memo(Compras);
