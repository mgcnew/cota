import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ClipboardList, X, Loader2, Sparkles, MessageCircle, LayoutList, DollarSign, ShoppingCart, Pencil, Download, Scale } from "lucide-react";
import { useCotacoes } from "@/hooks/useCotacoes";
import { useProducts } from "@/hooks/useProducts";
import { useSuppliers } from "@/hooks/useSuppliers";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useKeyboardOffset } from "@/hooks/useKeyboardOffset";
import { useCompany } from "@/hooks/useCompany";
import { normalizePrice, PriceMetadata } from "@/utils/priceNormalization";
import ResumoCotacaoDialog from "./ResumoCotacaoDialog";
import { sendWhatsAppReportFile, generateQuoteReportHTML, DEFAULT_PHONE_NUMBER } from "@/lib/whatsapp-service";
import { toast as sonnerToast } from "sonner";
import { buildQuoteReportOpts, buildQuoteReportCaption, downloadQuoteReport } from "@/lib/quote-report";

interface GerenciarCotacaoDialogProps {
  quote: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { QuoteSummaryTab } from "@/components/cotacoes/view-dialog/QuoteSummaryTab";
import { QuoteValuesTab } from "@/components/cotacoes/view-dialog/QuoteValuesTab";
import { QuoteCompareTab } from "@/components/cotacoes/view-dialog/QuoteCompareTab";
import { QuoteConversionTab } from "@/components/cotacoes/view-dialog/QuoteConversionTab";
import { QuoteEditTab } from "@/components/cotacoes/view-dialog/QuoteEditTab";


export function GerenciarCotacaoDialog({ quote: initialQuote, open, onOpenChange }: GerenciarCotacaoDialogProps) {
  const { data: company } = useCompany();
  const [activeTab, setActiveTab] = useState("resumo");
  const [showResumoDialog, setShowResumoDialog] = useState(false);
  const [isExportingWhatsApp, setIsExportingWhatsApp] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);


  const {
    cotacoes,
    updateQuoteItemPrice,
    addQuoteItem,
    removeQuoteItem,
    addQuoteSupplier,
    removeQuoteSupplier,
    updateQuoteItemQuantity,
    convertToOrder,
    deleteQuote,
    removeSupplierProduct,
  } = useCotacoes();

  const { products: availableProducts } = useProducts();
  const { suppliers: availableSuppliers } = useSuppliers();

  // Find the latest version of this quote from the global state
  const quote = useMemo(() => {
    if (!initialQuote) return null;
    return cotacoes.find((c: any) => c.id === initialQuote.id) || initialQuote;
  }, [cotacoes, initialQuote]);

  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const keyboardOffset = useKeyboardOffset();
  
  const isFinalizada = quote?.status === "concluida";

  // Memos globais para evitar recálculos
  const products = useMemo(() => {
    if (!quote) return [];
    const rawItems = quote._raw?.quote_items || [];
    return rawItems.map((item: any) => ({
      product_id: item.product_id,
      product_name: item.product_name,
      quantidade: item.quantidade,
      unidade: item.unidade
    })).sort((a: any, b: any) => (a.product_name || '').localeCompare(b.product_name || ''));
  }, [quote?._raw]);

  const fornecedores = useMemo(() => {
    if (!quote) return [];
    const rawSuppliers = quote._raw?.quote_suppliers || [];
    return rawSuppliers.map((cf: any) => {
      // Find the supplier info to get the contact (seller) name
      const supplierInfo = availableSuppliers?.find((s: any) => s.id === cf.supplier_id);
      return {
        id: cf.supplier_id,
        nome: cf.supplier_name,
        contato: supplierInfo?.contact || cf.supplier_name, // Fallback to company name
        phone: supplierInfo?.phone || "",
        status: cf.status,
        accessToken: cf.access_token
      };
    });
  }, [quote?._raw, availableSuppliers]);

  const supplierItems = useMemo(() => {
    if (!quote) return [];
    return quote._supplierItems || [];
  }, [quote?._supplierItems, quote]); // Add quote to dependency to force re-calc

  // Reset to resumo when closing or when quote is finalized and on an invalid tab
  useEffect(() => {
    if (!open) { setActiveTab('resumo'); return; }
    if (isFinalizada && (activeTab === 'converter' || activeTab === 'editar')) {
      setActiveTab('resumo');
    }
  }, [open, isFinalizada, activeTab]);

  // Helpers
  const safeStr = useCallback((val: any) => val || "", []);

  const getSupplierProductValue = useCallback((supplierId: string, productId: string) => {
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    return item?.valor_oferecido || 0;
  }, [supplierItems]);

  const getNormalizedTotalPrice = useCallback((supplierId: string, productId: string): number => {
    const item = supplierItems.find((i: any) => i?.supplier_id === supplierId && i?.product_id === productId);
    if (!item || !item.valor_oferecido || item.valor_oferecido <= 0) return 0;

    const product = products.find((p: any) => p.product_id === productId);
    if (!product) return 0;

    try {
      const priceMetadata: PriceMetadata = {
        valorOferecido: item.valor_oferecido,
        unidadePreco: item.unidade_preco || 'un',
        fatorConversao: item.fator_conversao || undefined,
        quantidadePorEmbalagem: item.quantidade_por_embalagem || undefined,
      };

      const normalized = normalizePrice(priceMetadata, product.quantidade, product.unidade);
      return normalized.valorTotal;
    } catch {
      return item.valor_oferecido * product.quantidade;
    }
  }, [supplierItems, products]);

  const getBestPriceInfoForProduct = useCallback((productId: string) => {
    const validPrices = supplierItems.filter((i: any) => i?.product_id === productId && i?.valor_oferecido > 0);
    const product = products.find((p: any) => p.product_id === productId);

    if (validPrices.length === 0 || !product) {
      return { bestPrice: 0, bestSupplierId: null, bestSupplierName: "" };
    }

    let bestNormalized = Infinity;
    let bestUnitPrice = 0;
    let bestSupplierId = null;
    let bestSupplierName = "";

    validPrices.forEach((priceItem: any) => {
      try {
        const meta: PriceMetadata = {
          valorOferecido: priceItem.valor_oferecido,
          unidadePreco: priceItem.unidade_preco || 'un',
          fatorConversao: priceItem.fator_conversao || undefined,
          quantidadePorEmbalagem: priceItem.quantidade_por_embalagem || undefined,
        };
        const normalized = normalizePrice(meta, product.quantidade, product.unidade);
        const compare = normalized.valorTotal > 0 ? normalized.valorTotal : priceItem.valor_oferecido;
        if (compare < bestNormalized) {
          bestNormalized = compare;
          bestUnitPrice = normalized.valorUnitario;
          bestSupplierId = priceItem.supplier_id;
          const supplier = fornecedores.find((f: any) => f.id === priceItem.supplier_id);
          bestSupplierName = supplier ? supplier.nome : "";
        }
      } catch {
        if (priceItem.valor_oferecido < bestNormalized) {
          bestNormalized = priceItem.valor_oferecido;
          bestUnitPrice = priceItem.valor_oferecido;
          bestSupplierId = priceItem.supplier_id;
          const supplier = fornecedores.find((f: any) => f.id === priceItem.supplier_id);
          bestSupplierName = supplier ? supplier.nome : "";
        }
      }
    });

    return {
      bestPrice: bestNormalized === Infinity ? 0 : bestNormalized,
      bestUnitPrice: bestNormalized === Infinity ? 0 : bestUnitPrice,
      bestSupplierId,
      bestSupplierName,
    };
  }, [supplierItems, fornecedores, products]);

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

  const productPricesData = useMemo(() => {
    return products.map((product: any) => {
      const { bestPrice, bestUnitPrice, bestSupplierId, bestSupplierName } = getBestPriceInfoForProduct(product.product_id);

      const allPrices = fornecedores.map((f: any) => {
        const item = supplierItems.find((i: any) => i?.supplier_id === f.id && i?.product_id === product.product_id);
        const currentPrice = item?.valor_oferecido || 0;
        const initialPrice = item?.price_history && item.price_history.length > 0 
          ? item.price_history[0].old_price 
          : currentPrice;

        return {
          nome: f.nome,
          fornecedorId: f.id,
          value: currentPrice,
          valor_inicial: initialPrice,
          observacoes: item?.observacoes ?? null,
        };
      }).filter((p: any) => p.value > 0).sort((a: any, b: any) => a.value - b.value);

      const averagePrice = allPrices.length > 0
        ? allPrices.reduce((acc: number, curr: any) => acc + curr.value, 0) / allPrices.length
        : 0;

      const savings = averagePrice > 0 && bestPrice > 0 ? averagePrice - bestPrice : 0;

      const bestItem = allPrices.find((p: any) => p.fornecedorId === bestSupplierId);
      return {
        productId: product.product_id,
        productName: product.product_name,
        quantidade: product.quantidade,
        unidade: product.unidade,
        bestPrice,
        bestUnitPrice,
        bestSupplierId,
        bestSupplierName,
        bestObservacoes: bestItem?.observacoes ?? null,
        allPrices,
        savings
      };
    }).sort((a: any, b: any) => b.savings - a.savings);
  }, [products, fornecedores, getBestPriceInfoForProduct, getSupplierProductValue]);

  const melhorTotal = useMemo(() => {
    return productPricesData.reduce((total, item) => total + (item.bestPrice > 0 ? item.bestPrice : 0), 0);
  }, [productPricesData]);

  // Callbacks de Ação
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["cotacoes"] });
  }, [queryClient]);

  const handleUpdateSupplierProductValue = useCallback(async (params: any) => {
    await updateQuoteItemPrice.mutateAsync(params);
  }, [updateQuoteItemPrice]);

  const handleRemoveSupplierProduct = useCallback(async (params: any) => {
    await removeSupplierProduct.mutateAsync(params);
  }, [removeSupplierProduct]);



  // Monta o mesmo relatório profissional usado no Resumo (fonte única)
  const buildReport = useCallback(() => {
    const opts = buildQuoteReportOpts({
      quoteId: safeStr(quote.id),
      dateLabel: safeStr(quote.dataInicio),
      companyName: company?.name || "MERCADÃO NOVO BOI JOÃO DIAS",
      products,
      fornecedores,
      supplierItems,
      viewMode: "winners",
    });
    return { html: generateQuoteReportHTML(opts), caption: buildQuoteReportCaption(opts) };
  }, [quote, products, fornecedores, supplierItems, company?.name, safeStr]);

  const handleDownloadReport = useCallback(() => {
    const { html } = buildReport();
    if (!html) { sonnerToast.error("Não há dados para exportar."); return; }
    downloadQuoteReport(html, safeStr(quote.id));
    sonnerToast.success("Relatório HTML baixado com sucesso!");
  }, [buildReport, quote, safeStr]);

  const handleWhatsAppExport = useCallback(async () => {
    if (isExportingWhatsApp) return;

    setIsExportingWhatsApp(true);
    const toastId = sonnerToast.loading('Enviando relatório para WhatsApp...');

    try {
      const { html, caption } = buildReport();
      if (!html) throw new Error("Não há dados para exportar.");

      const quoteId = safeStr(quote.id);

      const res = await sendWhatsAppReportFile(
        (window as any).DEFAULT_PHONE_NUMBER || DEFAULT_PHONE_NUMBER,
        html,
        quoteId,
        caption,
        company?.id
      );

      if (res.success) {
        sonnerToast.success('Relatório enviado com sucesso via WhatsApp!', { id: toastId });
      } else {
        throw new Error(res.error || "Erro no envio");
      }
    } catch (error: any) {
      console.error("WhatsApp Export Error:", error);
      sonnerToast.error(`Falha no envio: ${error.message}`, { id: toastId });
    } finally {
      setIsExportingWhatsApp(false);
    }
  }, [buildReport, quote, company?.id, isExportingWhatsApp, safeStr]);

  if (!initialQuote || !quote) return null;

  const DialogContentComponent = isMobile ? DrawerContent : DialogContent;
  const DialogTitleComponent = isMobile ? DrawerTitle : DialogTitle;

  const modalContent = (
    <div ref={captureRef} data-capture-container="true" className="flex-1 min-h-0 h-full flex flex-col bg-background">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col min-h-0 bg-transparent overflow-hidden">
        {/* Header */}
        <div className="flex flex-col">
          {/* Title row */}
          <div className="flex items-center justify-between px-5 pt-3 pb-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-[10px] bg-brand/10 border border-brand/20">
                <ClipboardList className="h-4 w-4 text-brand" />
              </div>
              <div className="flex flex-col">
                <DialogTitleComponent className="text-base font-black text-foreground tracking-tight leading-none mb-1">
                  Cotação
                </DialogTitleComponent>
                <span className="text-[10px] font-black uppercase text-muted-foreground tracking-widest leading-none">
                  #{safeStr(quote.id).substring(0, 8)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1 border-r border-border pr-2 mr-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownloadReport}
                  className="text-brand hover:bg-brand/5 h-8 w-8 rounded-lg transition-all"
                  title="Baixar relatório (HTML)"
                >
                  <Download className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleWhatsAppExport}
                  disabled={isExportingWhatsApp}
                  className="text-brand hover:bg-brand/5 h-8 w-8 rounded-lg transition-all"
                  title="Enviar para WhatsApp"
                >
                  {isExportingWhatsApp ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowResumoDialog(true)}
                  className="text-brand hover:bg-brand/5 h-8 w-8 rounded-lg transition-all"
                  title="Relatório Profissional"
                >
                  <Sparkles className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className="h-8 w-8 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-4 w-4 text-muted-foreground" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
          </div>

          {/* Tab bar */}
          <div className="border-b border-border dark:border-white/5 px-2">
            <div className={cn("grid gap-0", isFinalizada ? "grid-cols-3" : "grid-cols-5")}>
              {[
                { id: 'resumo',    label: 'Resumo',   icon: LayoutList },
                { id: 'valores',   label: 'Valores',  icon: DollarSign },
                { id: 'comparar',  label: 'Comparar', icon: Scale },
                { id: 'converter', label: 'Pedido',   icon: ShoppingCart, hide: isFinalizada },
                { id: 'editar',    label: 'Editar',   icon: Pencil,       hide: isFinalizada },
              ].filter(tab => !tab.hide).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex flex-col items-center gap-1 py-2.5 px-1 text-center border-b-2 transition-colors",
                    activeTab === tab.id
                      ? "border-brand text-brand"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  <tab.icon className="h-4 w-4" />
                  <span className="text-[10px] font-semibold leading-none">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex-1 min-h-0 relative bg-background flex flex-col overflow-visible">
            <TabsContent value="resumo" className="flex-1 min-h-0 m-0 p-0 overflow-y-auto custom-scrollbar data-[state=active]:flex flex-col">
              <QuoteSummaryTab
                stats={stats}
                melhorTotal={melhorTotal}
                productPricesData={productPricesData}
                safeStr={safeStr}
              />
            </TabsContent>

            <TabsContent value="valores" className="flex-1 min-h-0 m-0 p-0 overflow-hidden data-[state=active]:flex flex-col">
              {activeTab === 'valores' && (
                <QuoteValuesTab
                  products={products}
                  fornecedores={fornecedores}
                  quoteId={quote.id}
                  supplierItems={supplierItems}
                  onUpdateSupplierProductValue={handleUpdateSupplierProductValue}
                  onRemoveSupplierProduct={handleRemoveSupplierProduct}
                  onRefresh={handleRefresh}
                  isMobile={isMobile}
                  safeStr={safeStr}
                  getBestPriceInfoForProduct={getBestPriceInfoForProduct}
                  getNormalizedTotalPrice={getNormalizedTotalPrice}
                  getSupplierProductValue={getSupplierProductValue}
                  isReadOnly={isFinalizada}
                />
              )}
            </TabsContent>

            <TabsContent value="comparar" className="flex-1 min-h-0 m-0 p-0 overflow-y-auto custom-scrollbar data-[state=active]:flex flex-col">
              {activeTab === 'comparar' && (
                <QuoteCompareTab
                  products={products}
                  fornecedores={fornecedores}
                  supplierItems={supplierItems}
                  safeStr={safeStr}
                />
              )}
            </TabsContent>

            <TabsContent value="converter" className="flex-1 min-h-0 m-0 p-0 overflow-y-auto custom-scrollbar data-[state=active]:flex flex-col">
              {activeTab === 'converter' && (
                <QuoteConversionTab
                  products={products}
                  fornecedores={fornecedores}
                  quote={quote}
                  onConvertToOrder={(quoteId, orders) => convertToOrder.mutate({ quoteId, orders })}
                  onOpenChange={onOpenChange}
                  getSupplierProductValue={getSupplierProductValue}
                  getBestPriceInfoForProduct={getBestPriceInfoForProduct}
                  supplierItems={supplierItems}
                  safeStr={safeStr}
                  onShowResumo={() => setShowResumoDialog(true)}
                />
              )}
            </TabsContent>

            <TabsContent value="editar" className="flex-1 min-h-0 m-0 p-0 overflow-y-auto custom-scrollbar data-[state=active]:flex flex-col">
              {activeTab === 'editar' && (
                <QuoteEditTab
                  products={products}
                  fornecedores={fornecedores}
                  availableProducts={availableProducts || []}
                  availableSuppliers={availableSuppliers || []}
                  onAddQuoteItem={addQuoteItem.mutateAsync}
                  onRemoveQuoteItem={(productId) => removeQuoteItem.mutateAsync({ quoteId: quote.id, productId })}
                  onAddQuoteSupplier={(supplierId) => {
                    const supplier = availableSuppliers.find(s => s.id === supplierId);
                    return addQuoteSupplier.mutateAsync({
                      quoteId: quote.id,
                      supplierId,
                      supplierName: supplier?.name || "Desconhecido"
                    });
                  }}
                  onRemoveQuoteSupplier={(supplierId) => removeQuoteSupplier.mutateAsync({ quoteId: quote.id, supplierId })}
                  onUpdateQuoteItemQuantity={(productId, quantidade, unidade) => updateQuoteItemQuantity.mutateAsync({ quoteId: quote.id, productId, quantidade, unidade })}
                  quoteId={quote.id}
                  safeStr={safeStr}
                />
              )}
            </TabsContent>
        </div>
      </Tabs>

    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent
          className="rounded-t-2xl p-0 overflow-hidden flex flex-col bg-background border-t border-border dark:border-white/5"
          style={{
            height: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
            maxHeight: keyboardOffset > 0 ? `calc(100vh - ${keyboardOffset}px)` : '95vh',
            paddingBottom: keyboardOffset > 0 ? 0 : 'env(safe-area-inset-bottom, 20px)'
          }}
        >
          <DrawerTitle className="sr-only">Gerenciar Cotação</DrawerTitle>
          <DrawerDescription className="sr-only">Detalhes e ações da cotação</DrawerDescription>
          {modalContent}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          hideClose
          className={cn(
            "max-w-[1000px] p-0 overflow-hidden flex flex-col border border-border dark:border-white/5 bg-background rounded-2xl shadow-2xl",
            // Altura FIXA e única para todas as abas (mesmo padrão da aba Valores):
            // com altura definida, o wrapper interno preenche por completo e o fundo
            // fica uniforme (bg-background) em qualquer aba, sem expor a moldura.
            // O scroll de cada aba fica por conta do próprio TabsContent/área interna.
            "h-[72vh]"
          )}
        >
          <DialogTitle className="sr-only">Gerenciar Cotação</DialogTitle>
          <DialogDescription className="sr-only">Detalhes e ações da cotação</DialogDescription>
          {modalContent}
        </DialogContent>
      </Dialog>

      {showResumoDialog && (
        <ResumoCotacaoDialog
          open={showResumoDialog}
          onOpenChange={setShowResumoDialog}
          quote={quote}
        />
      )}
    </>
  );
}

