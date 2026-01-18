import { useState, useMemo, Suspense, lazy, useCallback } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ClipboardList, X, Package, DollarSign, ShoppingCart, Settings, Download, Loader2 } from "lucide-react";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

// Lazy loading dos componentes das abas
const QuoteSummaryTab = lazy(() => import("@/components/cotacoes/view-dialog/QuoteSummaryTab").then(m => ({ default: m.QuoteSummaryTab })));
const QuoteValuesTab = lazy(() => import("@/components/cotacoes/view-dialog/QuoteValuesTab").then(m => ({ default: m.QuoteValuesTab })));
const QuoteConversionTab = lazy(() => import("@/components/cotacoes/view-dialog/QuoteConversionTab").then(m => ({ default: m.QuoteConversionTab })));
const QuoteEditTab = lazy(() => import("@/components/cotacoes/view-dialog/QuoteEditTab").then(m => ({ default: m.QuoteEditTab })));
const QuoteExportTab = lazy(() => import("@/components/cotacoes/view-dialog/QuoteExportTab").then(m => ({ default: m.QuoteExportTab })));

interface GerenciarCotacaoDialogProps {
  quote: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GerenciarCotacaoDialog({ quote: initialQuote, open, onOpenChange }: GerenciarCotacaoDialogProps) {
  if (!initialQuote) return null;

  const [activeTab, setActiveTab] = useState("resumo");
  const { 
    cotacoes, // Get full list to find latest version
    updateQuoteItemPrice, 
    produtos: availableProducts, 
    fornecedores: availableSuppliers,
    addQuoteItem,
    removeQuoteItem,
    addQuoteSupplier,
    removeQuoteSupplier,
    convertToOrder
  } = useCotacoes();

  // Find the latest version of this quote from the global state
  const quote = useMemo(() => {
    return cotacoes.find((c: any) => c.id === initialQuote.id) || initialQuote;
  }, [cotacoes, initialQuote]);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();

  // Memos globais para evitar recálculos
  const products = useMemo(() => {
    const rawItems = quote._raw?.quote_items || [];
    return rawItems.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantidade: item.quantidade,
      unidade: item.unidade
    }));
  }, [quote._raw]);

  const fornecedores = useMemo(() => {
    const rawSuppliers = quote._raw?.quote_suppliers || [];
    return rawSuppliers.map((cf: any) => ({
      id: cf.supplier_id,
      nome: cf.supplier_name,
      status: cf.status
    }));
  }, [quote._raw]);

  const supplierItems = useMemo(() => {
    return quote._supplierItems || [];
  }, [quote._supplierItems, quote]); // Add quote to dependency to force re-calc

  // Helpers
  const safeStr = useCallback((val: any) => val || "", []);

  const getSupplierProductValue = useCallback((supplierId: string, productId: string) => {
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    return item?.valor_oferecido || 0;
  }, [supplierItems]);

  const getBestPriceInfoForProduct = useCallback((productId: string) => {
    let bestPrice = Infinity;
    let bestSupplierId = null;
    let bestSupplierName = "";
    
    // Filtra apenas preços > 0
    const validPrices = supplierItems.filter((i: any) => i?.product_id === productId && i?.valor_oferecido > 0);
    
    if (validPrices.length > 0) {
      validPrices.forEach((priceItem: any) => {
        if (priceItem.valor_oferecido < bestPrice) {
          bestPrice = priceItem.valor_oferecido;
          bestSupplierId = priceItem.supplier_id;
          const supplier = fornecedores.find((f: any) => f.id === priceItem.supplier_id);
          bestSupplierName = supplier ? supplier.nome : "";
        }
      });
    } else {
      bestPrice = 0;
    }
    
    return { bestPrice, bestSupplierId, bestSupplierName };
  }, [supplierItems, fornecedores]);

  // Cálculos para o Resumo
  const stats = useMemo(() => {
    const totalProdutos = products.length;
    const totalFornecedores = fornecedores.length;
    const fornecedoresRespondidos = fornecedores.filter((f: any) => f.status === 'respondido').length;
    
    let melhorTotal = 0;
    let melhorFornecedor = "";
    
    // Lógica simplificada para melhor fornecedor total (se necessário)
    
    return {
      totalProdutos,
      totalFornecedores,
      fornecedoresRespondidos,
      melhorValor: melhorTotal,
      melhorFornecedor
    };
  }, [products, fornecedores]);

  const melhorTotal = useMemo(() => {
    return products.reduce((total: number, product: any) => {
      const { bestPrice } = getBestPriceInfoForProduct(product.product_id);
      return total + bestPrice;
    }, 0);
  }, [products, getBestPriceInfoForProduct]);

  const productPricesData = useMemo(() => {
    return products.map((product: any) => {
      const { bestPrice, bestSupplierName } = getBestPriceInfoForProduct(product.product_id);
      
      const allPrices = fornecedores.map((f: any) => ({
        nome: f.nome,
        value: getSupplierProductValue(f.id, product.product_id)
      })).filter((p: any) => p.value > 0).sort((a: any, b: any) => a.value - b.value);

      const averagePrice = allPrices.length > 0 
        ? allPrices.reduce((acc: number, curr: any) => acc + curr.value, 0) / allPrices.length 
        : 0;

      const savings = averagePrice > 0 && bestPrice > 0 ? averagePrice - bestPrice : 0;

      return {
        productId: product.product_id,
        productName: product.product_name,
        quantidade: product.quantidade,
        unidade: product.unidade,
        bestPrice,
        bestSupplierName,
        allPrices,
        savings
      };
    }).sort((a: any, b: any) => b.savings - a.savings);
  }, [products, fornecedores, getBestPriceInfoForProduct, getSupplierProductValue]);

  // Callbacks de Ação
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
  }, [queryClient]);

  const handleUpdateSupplierProductValue = useCallback(async (params: any) => {
    await updateQuoteItemPrice.mutateAsync(params);
  }, [updateQuoteItemPrice]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[800px] p-0 overflow-hidden !bg-white/70 dark:!bg-gray-950/70 backdrop-blur-2xl border border-white/20 dark:border-white/10 flex flex-col shadow-2xl rounded-[2rem] animate-in fade-in zoom-in-95 duration-300">
        {/* Header com design semiglass - Compactado */}
        <div className="flex-shrink-0 px-5 py-3 border-b border-white/10 dark:border-white/5 bg-white/30 dark:bg-white/5 backdrop-blur-md relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-teal-500/5 to-transparent pointer-events-none"></div>
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white shadow-xl shadow-teal-500/20 ring-1 ring-white/20">
                <ClipboardList className="h-4 w-4" />
              </div>
              <div className="space-y-0.5">
                <DialogTitle className="text-lg font-black text-gray-900 dark:text-white tracking-tight">
                  Gerenciar Cotação
                </DialogTitle>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-[0.2em] bg-white/50 dark:bg-black/20 px-2 py-0.5 rounded-md border border-white/20 shadow-sm">
                    #{safeStr(quote.id).substring(0, 8)}
                  </span>
                  <div className="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                  <span className="text-[10px] text-teal-600 dark:text-teal-400 font-bold truncate max-w-[200px]">
                    {safeStr(quote.produto)}
                  </span>
                </div>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => onOpenChange(false)} 
              className="h-9 w-9 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-white/20 dark:hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-white/20 shadow-sm"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Tabs - Compactado */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-shrink-0 px-5 pt-3 bg-white/20 dark:bg-black/5">
            <TabsList className="w-full h-9 p-1 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl rounded-xl border border-white/30 dark:border-white/10 grid grid-cols-5 gap-1 shadow-inner">
              <TabsTrigger value="resumo" className="h-full text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all">
                <Package className="h-3 w-3 mr-1.5 hidden sm:block" /> Resumo
              </TabsTrigger>
              <TabsTrigger value="valores" className="h-full text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all">
                <DollarSign className="h-3 w-3 mr-1.5 hidden sm:block" /> Valores
              </TabsTrigger>
              <TabsTrigger value="converter" className="h-full text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all">
                <ShoppingCart className="h-3 w-3 mr-1.5 hidden sm:block" /> Pedido
              </TabsTrigger>
              <TabsTrigger value="editar" className="h-full text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all">
                <Settings className="h-3 w-3 mr-1.5 hidden sm:block" /> Editar
              </TabsTrigger>
              <TabsTrigger value="exportar" className="h-full text-[9px] font-black uppercase tracking-widest rounded-lg data-[state=active]:bg-white dark:data-[state=active]:bg-gray-800 data-[state=active]:text-teal-600 data-[state=active]:shadow-sm transition-all">
                <Download className="h-3 w-3 mr-1.5 hidden sm:block" /> Exportar
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <Suspense fallback={
              <div className="absolute inset-0 flex items-center justify-center bg-white/30 dark:bg-black/10 backdrop-blur-sm">
                <div className="flex flex-col items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 border-4 border-teal-500/20 border-t-teal-500 rounded-full animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-2 h-2 bg-teal-500 rounded-full animate-pulse"></div>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">Carregando...</span>
                </div>
              </div>
            }>
              <TabsContent value="resumo" className="h-full m-0 p-0 overflow-auto custom-scrollbar" forceMount={false}>
                {activeTab === 'resumo' && (
                  <QuoteSummaryTab 
                    stats={stats} 
                    melhorTotal={melhorTotal} 
                    productPricesData={productPricesData} 
                    safeStr={safeStr} 
                  />
                )}
              </TabsContent>
              
              <TabsContent value="valores" className="h-full m-0 p-0 overflow-hidden" forceMount={false}>
                {activeTab === 'valores' && (
                  <QuoteValuesTab 
                    products={products}
                    fornecedores={fornecedores}
                    quoteId={quote.id}
                    supplierItems={supplierItems}
                    onUpdateSupplierProductValue={handleUpdateSupplierProductValue}
                    onRefresh={handleRefresh}
                    isMobile={isMobile}
                    safeStr={safeStr}
                    getBestPriceInfoForProduct={getBestPriceInfoForProduct}
                  />
                )}
              </TabsContent>

              <TabsContent value="converter" className="h-full m-0 p-0 overflow-auto custom-scrollbar" forceMount={false}>
                {activeTab === 'converter' && (
                  <QuoteConversionTab 
                    products={products}
                    fornecedores={fornecedores}
                    quote={quote}
                    onConvertToOrder={convertToOrder.mutate}
                    onOpenChange={onOpenChange}
                    getSupplierProductValue={getSupplierProductValue}
                    getBestPriceInfoForProduct={getBestPriceInfoForProduct}
                    safeStr={safeStr}
                  />
                )}
              </TabsContent>

              <TabsContent value="editar" className="h-full m-0 p-0 overflow-auto custom-scrollbar" forceMount={false}>
                {activeTab === 'editar' && (
                  <QuoteEditTab 
                    products={products}
                    fornecedores={fornecedores}
                    availableProducts={availableProducts || []}
                    availableSuppliers={availableSuppliers || []}
                    onAddQuoteItem={addQuoteItem.mutateAsync}
                    onRemoveQuoteItem={removeQuoteItem.mutateAsync}
                    onAddQuoteSupplier={addQuoteSupplier.mutateAsync}
                    onRemoveQuoteSupplier={removeQuoteSupplier.mutateAsync}
                    quoteId={quote.id}
                    safeStr={safeStr}
                  />
                )}
              </TabsContent>

              <TabsContent value="exportar" className="h-full m-0 p-0 overflow-auto custom-scrollbar" forceMount={false}>
                {activeTab === 'exportar' && (
                  <QuoteExportTab quote={quote} />
                )}
              </TabsContent>
            </Suspense>
          </div>
        </Tabs>

        {/* Footer - Compactado */}
        <div className="flex-shrink-0 px-5 py-2 border-t border-white/20 dark:border-white/10 bg-white/40 dark:bg-gray-950/40 backdrop-blur-2xl flex justify-between items-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-t from-teal-500/5 to-transparent pointer-events-none"></div>
          <div className="flex items-center gap-2 relative z-10">
            <div className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse"></div>
            <span className="text-[8px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Modo de Gerenciamento</span>
          </div>
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            className="border-white/30 dark:border-white/10 bg-white/5 dark:bg-white/5 font-black text-[8px] uppercase tracking-[0.2em] h-8 px-4 hover:bg-white/10 transition-all rounded-lg backdrop-blur-md shadow-sm relative z-10"
          >
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
