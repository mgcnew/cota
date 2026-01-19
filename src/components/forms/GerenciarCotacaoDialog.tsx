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

interface GerenciarCotacaoDialogProps {
  quote: any;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

import { Skeleton } from "@/components/ui/skeleton";

// Skeleton para cada aba
const TabSkeleton = ({ type }: { type: string }) => {
  if (type === 'resumo') {
    return (
      <div className="p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-xl" />
      </div>
    );
  }
  if (type === 'valores') {
    return (
      <div className="h-full flex">
        <div className="w-64 border-r border-gray-200 dark:border-gray-800 p-3 space-y-2">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 rounded-lg" />)}
        </div>
        <div className="flex-1 p-5 space-y-4">
          <div className="flex justify-between">
            <Skeleton className="h-10 w-48 rounded-lg" />
            <Skeleton className="h-10 w-24 rounded-lg" />
          </div>
          {[1, 2, 3, 4, 5, 6].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
        </div>
      </div>
    );
  }
  return (
    <div className="p-5 space-y-4">
      {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
    </div>
  );
};

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

  // Exportação em HTML
  const generateHtmlComparative = useCallback(() => {
    if (!quote || !products.length) return "";

    const formatCurrency = (value: number) => {
      return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    // Calcular comparativo
    const comparison = products.map((product: any) => {
      const fornecedores = quote.fornecedoresParticipantes
        .map((f: any) => {
          // Normalizar valores para comparação
          const item = supplierItems.find((i: any) => i?.supplier_id === f.id && i?.product_id === product.product_id);
          const valor = item?.valor_oferecido || 0;
          
          let valorNormalizado = valor;
          if (item?.unidade_preco === 'cx' && item?.fator_conversao) {
            valorNormalizado = valor / item.fator_conversao;
          } else if (item?.unidade_preco === 'pct' && item?.fator_conversao) {
            valorNormalizado = valor / item.fator_conversao;
          } else if (item?.unidade_preco === 'kg' && product.unidade === 'g') {
            valorNormalizado = valor / 1000;
          } else if (item?.unidade_preco === 'ton' && product.unidade === 'kg') {
            valorNormalizado = valor / 1000;
          }

          return {
            supplierId: f.id,
            supplierName: f.nome,
            valorOferecido: valor,
            valorNormalizado: valorNormalizado,
            isMelhorPreco: false,
          };
        })
        .filter((f: any) => f.valorOferecido > 0);

      // Marcar melhor preço
      if (fornecedores.length > 0) {
        const menorValor = Math.min(...fornecedores.map((f: any) => f.valorNormalizado));
        fornecedores.forEach((f: any) => {
          if (f.valorNormalizado === menorValor) {
            f.isMelhorPreco = true;
          }
        });
      }

      return {
        productId: product.product_id,
        productName: product.product_name,
        quantidade: product.quantidade,
        unidade: product.unidade,
        fornecedores,
      };
    });

    // Calcular vencedores
    const wins: Record<string, { name: string; wins: number; totalValue: number }> = {};
    comparison.forEach((comp: any) => {
      const winner = comp.fornecedores.find((f: any) => f.isMelhorPreco);
      if (winner) {
        if (!wins[winner.supplierId]) {
          wins[winner.supplierId] = { name: winner.supplierName, wins: 0, totalValue: 0 };
        }
        wins[winner.supplierId].wins++;
        wins[winner.supplierId].totalValue += winner.valorOferecido;
      }
    });
    const winsPerSupplier = Object.values(wins).sort((a: any, b: any) => b.wins - a.wins);

    // Gerar HTML
    const html = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Comparativo de Cotação - ${quote.id.substring(0, 8)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background: #f9fafb; color: #1f2937; line-height: 1.6; }
    .container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1f2937 0%, #111827 100%); color: white; padding: 40px 20px; border-radius: 12px; margin-bottom: 30px; text-align: center; }
    .header h1 { font-size: 28px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px; }
    .header p { font-size: 14px; opacity: 0.9; text-transform: uppercase; letter-spacing: 1px; }
    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; margin-bottom: 30px; }
    .info-card { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #1f2937; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .info-card strong { display: block; color: #1f2937; margin-bottom: 5px; font-size: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .info-card span { font-size: 14px; color: #4b5563; font-weight: 600; }
    .winners-section { background: white; padding: 25px; border-radius: 8px; margin-bottom: 30px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .winners-section h2 { color: #111827; margin-bottom: 15px; font-size: 18px; display: flex; align-items: center; gap: 10px; text-transform: uppercase; letter-spacing: 1px; }
    .winners-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px; }
    .winner-card { background: #f9fafb; padding: 15px; border-radius: 8px; border: 1px solid #e5e7eb; }
    .winner-card .rank { display: inline-block; background: #111827; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold; margin-bottom: 8px; }
    .winner-card .name { font-weight: 700; color: #111827; margin-bottom: 5px; font-size: 16px; }
    .winner-card .wins { font-size: 14px; color: #4b5563; }
    .comparatives { display: grid; gap: 20px; }
    .comparative-card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .comparative-header { background: #f9fafb; padding: 15px; border-bottom: 2px solid #1f2937; }
    .comparative-header h3 { color: #111827; font-size: 16px; display: flex; align-items: center; gap: 8px; font-weight: 800; }
    .comparative-header .qty { font-size: 11px; color: #6b7280; font-weight: 700; margin-left: auto; text-transform: uppercase; letter-spacing: 1px; }
    .comparative-table { width: 100%; border-collapse: collapse; }
    .comparative-table th { background: #f9fafb; padding: 12px; text-align: left; font-weight: 700; font-size: 11px; color: #6b7280; border-bottom: 1px solid #e5e7eb; text-transform: uppercase; letter-spacing: 1px; }
    .comparative-table td { padding: 12px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
    .comparative-table tr:hover { background: #f9fafb; }
    .winner-row { background: #f3f4f6 !important; }
    .winner-row td { font-weight: 700; color: #000; }
    .badge { display: inline-block; padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
    .badge-winner { background: #000; color: white; }
    .badge-difference { background: #f3f4f6; color: #4b5563; border: 1px solid #e5e7eb; }
    .no-response { padding: 20px; text-align: center; color: #9ca3af; font-style: italic; }
    .footer { text-align: center; padding: 20px; color: #9ca3af; font-size: 12px; margin-top: 40px; border-top: 1px solid #e5e7eb; }
    @media print {
      body { background: white; }
      .container { max-width: 100%; padding: 10px; }
      .header { padding: 20px; margin-bottom: 20px; }
      .comparative-card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏆 COMPARATIVO DE COTAÇÃO</h1>
      <p>Cotação #${quote.id.substring(0, 8)}</p>
    </div>

    <div class="info-grid">
      <div class="info-card">
        <strong>Período</strong>
        <span>${quote.dataInicio} a ${quote.dataFim}</span>
      </div>
      <div class="info-card">
        <strong>Produtos</strong>
        <span>${products.length} itens</span>
      </div>
      <div class="info-card">
        <strong>Fornecedores</strong>
        <span>${quote.fornecedoresParticipantes.length} participantes</span>
      </div>
      <div class="info-card">
        <strong>Gerado em</strong>
        <span>${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}</span>
      </div>
    </div>

    ${winsPerSupplier.length > 0 ? `
    <div class="winners-section">
      <h2>🎯 Ranking de Fornecedores</h2>
      <div class="winners-list">
        ${winsPerSupplier.map((w: any, idx: number) => `
          <div class="winner-card">
            <div class="rank">#${idx + 1} - ${w.wins} ${w.wins === 1 ? 'produto' : 'produtos'}</div>
            <div class="name">${w.name}</div>
            <div class="wins">Melhor preço em ${w.wins} ${w.wins === 1 ? 'produto' : 'produtos'}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}

    <div class="comparatives">
      ${comparison.map((comp: any, idx: number) => `
        <div class="comparative-card">
          <div class="comparative-header">
            <h3>
              <span>${idx + 1}. ${comp.productName}</span>
              <span class="qty">${comp.quantidade} ${comp.unidade}</span>
            </h3>
          </div>
          ${comp.fornecedores.length === 0 ? `
            <div class="no-response">
              Nenhum fornecedor ofereceu preço para este produto
            </div>
          ` : `
            <table class="comparative-table">
              <thead>
                <tr>
                  <th>Fornecedor</th>
                  <th>Valor Oferecido</th>
                  <th>Valor Unit. Normalizado</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${comp.fornecedores
                  .sort((a: any, b: any) => a.valorNormalizado - b.valorNormalizado)
                  .map((f: any) => {
                    const melhorValor = Math.min(...comp.fornecedores.map((x: any) => x.valorNormalizado));
                    const diferenca = melhorValor > 0 ? ((f.valorNormalizado - melhorValor) / melhorValor * 100) : 0;
                    return `
                  <tr class="${f.isMelhorPreco ? 'winner-row' : ''}">
                    <td>${f.supplierName}</td>
                    <td>R$ ${formatCurrency(f.valorOferecido)}</td>
                    <td><strong>R$ ${formatCurrency(f.valorNormalizado)}</strong></td>
                    <td>
                      ${f.isMelhorPreco 
                        ? '<span class="badge badge-winner">🏆 MELHOR PREÇO</span>' 
                        : `<span class="badge badge-difference">+${diferenca.toFixed(1)}%</span>`
                      }
                    </td>
                  </tr>
                `}).join('')}
              </tbody>
            </table>
          `}
        </div>
      `).join('')}
    </div>

    <div class="footer">
      <p>Sistema CotaJá - Comparativo de Cotação</p>
      <p>Este documento foi gerado automaticamente e contém informações confidenciais.</p>
    </div>
  </div>
</body>
</html>
    `;

    return html;
  }, [quote, products, supplierItems]);

  const handleExportHtml = useCallback(() => {
    try {
      const html = generateHtmlComparative();
      if (!html) {
        toast({ title: "Erro ao gerar exportação", description: "Não há dados suficientes para exportar.", variant: "destructive" });
        return;
      }

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `cotacao-${quote.id.substring(0, 8)}-${quote.dataInicio.replace(/\//g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      toast({ title: "Exportação concluída", description: "O arquivo foi baixado com sucesso." });
    } catch (error) {
      console.error("Erro ao exportar:", error);
      toast({ title: "Erro ao exportar", description: "Ocorreu um erro ao gerar o arquivo.", variant: "destructive" });
    }
  }, [generateHtmlComparative, quote, toast]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl w-[95vw] h-[90vh] max-h-[800px] p-0 overflow-hidden !bg-white/80 dark:!bg-gray-950/80 backdrop-blur-xl border border-gray-200/60 dark:border-gray-700/30 flex flex-col shadow-2xl rounded-[2rem] animate-in fade-in zoom-in-95 duration-300">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
          {/* Header Compacto com Tabs Integradas */}
          <div className="flex-shrink-0 px-4 py-2 border-b border-gray-200/60 dark:border-gray-700/40 bg-white/40 dark:bg-gray-900/40 backdrop-blur-md relative overflow-hidden flex items-center justify-between">
            <div className="absolute inset-0 bg-gradient-to-r from-gray-500/5 to-transparent pointer-events-none"></div>
            
            <div className="flex items-center gap-4 relative z-10">
              {/* Título Minimalista */}
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center text-white dark:text-gray-900 shadow-lg ring-1 ring-white/20">
                  <ClipboardList className="h-3.5 w-3.5" />
                </div>
                <div className="flex flex-col">
                  <DialogTitle className="text-sm font-black text-gray-900 dark:text-white tracking-tight leading-none">
                    Gerenciar
                  </DialogTitle>
                  <span className="text-[8px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest mt-0.5">
                    #{safeStr(quote.id).substring(0, 8)}
                  </span>
                </div>
              </div>

              {/* Tabs no Header */}
              <TabsList className="h-8 p-0.5 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-2xl rounded-lg border border-gray-200/60 dark:border-gray-700/40 flex shadow-inner">
                <TabsTrigger value="resumo" className="h-full px-3 text-[9px] font-black uppercase tracking-widest rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-gray-500 dark:text-gray-400">
                  Resumo
                </TabsTrigger>
                <TabsTrigger value="valores" className="h-full px-3 text-[9px] font-black uppercase tracking-widest rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-gray-500 dark:text-gray-400">
                  Valores
                </TabsTrigger>
                <TabsTrigger value="converter" className="h-full px-3 text-[9px] font-black uppercase tracking-widest rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-gray-500 dark:text-gray-400">
                  Pedido
                </TabsTrigger>
                <TabsTrigger value="editar" className="h-full px-3 text-[9px] font-black uppercase tracking-widest rounded-md data-[state=active]:bg-white dark:data-[state=active]:bg-gray-700 data-[state=active]:text-gray-900 dark:data-[state=active]:text-white data-[state=active]:shadow-sm transition-all text-gray-500 dark:text-gray-400">
                  Editar
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleExportHtml} 
                className="h-8 px-2.5 text-[9px] font-black uppercase tracking-widest text-blue-600 dark:text-blue-400 border-blue-200/60 dark:border-blue-700/40 bg-blue-50/50 dark:bg-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-800 transition-all duration-200 rounded-lg shadow-sm hidden sm:flex"
              >
                <Download className="h-3 w-3 mr-1.5" />
                Exportar
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => onOpenChange(false)} 
                className="h-8 w-8 text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-800/50 rounded-lg transition-all border border-transparent hover:border-gray-200/50 dark:hover:border-gray-700/50 shadow-sm"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Fechar</span>
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
            <Suspense fallback={<TabSkeleton type={activeTab} />}>
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
            </Suspense>
          </div>
        </Tabs>

        {/* Footer Minimalista */}
        <div className="flex-shrink-0 px-4 py-1.5 border-t border-gray-200/60 dark:border-gray-700/40 bg-gray-50/30 dark:bg-gray-800/30 backdrop-blur-2xl flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-1 w-1 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-[7px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">Painel Ativo</span>
          </div>
          <span className="text-[7px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
            CotaJá v2.0
          </span>
        </div>
      </DialogContent>
    </Dialog>
  );
}
