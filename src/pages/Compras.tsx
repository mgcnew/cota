import { useState, useEffect, lazy, Suspense, memo } from "react";
import { useSearchParams } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingBag, FileText, ShoppingCart, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/ui/page-header";

// Lazy load tab contents for better performance
const CotacoesTab = lazy(() => import("@/components/compras/CotacoesTab"));
const PedidosTab = lazy(() => import("@/components/compras/PedidosTab"));

const TabLoader = () => (
  <div className="flex items-center justify-center py-12">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

function Compras() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    return searchParams.get("tab") || "cotacoes";
  });

  // Sync tab with URL
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && (tab === "cotacoes" || tab === "pedidos")) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value });
  };

  return (
    <PageWrapper>
      <div className="page-container">
        {/* Tabs minimalistas */}
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                <ShoppingBag className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900 dark:text-white">Compras</h1>
              </div>
            </div>
            
            <TabsList className="h-9 p-0.5 bg-muted/60 rounded-lg">
              <TabsTrigger 
                value="cotacoes" 
                className="h-8 px-3 text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md"
              >
                <FileText className="h-3.5 w-3.5 mr-1.5" />
                Cotações
              </TabsTrigger>
              <TabsTrigger 
                value="pedidos"
                className="h-8 px-3 text-xs font-medium data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:shadow-sm rounded-md"
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1.5" />
                Pedidos
              </TabsTrigger>
            </TabsList>
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
        </Tabs>
      </div>
    </PageWrapper>
  );
}

export default memo(Compras);
